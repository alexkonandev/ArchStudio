"use client";

import type { EnumDefinition, Relation, Table } from "@/types";

/**
 * BroadcastChannel sync adapter for the graph store.
 *
 * Every ArchStudio window/tab sharing this channel keeps its canvas in sync:
 * a local graph mutation (add/edit/delete table, relation wiring, drag,
 * normalisation, auto-layout) is broadcast to the other tabs, which apply the
 * fresh `{ tables, relations, enums }` snapshot in place — no reload required.
 *
 * The dependency stays one-directional: the store imports this adapter, never
 * the reverse, and everything degrades gracefully when `BroadcastChannel` is
 * unavailable (SSR / unsupported browsers) — the app just runs solo/offline.
 */

/** Channel name — peers on the same channel talk to each other only. */
export const GRAPH_SYNC_CHANNEL = "archstudio-graph-sync-v1";

/** Payload carrying the authoritative graph snapshot after a mutation. */
export interface GraphMutationPayload {
  tables: Table[];
  relations: Relation[];
  enums: EnumDefinition[];
}

/** Wire protocol broadcast over {@link BroadcastChannel} between tabs. */
export interface GraphMutationMessage {
  type: "GRAPH_MUTATION";
  payload: GraphMutationPayload;
}

/**
 * Lazily created shared channel. Reused across every emit/subscribe call so the
 * whole app talks over a single `BroadcastChannel` instance.
 */
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  if (channel) return channel;
  channel = new BroadcastChannel(GRAPH_SYNC_CHANNEL);
  return channel;
}

/**
 * Emit a graph mutation to every other open tab.
 *
 * Per the `BroadcastChannel` spec, the posting channel does not receive its own
 * message, so this never echoes back into the emitter — the back-propagation
 * loop is closed on the *receiver* side by applying remote state in "silent"
 * mode (see `graph-store.ts`).
 */
export function emitGraphMutation(payload: GraphMutationPayload): void {
  const ch = getChannel();
  if (!ch) return;
  const message: GraphMutationMessage = { type: "GRAPH_MUTATION", payload };
  try {
    ch.postMessage(message);
  } catch {
    /* channel closed mid-flight */
  }
}

/**
 * Subscribe to graph mutations broadcast by other tabs. Returns an unsubscribe
 * function so callers can detach cleanly (unmount / teardown).
 *
 * The receiving store guards against infinite loops itself: while it applies a
 * remote snapshot it flips an "applying remote" flag that suppresses the local
 * store subscription from re-broadcasting the very state it just received.
 */
export function onGraphMutation(
  handler: (payload: GraphMutationPayload) => void,
): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const listener = (event: MessageEvent<GraphMutationMessage>): void => {
    const message = event.data;
    if (!message || message.type !== "GRAPH_MUTATION" || !message.payload) return;
    handler(message.payload);
  };

  ch.addEventListener("message", listener);
  return () => {
    ch.removeEventListener("message", listener);
  };
}
