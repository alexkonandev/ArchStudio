"use client";

/**
 * Real-time collaboration transport abstraction.
 *
 * Decouples “what is synchronised” (presence, locks, comments, schema, cursors)
 * from “how it reaches other peers”. The store layer talks to the module-level
 * registry API below and never knows which wire is underneath:
 *
 * - `BroadcastChannelTransport` — local demo mode (same machine, multi-tab),
 *   zero configuration, used when no network mode is configured.
 * - `PartyKitTransport` — network mode (multi-PC, multi-room) on PartyKit:
 *   set `NEXT_PUBLIC_PARTYKIT_HOST` (`localhost:1999` for `pnpm party:dev`
 *   locally, the deployed `*.partykit.dev` host in production). `partysocket`
 *   dials `ws(s)://<host>/parties/main/<roomId>` with built-in reconnection;
 *   the PartyKit server (`party/server.ts`) relays each envelope to the
 *   room's other clients and persists the latest canvas snapshot per room.
 * - `WebSocketTransport` — network mode on any other relay: set
 *   `NEXT_PUBLIC_COLLAB_WS_URL` (e.g. `ws://localhost:8787` or
 *   `wss://collab.example.com`) and every client connects to
 *   `${WS_URL}?room=<roomId>`, sending/receiving JSON envelopes that
 *   the server relays to every other peer of the same room.
 * - `OfflineTransport` — SSR / unsupported browsers: everything degrades to a
 *   usable solo app (no sync, no crash).
 *
 * ## Wire protocol (shared by every transport)
 *
 * ```ts
 * interface TransportEnvelope {
 *   v: 1;                       // protocol version
 *   topic: "collab" | "graph" | "cursor";
 *   senderId: string;           // per-tab session id → local echo suppression
 *   payload: unknown;           // JSON-serialisable message (topic-specific)
 * }
 * ```
 *
 * Switching from local demo to network mode is a single env var — no store or
 * component changes required, because every consumer goes through
 * `sendTransport` / `subscribeTransport`.
 */

import PartySocket from "partysocket";

import type { GraphMutationPayload } from "@/lib/collab/graph-sync";

/** Which wire the app is currently riding on. */
export type TransportKind = "broadcast" | "websocket" | "offline";

/** Lifecycle of the underlying connection (drives the topbar presence chip). */
export type TransportStatus = "connecting" | "connected" | "disconnected";

/** Multiplexed channels carried over a single wire. */
export type TransportTopic = "collab" | "graph" | "cursor";

export interface TransportEnvelope {
  v: 1;
  topic: TransportTopic;
  senderId: string;
  payload: unknown;
}

/** Default room when none is bound yet (matches the Studio's default). */
export const DEFAULT_ROOM_ID = "archstudio";

const TOPICS: readonly string[] = ["collab", "graph", "cursor"];

/** Cap for the WebSocket send queue while reconnecting (drop oldest first). */
const WS_QUEUE_LIMIT = 256;
/** Reconnect backoff: 1s, 2s, 4s … capped at 15s (+ up to 500ms jitter). */
const WS_MAX_BACKOFF_MS = 15_000;

// ---------------------------------------------------------------------------
// Session identity (echo suppression)
// ---------------------------------------------------------------------------

let sessionId: string | null = null;

/**
 * Stable id for *this tab/session*, minted lazily on the client. Peers use it
 * to drop their own messages when the wire echoes back (WebSocket servers
 * typically broadcast to the sender too).
 */
function getSessionId(): string {
  if (sessionId) return sessionId;
  sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `sess_${crypto.randomUUID()}`
      : `sess_${Math.random().toString(36).slice(2)}`;
  return sessionId;
}

/** Room derived from `?room=` (falls back to {@link DEFAULT_ROOM_ID}). */
export function resolveRoomId(): string {
  if (typeof window === "undefined") return DEFAULT_ROOM_ID;
  try {
    const room = new URLSearchParams(window.location.search).get("room");
    if (room && room.trim()) return room.trim();
  } catch {
    /* malformed search string — fall through */
  }
  return DEFAULT_ROOM_ID;
}

// ---------------------------------------------------------------------------
// Transport implementations
// ---------------------------------------------------------------------------

