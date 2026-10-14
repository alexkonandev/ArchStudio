"use client";

import { useEffect, useRef } from "react";
import { useCollabSync } from "@/lib/collab/sync";
import { useCollabStore } from "@/store/collab-store";
import { useGraphStore } from "@/store/graph-store";
import { pushToast } from "@/components/ui/toast";

/**
 * Room provider: joins the collaboration room on mount, keeps the
 * BroadcastChannel sync alive while connected, and records team activity into
 * the live feed by diffing the graph store (create / delete / rename).
 *
 * Placed once, high in the canvas page tree. Presence heartbeat + staleness
 * pruning live inside {@link useCollabSync}.
 */
export function CollabProvider({ roomId }: { roomId: string }) {
  const status = useCollabStore((s) => s.status);
  const joinRoom = useCollabStore((s) => s.joinRoom);
  const pushActivity = useCollabStore((s) => s.pushActivity);

  // Auto-join the room once on mount (persisted name is kept if the user set it).
  const joinedRef = useRef(false);
  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;
    joinRoom(undefined, undefined, roomId);
  }, [joinRoom, roomId]);

  // Keep the real-time channel alive only while connected.
  useCollabSync(roomId, status !== "disconnected");

  // --- Live activity: diff the graph to log create / delete / rename --------
  const prevTables = useRef<Map<string, string>>(new Map());
  const tables = useGraphStore((s) => s.tables);
  useEffect(() => {
    const next = new Map(tables.map((t) => [t.id, t.name]));
    const prev = prevTables.current;

    // Skip the very first snapshot (initial hydration) to avoid noise.
    if (prev.size === 0) {
      prevTables.current = next;
      return;
    }

    for (const [id, name] of next) {
      if (!prev.has(id)) pushActivity("create", `a créé la table « ${name} »`, id);
      else if (prev.get(id) !== name)
        pushActivity("rename", `a renommé « ${prev.get(id)} » en « ${name} »`, id);
    }
    for (const [id, name] of prev) {
      if (!next.has(id)) pushActivity("delete", `a supprimé la table « ${name} »`, id);
    }
    prevTables.current = next;
  }, [tables, pushActivity]);

  // Expose a tiny debug surface + friendly toast when we actually connect.
  const connected = status === "connected";
  const announcedRef = useRef(false);
  useEffect(() => {
    if (connected && !announcedRef.current) {
      announcedRef.current = true;
      pushToast("Session collaborative active", {
        type: "success",
        description: "Ouvrez Modelizia dans un 2ᵉ onglet pour tester le multi-utilisateur.",
      });
    }
    if (!connected) announcedRef.current = false;
  }, [connected]);

  return null;
}
