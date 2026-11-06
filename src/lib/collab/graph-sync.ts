"use client";

import type {
  CollabMessage,
  EnumDefinition,
  Relation,
  Table,
} from "@/types";
import {
  isGraphMutationPayload,
  sendTransport,
  subscribeTransport,
} from "@/lib/collab/transport";

/**
 * Graph store sync adapter.
 *
 * Every Modelizia window/PC sharing the same collaboration room keeps its
 * canvas in sync: a local graph mutation (add/edit/delete table, relation
 * wiring, drag, normalisation, auto-layout) is published on the shared
 * transport, which relays the fresh `{ tables, relations, enums }` snapshot to
 * the other peers — no reload required.
 *
 * The actual wire (local `BroadcastChannel` demo mode or remote WebSocket
 * network mode) is chosen by `@/lib/collab/transport`; this module deals with
 * the `graph` topic of that transport, plus the small late-joiner catch-up
 * sub-protocol (`sync_request` / `sync_state`) carried on the `collab` topic.
 * The dependency stays one-directional: the store imports this adapter, never
 * the reverse, and everything degrades gracefully (SSR / unsupported browsers)
 * — the app just runs solo/offline.
 */

/**
 * Payload carrying the authoritative graph snapshot after a mutation.
 * Plain JSON only — it travels verbatim over BroadcastChannel *and* WebSocket.
 */
export interface GraphMutationPayload {
  tables: Table[];
  relations: Relation[];
  enums: EnumDefinition[];
}

/** Wire protocol published on the transport `graph` topic. */
export interface GraphMutationMessage {
  type: "GRAPH_MUTATION";
  payload: GraphMutationPayload;
}


/**
 * Emit a graph mutation to the room over the shared transport.
 *
 * Local echo is handled centrally: the transport tags every envelope with a
 * per-session `senderId` and drops messages that bounce back from a WebSocket
 * relay (BroadcastChannel never echoes to the posting tab by spec). The
 * back-propagation loop is closed on the *receiver* side by applying remote
 * state in "silent" mode (see `graph-store.ts`).
 */
export function emitGraphMutation(payload: GraphMutationPayload): void {
  const message: GraphMutationMessage = { type: "GRAPH_MUTATION", payload };
  sendTransport("graph", message);
}

/**
 * Subscribe to graph mutations published by other peers (other tabs locally,
 * other PCs over the network). Returns an unsubscribe function so callers can
 * detach cleanly (unmount / teardown).
 *
 * Inbound payloads are validated before use — over the network they come from
 * an untrusted source and must never crash the store.
 *
 * The receiving store guards against infinite loops itself: while it applies a
 * remote snapshot it flips an "applying remote" flag that suppresses the local
 * store subscription from re-broadcasting the very state it just received.
 */
export function onGraphMutation(
  handler: (payload: GraphMutationPayload) => void,
): () => void {
  return subscribeTransport("graph", (payload) => {
    if (!payload || typeof payload !== "object") return;
    const message = payload as Partial<GraphMutationMessage>;
    if (message.type !== "GRAPH_MUTATION") return;
    if (!isGraphMutationPayload(message.payload)) return;
    handler(message.payload);
  });
}

// ---------------------------------------------------------------------------
// Late-joiner catch-up (`sync_request` / `sync_state`, `collab` topic)
// ---------------------------------------------------------------------------

/**
 * Share the current graph snapshot with a peer that just joined the room
 * (answer to its `sync_request` — see `collab-store.joinRoom` +
 * `sync.startCollabSync`). The payload is the same plain-JSON
 * {@link GraphMutationPayload} as a live mutation, applied by the newcomer in
 * silent mode: the schema spreads to every browser/tab without a reload.
 */
export function emitSyncState(payload: GraphMutationPayload): void {
  const message: CollabMessage = { type: "sync_state", payload };
  sendTransport("collab", message);
}

/**
 * Subscribe to schema catch-up requests published by late joiners. The store
 * answers via {@link emitSyncState} when it holds a non-empty graph (the room
 * host — or any other holder — catches the newcomer up). Returns an
 * unsubscribe function.
 */
export function onSyncRequest(handler: () => void): () => void {
  return subscribeTransport("collab", (payload) => {
    if (!payload || typeof payload !== "object") return;
    if ((payload as { type?: unknown }).type !== "sync_request") return;
    handler();
  });
}

/**
 * Subscribe to schema snapshots answering our own `sync_request`. Inbound
 * payloads are validated (network payloads are untrusted) and handed to the
 * same silent apply path as a live mutation. Returns an unsubscribe function.
 */
export function onSyncState(
  handler: (payload: GraphMutationPayload) => void,
): () => void {
  return subscribeTransport("collab", (payload) => {
    if (!payload || typeof payload !== "object") return;
    const message = payload as Partial<{ type: string; payload: unknown }>;
    if (message.type !== "sync_state") return;
    if (!isGraphMutationPayload(message.payload)) return;
    handler(message.payload);
  });
}