interface TransportCallbacks {
  onMessage: (envelope: TransportEnvelope) => void;
  onStatus: (status: TransportStatus) => void;
}

interface Transport {
  readonly kind: TransportKind;
  send: (envelope: TransportEnvelope) => void;
  close: () => void;
}

/** Runtime validation of an inbound envelope (network data is untrusted). */
function isEnvelope(value: unknown): value is TransportEnvelope {
  if (!value || typeof value !== "object") return false;
  const env = value as Partial<TransportEnvelope>;
  return (
    env.v === 1 &&
    typeof env.topic === "string" &&
    TOPICS.includes(env.topic) &&
    typeof env.senderId === "string" &&
    "payload" in env
  );
}

/**
 * Local multi-tab wire (demo mode). One `BroadcastChannel` per room carries
 * every topic; the browser never echoes to the posting tab, so no dedupe is
 * needed beyond the shared `senderId` guard.
 */
function createBroadcastTransport(
  roomId: string,
  callbacks: TransportCallbacks,
): Transport | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  const channel = new BroadcastChannel(`modelizia:room:${roomId}`);
  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (isEnvelope(event.data)) callbacks.onMessage(event.data);
  };
  callbacks.onStatus("connected");
  return {
    kind: "broadcast",
    send: (envelope) => {
      try {
        channel.postMessage(envelope);
      } catch {
        /* channel closed mid-flight */
      }
    },
    close: () => {
      channel.onmessage = null;
      try {
        channel.close();
      } catch {
        /* already closed */
      }
      callbacks.onStatus("disconnected");
    },
  };
}

/**
 * PartyKit wire (primary multi-PC / multi-room mode): `partysocket` dials
 * `ws(s)://<host>/parties/main/<roomId>` and handles reconnection for us
 * (exponential backoff, unbounded retries + send queue — frames emitted while
 * the socket is down are buffered and flushed on the next open). The server
 * (`party/server.ts`) mirrors the BroadcastChannel contract: it relays every
 * envelope to the other clients of the same room, replays the persisted
 * canvas snapshot to late joiners, and answers lone `sync_request`s from
 * durable storage.
 */
function createPartyKitTransport(
  host: string,
  roomId: string,
  callbacks: TransportCallbacks,
): Transport | null {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    return null;
  }

  let socket: PartySocket;
  try {
    // PartySocket derives the scheme from the host (`localhost:`/private IPs →
    // ws, anything else → wss) and strips any protocol the env may include.
    socket = new PartySocket({ host, room: roomId });
  } catch {
    // Misconfigured NEXT_PUBLIC_PARTYKIT_HOST → fall back to the other wires.
    return null;
  }

  let closed = false;

  const handleOpen = (): void => callbacks.onStatus("connected");

  const handleMessage = (event: MessageEvent): void => {
    if (typeof event.data !== "string") return;
    try {
      const parsed: unknown = JSON.parse(event.data);
      if (isEnvelope(parsed)) callbacks.onMessage(parsed);
    } catch {
      /* non-JSON frame (ping/pong, debug) — ignore */
    }
  };

  const handleClose = (): void => {
    // partysocket retries forever; a non-final close just means the wire is
    // cycling — report "connecting" until the next `open` re-establishes it.
    if (!closed) callbacks.onStatus("connecting");
  };

  socket.addEventListener("open", handleOpen);
  socket.addEventListener("message", handleMessage);
  socket.addEventListener("close", handleClose);
  callbacks.onStatus("connecting");

  return {
    kind: "websocket",
    send: (envelope) => {
      try {
        socket.send(JSON.stringify(envelope));
      } catch {
        /* socket torn down mid-flight — partysocket buffers the rest */
      }
    },
    close: () => {
      closed = true;
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
      // Stops reconnection and dispatches the final close synchronously —
      // listeners are already detached, so we report "disconnected" ourselves.
      socket.close();
      callbacks.onStatus("disconnected");
    },
  };
}

/**
 * Network wire (multi-PC mode): JSON envelopes over a single WebSocket, with
 * automatic reconnection (exponential backoff) and a bounded send queue so a
 * transient outage never drops mutations silently.
 *
 * Server contract (any stack — Node `ws`, Socket.io gateway, PartyKit, a
 * Supabase/Edge relay…): accept `GET <WS_URL>?room=<roomId>`, parse each
 * incoming JSON envelope and re-broadcast it to every *other* client of the
 * same room (broadcasting back to the sender is fine — the client drops its
 * own `senderId`).
 */
