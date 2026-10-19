"use client";

import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { pushToast } from "@/components/ui/toast";
import type { CursorSyncMessage } from "@/types";
import { sendTransport, subscribeTransport } from "@/lib/collab/transport";
import { DEFAULT_USERNAME, useProfileStore } from "@/store/profile-store";
import { useCollabStore } from "@/store/collab-store";

export interface CollabPeer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  updatedAt: number;
}

const HEARTBEAT_MS = 1500;
const STALE_MS = 6000;
/** Fallback accents for peers that send no color (never generated names). */
const PEER_COLORS = ["#7c3aed", "#059669", "#ea580c", "#db2777", "#0284c7", "#ca8a04"];

/** Deterministic fallback accent when a cursor message carries no color. */
export const peerColor = (id: string): string => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PEER_COLORS[h % PEER_COLORS.length];
};

/**
 * Readable foreground for a cursor chip: profile accents are pastel (light
 * fills → slate text), saturated fallbacks keep white text.
 */
export function readableOn(hex: string): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#0f172a";
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "#0f172a";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}

export function useCollabPresence(enabled: boolean): { peers: CollabPeer[]; selfId: string } {
  const [peers, setPeers] = useState<CollabPeer[]>([]);
  // Stable per-session peer id. Use a lazy useState initialiser so the impure
  // id generation runs exactly once at mount (not during later renders).
  const [selfId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `peer-${Math.random().toString(36).slice(2)}`,
  );
  const cursorRef = useRef({ x: 0.5, y: 0.3 });

  // Cursor labels mirror the avatar stack: the live session pseudo (user-picked
  // or automatic `Hôte` / `Invité #N` default) plus the persisted accent color.
  // Hydration is client-only (idempotent) so SSR output stays deterministic.
  useEffect(() => {
    useProfileStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    // Read the profile at send time: profile edits propagate on the next
    // heartbeat without re-creating the subscription (no churn while typing).
    const announce = (
      kind: CursorSyncMessage["kind"],
      x?: number,
      y?: number,
    ): void => {
      const profile = useProfileStore.getState();
      const message: CursorSyncMessage = {
        kind,
        id: selfId,
        // Same display name as the avatar stack: the session pseudo (custom or
        // automatic `Hôte` / `Invité #N`), with the profile as last resort.
        name:
          useCollabStore.getState().self.name.trim() ||
          profile.username.trim() ||
          DEFAULT_USERNAME,
        color: profile.userColor,
        x,
        y,
      };
      sendTransport("cursor", message);
    };

    // Subscribe to the shared `cursor` topic (local BroadcastChannel demo or
    // remote WebSocket network — same code either way).
    const unsubscribe = subscribeTransport("cursor", (payload) => {
      if (!payload || typeof payload !== "object") return;
      const msg = payload as Partial<CursorSyncMessage>;
      if (typeof msg.id !== "string" || typeof msg.kind !== "string") return;
      const peerId = msg.id;
      const kind = msg.kind;
      if (peerId === selfId) return;
      if (kind === "bye") {
        setPeers((prev) => prev.filter((p) => p.id !== peerId));
        return;
      }
      setPeers((prev) => {
        const peer: CollabPeer = {
          id: peerId,
          name: (msg.name && msg.name.trim()) || DEFAULT_USERNAME,
          color: msg.color || peerColor(peerId),
          x: typeof msg.x === "number" ? msg.x : 0.5,
          y: typeof msg.y === "number" ? msg.y : 0.3,
          updatedAt: Date.now(),
        };
        return [...prev.filter((p) => p.id !== peerId), peer];
      });
      if (kind === "hello") {
        announce("cursor", cursorRef.current.x, cursorRef.current.y);
      }
    });

    announce("hello", 0.5, 0.3);

    const onMove = (e: PointerEvent): void => {
      cursorRef.current = { x: e.clientX / (window.innerWidth || 1), y: e.clientY / (window.innerHeight || 1) };
    };
    const heartbeat = window.setInterval(() => {
      announce("cursor", cursorRef.current.x, cursorRef.current.y);
      setPeers((prev) => prev.filter((p) => Date.now() - p.updatedAt < STALE_MS));
    }, HEARTBEAT_MS);

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pointermove", onMove);
      announce("bye");
      unsubscribe();
      setPeers([]);
    };
  }, [enabled, selfId]);

  return { peers, selfId };
}
export function CollabCursors({ peers }: { peers: CollabPeer[] }) {
  if (peers.length === 0) return null;
  return (
    <div data-collab-cursor data-export-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      {peers.map((peer) => (
        <div key={peer.id} className="absolute transition-[left,top] duration-150 ease-out" style={{ left: `${peer.x * 100}%`, top: `${peer.y * 100}%` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={peer.color} stroke="rgba(15,23,42,0.65)" strokeWidth="1.5" aria-hidden>
            <path d="M5 3l14 7-6.5 1.5L9 18 5 3z" />
          </svg>
          <span
            className="ml-4 -mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ring-1 ring-slate-200"
            style={{ backgroundColor: peer.color, color: readableOn(peer.color) }}
          >
            {peer.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CollabToggle({ enabled, count, onToggle }: { enabled: boolean; count: number; onToggle: () => void }) {
  return (
    <Tooltip label={enabled ? `Collab active — ${count} architecte(s) en ligne` : "Activer la revue collaborative"} side="bottom">
      <Button size="sm" variant={enabled ? "default" : "outline"} onClick={onToggle} aria-pressed={enabled} data-export-hidden>
        <Users className="size-4" />
        <span className={cn(!enabled && "hidden xl:inline")}>Collab</span>
        {enabled && (<span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-[11px] font-bold">{count + 1}</span>)}
      </Button>
    </Tooltip>
  );
}

export function collabToast(enabled: boolean): void {
  pushToast(enabled ? "Revue collaborative activée" : "Revue collaborative désactivée", {
    type: "info",
    description: enabled
      ? "Les curseurs temps réel des collaborateurs de la salle s'affichent ici (multi-onglet en local, multi-PC si le réseau est configuré)."
      : "Présence temps réel coupée.",
  });
}

