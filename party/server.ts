import type * as Party from "partykit/server";

/**
 * PartyKit server backing Modelizia real-time collaboration (dev + prod).
 *
 * One PartyKit *room* per collaboration room id — `/parties/main/<roomId>`,
 * which is exactly how the client transport (`src/lib/collab/transport.ts`
 * via `partysocket`) addresses peers: every browser joined to the same
 * `roomId` lands on this server instance, so rooms stay fully isolated.
 *
 * Responsibilities:
 *
 * 1. **Broadcast** — every JSON {@link WireEnvelope} received from a client is
 *    relayed to the *other* connections of the same room (`room.broadcast`
 *    excluding the sender; the client additionally drops its own echoes by
 *    `senderId`). The envelope shape mirrors `TransportEnvelope` on the client
 *    (`v`, `topic`, `senderId`, `payload`), so presence, graph mutations,
 *    cursors and the late-joiner `sync_request` / `sync_state` sub-protocol all
 *    flow through untouched.
 * 2. **Persistent canvas state per room** — snapshots carrying the full
 *    `{ tables, relations, enums }` graph (topic `graph`, or `sync_state` on
 *    the `collab` topic) are persisted in the room's durable storage
 *    (`room.storage`: a Cloudflare Durable Object store in production, a local
 *    store under `partykit dev`). Writes are serialised so the stored snapshot
 *    can never regress to an older mutation under concurrency.
 * 3. **Connection handling** — a newly connected client immediately receives
 *    the persisted canvas snapshot (late-joiner catch-up even when no peer is
 *    left in the room), and a lone `sync_request` is answered straight from
 *    storage. When other clients are connected they own that answer instead —
 *    they hold state at least as fresh as storage.
 *
 * ## Running
 *
 * - Local: `pnpm party:dev` → `ws://localhost:1999` (see `.env.local`).
 * - Production: `partykit deploy`, then point `NEXT_PUBLIC_PARTYKIT_HOST` at
 *   the deployed host (e.g. `modelizia-collab.<account>.partykit.dev`).
 */

/** Multiplexed channels carried over the socket (mirrors the client). */
const TOPICS = ["collab", "graph", "cursor"] as const;

/** Wire envelope — structurally identical to the client's `TransportEnvelope`. */
interface WireEnvelope {
  v: 1;
  topic: (typeof TOPICS)[number];
  senderId: string;
  payload: unknown;
}

/** Minimal shape of a canvas snapshot (mirrors `GraphMutationPayload`). */
interface CanvasSnapshot {
  tables: unknown[];
  relations: unknown[];
  enums: unknown[];
}

/** Durable storage key of the room's latest canvas snapshot. */
const CANVAS_STATE_KEY = "canvasState";

/** `senderId` used for envelopes authored by the server itself. */
const SERVER_SENDER_ID = "partykit";

/** WebSocket `OPEN` ready state (the CF WebSocket contract exposes it raw). */
const WS_OPEN = 1;

/** Runtime validation of an inbound envelope (clients are untrusted). */
function parseEnvelope(raw: string): WireEnvelope | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const envelope = parsed as Partial<WireEnvelope>;
  if (
    envelope.v !== 1 ||
    typeof envelope.topic !== "string" ||
    !(TOPICS as readonly string[]).includes(envelope.topic) ||
    typeof envelope.senderId !== "string" ||
    envelope.senderId.length === 0 ||
    !("payload" in envelope)
  ) {
    return null;
  }
  return envelope as WireEnvelope;
}

/** Runtime check for the `{ tables, relations, enums }` snapshot shape. */
function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<CanvasSnapshot>;
  return (
    Array.isArray(snapshot.tables) &&
    Array.isArray(snapshot.relations) &&
    Array.isArray(snapshot.enums)
  );
}

/**
 * Extract the canvas snapshot an envelope carries, if any: live graph
 * mutations (topic `graph`) and late-joiner `sync_state` answers (topic
 * `collab`) both embed the authoritative `{ tables, relations, enums }`.
 */
function readCanvasSnapshot(envelope: WireEnvelope): CanvasSnapshot | null {
  if (!envelope.payload || typeof envelope.payload !== "object") return null;
  const payload = envelope.payload as { type?: unknown; payload?: unknown };
  if (envelope.topic === "graph" && payload.type === "GRAPH_MUTATION") {
    return isCanvasSnapshot(payload.payload) ? payload.payload : null;
  }
  if (envelope.topic === "collab" && payload.type === "sync_state") {
    return isCanvasSnapshot(payload.payload) ? payload.payload : null;
  }
  return null;
}