function createWebSocketTransport(
  wsUrl: string,
  roomId: string,
  callbacks: TransportCallbacks,
): Transport | null {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    return null;
  }

  let endpoint: URL;
  try {
    endpoint = new URL(wsUrl);
    if (endpoint.protocol !== "ws:" && endpoint.protocol !== "wss:") return null;
    endpoint.searchParams.set("room", roomId);
  } catch {
    // Misconfigured NEXT_PUBLIC_COLLAB_WS_URL → fall back to local mode.
    return null;
  }

  let socket: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let reconnectTimer: number | null = null;
  /** Envelopes emitted while the socket is down (flushed on next open). */
  const queue: TransportEnvelope[] = [];

  const clearReconnect = (): void => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = (): void => {
    if (closed || reconnectTimer !== null) return;
    const delay =
      Math.min(1000 * 2 ** attempt, WS_MAX_BACKOFF_MS) +
      Math.floor(Math.random() * 500);
    attempt += 1;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      open();
    }, delay);
  };

  const open = (): void => {
    if (closed) return;
    callbacks.onStatus("connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(endpoint.toString());
    } catch {
      scheduleReconnect();
      return;
    }
    socket = ws;

    ws.onopen = () => {
      if (closed || socket !== ws) return;
      attempt = 0;
      callbacks.onStatus("connected");
      // Flush everything queued during the outage.
      while (queue.length > 0) {
        const pending = queue.shift();
        if (!pending) break;
        try {
          ws.send(JSON.stringify(pending));
        } catch {
          queue.unshift(pending);
          break;
        }
      }
    };

    ws.onmessage = (event: MessageEvent<unknown>) => {
      if (closed || socket !== ws) return;
      if (typeof event.data !== "string") return;
      try {
        const parsed: unknown = JSON.parse(event.data);
        if (isEnvelope(parsed)) callbacks.onMessage(parsed);
      } catch {
        /* non-JSON frame (ping/pong, debug) — ignore */
      }
    };

    ws.onerror = () => {
      /* `onclose` always follows — reconnect handled there. */
    };

    ws.onclose = () => {
      if (closed || socket !== ws) return;
      socket = null;
      callbacks.onStatus("connecting");
      scheduleReconnect();
    };
  };

  open();

  return {
    kind: "websocket",
    send: (envelope) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify(envelope));
          return;
        } catch {
          /* fall through to the queue */
        }
      }
      if (queue.length >= WS_QUEUE_LIMIT) queue.shift();
      queue.push(envelope);
    },
    close: () => {
      closed = true;
      clearReconnect();
      queue.length = 0;
      const ws = socket;
      socket = null;
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        try {
          ws.close();
        } catch {
          /* already closed */
        }
      }
      callbacks.onStatus("disconnected");
    },
  };
}

function createOfflineTransport(callbacks: TransportCallbacks): Transport {
  callbacks.onStatus("disconnected");
  return {
    kind: "offline",
    send: () => {
      /* no wire: the app runs solo */
    },
    close: () => {
      /* nothing to close */
    },
  };
}

/** Pick the best available wire for this environment + configuration. */
function createTransport(
  roomId: string,
  callbacks: TransportCallbacks,
): Transport {
  // PartyKit first: the primary multi-PC / multi-room wire (dev: run
  // `pnpm party:dev` beside `pnpm dev`; prod: the deployed PartyKit host).
  const partyHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (partyHost) {
    const party = createPartyKitTransport(partyHost, roomId, callbacks);
    if (party) return party;
    // Invalid host/options → degrade through the wires below.
  }
  const wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL;
  if (wsUrl) {
    const ws = createWebSocketTransport(wsUrl, roomId, callbacks);
    if (ws) return ws;
    // Invalid/unavailable WebSocket → degrade to local demo mode.
  }
  const local = createBroadcastTransport(roomId, callbacks);
  if (local) return local;
  return createOfflineTransport(callbacks);
}

