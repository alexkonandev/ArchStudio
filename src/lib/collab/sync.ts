"use client";

import { useEffect } from "react";
import type { CollabMessage } from "@/types";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_STALE_MS } from "@/types";
import { setCollabOutbound, useCollabStore } from "@/store/collab-store";

/**
 * BroadcastChannel sync adapter for real-time collaboration.
 *
 * Simulates multi-user / multi-tab editing: every ArchStudio window sharing the
 * same `roomId` joins one channel. Local store mutations are broadcast through
 * the store's outbound hook; incoming messages are fed back into the store via
 * `applyRemote`. Presence is kept alive with a heartbeat, and stale peers plus
 * expired soft-locks are pruned on a timer.
 */

/** Channel name for a room — peers on the same room talk to each other only. */
const channelName = (roomId: string): string => `archstudio:collab:${roomId || "default"}`;

export interface CollabSyncHandle {
  dispose: () => void;
}

/**
 * Start the real-time sync for the current room. Registers the store's outbound
 * broadcast and wires presence heartbeat + staleness pruning. Returns a dispose
 * function (also auto-run on unmount) that sends `bye` and closes the channel.
 */
export function startCollabSync(roomId: string): CollabSyncHandle {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    // No BroadcastChannel (SSR / unsupported): stay usable solo, just offline.
    useCollabStore.setState({ status: "disconnected" });
    return { dispose: () => {} };
  }

  const channel = new BroadcastChannel(channelName(roomId));
  const store = useCollabStore.getState();

  // Route every local store emission onto the channel.
  setCollabOutbound((message: CollabMessage) => {
    try {
      channel.postMessage(message);
    } catch {
      /* channel closed */
    }
  });

  channel.onmessage = (event: MessageEvent<CollabMessage>) => {
    const message = event.data;
    if (!message) return;
    useCollabStore.getState().applyRemote(message);
  };

  // Announce + start the heartbeat so peers see us immediately.
  store.updatePresence();

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
      window.clearInterval(heartbeat);
      window.clearInterval(prune);
      useCollabStore.getState().leaveRoom();
      setCollabOutbound(null);
      try {
        channel.close();
      } catch {
        /* already closed */
      }
    },
  };
}

/**
 * React hook: mount the BroadcastChannel sync for `roomId` while `enabled`.
 * Cleans up (sends `bye`, closes the channel) on disable / unmount.
 */
export function useCollabSync(roomId: string, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const handle = startCollabSync(roomId);
    return () => handle.dispose();
  }, [roomId, enabled]);
}