/** Whether the envelope is a late-joiner catch-up request. */
function isSyncRequest(envelope: WireEnvelope): boolean {
  return (
    envelope.topic === "collab" &&
    !!envelope.payload &&
    typeof envelope.payload === "object" &&
    (envelope.payload as { type?: unknown }).type === "sync_request"
  );
}

/** Server-authored envelope carrying the persisted canvas as a live mutation. */
function graphEnvelope(snapshot: CanvasSnapshot): string {
  return JSON.stringify({
    v: 1,
    topic: "graph",
    senderId: SERVER_SENDER_ID,
    payload: { type: "GRAPH_MUTATION", payload: snapshot },
  } satisfies WireEnvelope);
}

/** Server-authored envelope answering a `sync_request` from storage. */
function syncStateEnvelope(snapshot: CanvasSnapshot): string {
  return JSON.stringify({
    v: 1,
    topic: "collab",
    senderId: SERVER_SENDER_ID,
    payload: { type: "sync_state", payload: snapshot },
  } satisfies WireEnvelope);
}

/**
 * Modelizia collaboration room: relays envelopes between the connected
 * clients and keeps the canvas state durable across sessions.
 *
 * Exported as the default PartyKit entry point (`partykit.json#main`).
 */
export default class ModeliziaRoom implements Party.Server {
  private persistQueue: Promise<void> = Promise.resolve();

  constructor(readonly room: Party.Room) {}

  /**
   * A client just opened the socket: replay the persisted canvas snapshot so
   * a newcomer catches up without waiting for another peer to answer its
   * `sync_request` (and even when the room is otherwise empty).
   */
  async onConnect(conn: Party.Connection): Promise<void> {
    await this.persistQueue;
    const snapshot = await this.room.storage.get<CanvasSnapshot>(CANVAS_STATE_KEY);
    if (snapshot === undefined || conn.readyState !== WS_OPEN) return;
    conn.send(graphEnvelope(snapshot));
  }

  /**
   * Relay + persist one client message.
   *
   * Order matters: the broadcast happens synchronously (before any `await`)
   * so peers receive envelopes exactly as the sender emitted them, while
   * storage writes queue behind `persistQueue` to keep arrival order.
   */
  async onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Party.Connection,
  ): Promise<void> {
    // Clients only speak JSON text frames; drop anything else.
    if (typeof message !== "string") return;
    const envelope = parseEnvelope(message);
    if (!envelope) return;

    // Relay to every *other* client of this room (multi-tab + multi-PC).
    this.room.broadcast(message, [sender.id]);

    const snapshot = readCanvasSnapshot(envelope);
    if (snapshot) this.enqueuePersist(snapshot);

    // Answer a lone catch-up request from durable storage. With other peers
    // connected, they own the answer (fresher state than storage); the replay
    // in `onConnect` above already covered this newcomer either way.
    if (isSyncRequest(envelope) && this.countPeers(sender.id) === 0) {
      await this.persistQueue;
      const stored = await this.room.storage.get<CanvasSnapshot>(CANVAS_STATE_KEY);
      if (stored !== undefined && sender.readyState === WS_OPEN) {
        sender.send(syncStateEnvelope(stored));
      }
    }
  }

  /**
   * A client left. There is no per-connection state to release: PartyKit
   * evicts the socket from the room, clients prune the departed peer's
   * presence via `PRESENCE_STALE_MS`, and the persisted canvas outlives every
   * disconnect — which is exactly what lets the next `onConnect` replay it.
   */
  onClose(): void {
    /* no per-connection state kept in memory */
  }

  /** Queue a durable snapshot write, preserving message arrival order. */
  private enqueuePersist(snapshot: CanvasSnapshot): void {
    this.persistQueue = this.persistQueue
      .then(() => this.room.storage.put(CANVAS_STATE_KEY, snapshot))
      .catch(() => {
        // Keep the previous snapshot on a failed write — the room stays usable
        // and the next successful mutation re-persists a fresh state.
      });
  }

  /** Number of connections in the room other than `senderId`. */
  private countPeers(senderId: string): number {
    let count = 0;
    for (const conn of this.room.getConnections()) {
      if (conn.id !== senderId) count += 1;
    }
    return count;
  }
}