// ---------------------------------------------------------------------------
// Module-level registry (what every store/component talks to)
// ---------------------------------------------------------------------------

type MessageHandler = (payload: unknown) => void;
type StatusHandler = (status: TransportStatus) => void;

let transport: Transport | null = null;
let boundRoom: string | null = null;
let currentStatus: TransportStatus = "disconnected";

const subscriptions = new Map<TransportTopic, Set<MessageHandler>>();
const statusHandlers = new Set<StatusHandler>();

const setStatus = (status: TransportStatus): void => {
  if (status === currentStatus) return;
  currentStatus = status;
  for (const handler of statusHandlers) handler(status);
};

const handleEnvelope = (envelope: TransportEnvelope): void => {
  // Drop local echoes (WebSocket relays bounce a message back to the sender).
  if (envelope.senderId === getSessionId()) return;
  const handlers = subscriptions.get(envelope.topic);
  if (!handlers) return;
  for (const handler of handlers) handler(envelope.payload);
};

const transportCallbacks: TransportCallbacks = {
  onMessage: handleEnvelope,
  onStatus: setStatus,
};

/**
 * Lazily (re)create the underlying wire. Topic subscriptions live at the
 * registry level, so swapping the wire (room change, reconnect) never
 * detaches existing consumers.
 */
function ensureTransport(roomId?: string): Transport | null {
  if (typeof window === "undefined") return null;
  // Strict room scoping: the wire identity (BroadcastChannel name / WebSocket
  // `?room=` param) always derives from the ACTIVE roomId. Blank ids fall
  // back to the already-bound room, then to `?room=` / the default room —
  // never to an empty channel key shared by every session.
  const room = roomId || boundRoom || resolveRoomId();
  if (transport && boundRoom === room) return transport;
  transport?.close();
  boundRoom = room;
  transport = createTransport(room, transportCallbacks);
  return transport;
}

/**
 * Bind (or rebind) the wire to a collaboration room. Called by the collab sync
 * on join; safe to call repeatedly with the same room (no-op). Returns the
 * active transport kind so callers can report the mode in use.
 */
export function openTransport(roomId: string): TransportKind {
  return ensureTransport(roomId)?.kind ?? "offline";
}

/**
 * Close the underlying wire (collab session ended). Topic subscriptions are
 * kept: they are room-agnostic and the next `sendTransport` /
 * `subscribeTransport` transparently reopens the wire for the bound room.
 */
export function closeTransport(): void {
  transport?.close();
  transport = null;
}

/** Current wire in use (offline until a consumer opens one). */
export function getTransportKind(): TransportKind {
  return transport?.kind ?? "offline";
}

/** Current connection status (drives the topbar “en ligne / hors ligne”). */
export function getTransportStatus(): TransportStatus {
  return currentStatus;
}

/**
 * Subscribe to a topic. Creates the wire lazily (SSR-safe: no-op server side).
 * Returns an unsubscribe function.
 */
export function subscribeTransport(
  topic: TransportTopic,
  handler: MessageHandler,
): () => void {
  let handlers = subscriptions.get(topic);
  if (!handlers) {
    handlers = new Set();
    subscriptions.set(topic, handlers);
  }
  handlers.add(handler);
  ensureTransport();
  return () => {
    const current = subscriptions.get(topic);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) subscriptions.delete(topic);
  };
}

/** Publish a payload on a topic (no-op during SSR / without a wire). */
export function sendTransport(topic: TransportTopic, payload: unknown): void {
  const active = ensureTransport();
  if (!active) return;
  active.send({ v: 1, topic, senderId: getSessionId(), payload });
}

/**
 * Listen to wire lifecycle changes. The handler is invoked immediately with
 * the current status, then on every change. Returns an unsubscribe function.
 */
export function onTransportStatus(handler: StatusHandler): () => void {
  statusHandlers.add(handler);
  handler(currentStatus);
  return () => {
    statusHandlers.delete(handler);
  };
}

/** Runtime guard for graph mutation payloads received over the network. */
export function isGraphMutationPayload(
  value: unknown,
): value is GraphMutationPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<GraphMutationPayload>;
  return (
    Array.isArray(payload.tables) &&
    Array.isArray(payload.relations) &&
    Array.isArray(payload.enums)
  );
}


