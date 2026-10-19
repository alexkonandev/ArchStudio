"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCollabSync } from "@/lib/collab/sync";
import { DEFAULT_ROOM_ID, getTransportKind } from "@/lib/collab/transport";
import { useCollabStore } from "@/store/collab-store";
import { useGraphStore } from "@/store/graph-store";
import { pushToast } from "@/components/ui/toast";

/**
 * Room provider: joins the collaboration room on mount, keeps the
 * transport sync (local BroadcastChannel demo / remote WebSocket network)
 * alive while connected, and records team activity into the live feed by
 * diffing the graph store (create / delete / rename).
 *
 * Placed once, high in the canvas page tree. Presence heartbeat + staleness
 * pruning live inside {@link useCollabSync}.
 */
export function CollabProvider({ roomId }: { roomId: string }) {
  const status = useCollabStore((s) => s.status);
  const storeRoomId = useCollabStore((s) => s.roomId);
  const joinRoom = useCollabStore((s) => s.joinRoom);
  const pushActivity = useCollabStore((s) => s.pushActivity);

  // Auto-join the room on mount, then re-join whenever the room changes (e.g.
  // a shared `/studio?room=…` link updates the query param client-side).
  // The persisted name is kept across re-joins.
  const joinedRoomRef = useRef<string | null>(null);
  useEffect(() => {
    if (joinedRoomRef.current === roomId) return;
    joinedRoomRef.current = roomId;
    // A manual switch (Share modal / « Créer un salon ») already joined this
    // room in the store and only left the URL behind — skipping the redundant
    // re-join keeps participants + status stable right after the announce.
    // A remount after a real disconnect must still re-join (status guard).
    const store = useCollabStore.getState();
    if (store.roomId === roomId && store.status !== "disconnected") return;
    joinRoom(undefined, undefined, roomId);
  }, [joinRoom, roomId]);

  // Keep the real-time channel alive only while connected. The wire follows the
  // store's room (not only the URL prop): a manual join from the Share modal —
  // which switches the store and `pushState`s the URL — rebinds the
  // BroadcastChannel / WebSocket even before the search params catch up.
  useCollabSync(storeRoomId || roomId, status !== "disconnected");

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
      const network = getTransportKind() === "websocket";
      pushToast("Session collaborative active", {
        type: "success",
        description: network
          ? "Réseau connecté — chaque PC rejoint ce salon via le lien partagé."
          : "Ouvrez Modelizia dans un 2ᵉ onglet pour tester le multi-utilisateur.",
      });
    }
    if (!connected) announcedRef.current = false;
  }, [connected]);

  return null;
}

/**
 * URL-driven room resolution for the `/studio` route.
 *
 * Reads the `room` query parameter emitted by the Share modal
 * (`/studio?room=<roomId>`) and joins that room; {@link CollabProvider} then
 * binds the transport (local `BroadcastChannel` demo / remote WebSocket) to the
 * same id, so every peer opening the link lands in the same session. When the
 * parameter is absent (or blank) the default room is kept.
 *
 * `useSearchParams` is a Client Component hook: on statically prerendered
 * routes it must be rendered inside a `<Suspense>` boundary (Next.js build
 * requirement — `missing-suspense-with-csr-bailout`), which the Studio page
 * provides.
 */
export function CollabProviderFromUrl() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");
  const roomId = roomParam?.trim() || DEFAULT_ROOM_ID;
  return <CollabProvider roomId={roomId} />;
}
