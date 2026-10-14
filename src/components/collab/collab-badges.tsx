"use client";

import { useCollabStore } from "@/store/collab-store";

/**
 * Subscribe to whether a table is currently soft-locked by *another* peer.
 * Returns the lock (with owner name) or null. Re-evaluates staleness lazily on
 * each store change so an expired lock drops off the canvas automatically once
 * any collab/graph state updates.
 */
export function useTableLock(tableId: string) {
  return useCollabStore((s) => {
    const lock = s.tableLocks[tableId];
    if (!lock || lock.userId === s.self.id) return null;
    if (Date.now() - lock.timestamp >= 20_000) return null;
    return lock;
  });
}

/** Count of unresolved comments authored by others and not yet seen. */
export function useUnreadCount(tableId: string): number {
  return useCollabStore((s) => {
    const seen = new Set(s.seenCommentIds);
    return s.comments.filter(
      (c) => c.tableId === tableId && !c.resolved && !seen.has(c.id),
    ).length;
  });
}

/** Total unresolved comments on a table (for the badge, regardless of seen). */
export function useCommentCount(tableId: string): number {
  return useCollabStore(
    (s) => s.comments.filter((c) => c.tableId === tableId && !c.resolved).length,
  );
}
