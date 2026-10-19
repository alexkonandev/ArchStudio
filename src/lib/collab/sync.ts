"use client";

import { useEffect } from "react";
import type { CollabMessage } from "@/types";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_STALE_MS } from "@/types";
import { setCollabOutbound, useCollabStore } from "@/store/collab-store";
import {
  closeTransport,
  onTransportStatus,
  openTransport,
  sendTransport,
  subscribeTransport,
} from "@/lib/collab/transport";

/**
 * Real-time collaboration sync adapter.
 *
 * Joins the collaboration room over the shared transport abstraction
 * (`@/lib/collab/transport`): PartyKit over WebSocket (multi-PC, multi-room)
 * when `NEXT_PUBLIC_PARTYKIT_HOST` is configured, any other WebSocket relay
 * when `NEXT_PUBLIC_COLLAB_WS_URL` is, local multi-tab demo mode
 * (BroadcastChannel) otherwise. Local store mutations are published through
 * the store's outbound
 * hook; incoming messages are fed back into the store via `applyRemote`.
 * Presence is kept alive with a heartbeat, and stale peers plus expired
 * soft-locks are pruned on a timer. Wire lifecycle changes (including
 * WebSocket reconnects) are mirrored into the store's `status`.
 */

export interface CollabSyncHandle {
  dispose: () => void;
}

/**
 * Start the real-time sync for the current room. Registers the store's outbound
 * publication, wires presence heartbeat + staleness pruning, and mirrors the
 * transport status. Returns a dispose function (also auto-run on unmount) that
 * sends `bye`, unsubscribes and closes the wire.
 */
export function startCollabSync(roomId: string): CollabSyncHandle {
  if (typeof window === "undefined") return { dispose: () => {} };

  // Bind (or rebind) the wire to this room. Offline (no BroadcastChannel and
  // no usable WebSocket) → stay usable solo, just offline.
  const kind = openTransport(roomId);
  if (kind === "offline") {
    useCollabStore.setState({ status: "disconnected" });
    return { dispose: () => {} };
  }

  // Route every local store publication onto the transport.
  setCollabOutbound((message: CollabMessage) => sendTransport("collab", message));

  // Late-joiner catch-up bookkeeping: flips true once a peer answered our
  // schema request — it gates the bounded retries below (`requestSchemaState`).
  let receivedSyncState = false;

  // Inbound collab messages (validated — network payloads are untrusted).
  const unsubscribeMessages = subscribeTransport("collab", (payload) => {
    if (!payload || typeof payload !== "object") return;
    const type = (payload as { type?: unknown }).type;
    if (typeof type !== "string") return;
    if (type === "sync_state") receivedSyncState = true;
    useCollabStore.getState().applyRemote(payload as CollabMessage);
  });

  // Mirror the wire lifecycle into the store status (reconnects included).
  // No "already disconnected" guard: `startCollabSync` only runs while a
  // session is wanted, so it must be able to bring the store back online
  // (StrictMode double-mount re-runs it after `leaveRoom` set "disconnected").
  // The handler is unsubscribed *before* `leaveRoom` on dispose, so an
  // intentional shutdown never flips back.
  const unsubscribeStatus = onTransportStatus((wireStatus) => {
    if (wireStatus === "connected") {
      useCollabStore.setState({ status: "connected" });
    } else if (wireStatus === "connecting") {
      useCollabStore.setState({ status: "connecting" });
    } else {
      useCollabStore.setState({ status: "disconnected" });
    }
  });

  // Announce ourselves (`presence`) + ask for the room's schema state
  // (`sync_request`) so a newcomer is caught up without a reload. Re-emitted
  // here (not only from `joinRoom`) because the store's first `joinRoom` runs
  // before this wire is open. The request is retried a couple of times while
  // no `sync_state` has come back yet: over WebSocket the first attempt can
  // race the host's own connection (or a reconnect), and one lost request
  // would leave the new browser sitting on an empty canvas.
  const requestSchemaState = (): void => {
    if (receivedSyncState) return;
    sendTransport("collab", { type: "sync_request" } satisfies CollabMessage);
  };
  useCollabStore.getState().updatePresence();
  requestSchemaState();
  const syncRetries = [700, 2_000].map((delay) =>
    window.setTimeout(requestSchemaState, delay),
  );

  const heartbeat = window.setInterval(() => {
    useCollabStore.getState().updatePresence();
  }, PRESENCE_HEARTBEAT_MS);

  // Prune peers that went silent (closed tab / crash) so the stack stays honest.
  const prune = window.setInterval(() => {
    const now = Date.now();
    useCollabStore.setState((s) => ({
      participants: s.participants.filter(
        (p) => now - p.lastActivity < PRESENCE_STALE_MS,
      ),
    }));
    // If we were only ever "connecting" (no peer answered yet) but have been
    // alone for a while, treat the session as connected (solo room).
    if (
      useCollabStore.getState().status === "connecting" &&
      useCollabStore.getState().participants.length === 0
    ) {
      useCollabStore.setState({ status: "connected" });
    }
  }, PRESENCE_HEARTBEAT_MS);

  return {
    dispose: () => {
      unsubscribeStatus();
      unsubscribeMessages();
      syncRetries.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(heartbeat);
      window.clearInterval(prune);
      useCollabStore.getState().leaveRoom();
      setCollabOutbound(null);
      closeTransport();
    },
  };
}

/**
 * React hook: mount the transport sync for `roomId` while `enabled`.
 * Cleans up (sends `bye`, unsubscribes, closes the wire) on disable / unmount.
 */
export function useCollabSync(roomId: string, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const handle = startCollabSync(roomId);
    return () => handle.dispose();
  }, [roomId, enabled]);
}
