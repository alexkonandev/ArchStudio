"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { pushToast } from "@/components/ui/toast";

export interface CollabPeer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  updatedAt: number;
}

const CHANNEL = "archstudio:collab-presence";
const HEARTBEAT_MS = 1500;
const STALE_MS = 6000;
const PEER_COLORS = ["#7c3aed", "#059669", "#ea580c", "#db2777", "#0284c7", "#ca8a04"];
const FIRST_NAMES = ["Ava", "Léo", "Mia", "Néo", "Zoé", "Hugo", "Lina", "Adam"];

export const peerColor = (id: string): string => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PEER_COLORS[h % PEER_COLORS.length];
};

const randomName = (id: string): string => {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 13 + id.charCodeAt(i)) >>> 0;
  return `${FIRST_NAMES[h % FIRST_NAMES.length]} · ${id.slice(-4).toUpperCase()}`;
};

interface PresenceMessage {
  kind: "hello" | "cursor" | "bye";
  id: string;
  name: string;
  x?: number;
  y?: number;
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
  const selfName = useMemo(() => randomName(selfId), [selfId]);
  const cursorRef = useRef({ x: 0.5, y: 0.3 });

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ kind: "hello", id: selfId, name: selfName, x: 0.5, y: 0.3 });

    channel.onmessage = (event: MessageEvent<PresenceMessage>) => {
      const msg = event.data;
      if (!msg || msg.id === selfId) return;
      if (msg.kind === "bye") {
        setPeers((prev) => prev.filter((p) => p.id !== msg.id));
        return;
      }
      setPeers((prev) => {
        const peer: CollabPeer = {
          id: msg.id,
          name: msg.name || randomName(msg.id),
          color: prev.find((p) => p.id === msg.id)?.color ?? peerColor(msg.id),
          x: typeof msg.x === "number" ? msg.x : 0.5,
          y: typeof msg.y === "number" ? msg.y : 0.3,
          updatedAt: Date.now(),
        };
        return [...prev.filter((p) => p.id !== msg.id), peer];
      });
      if (msg.kind === "hello") {
        channel.postMessage({ kind: "cursor", id: selfId, name: selfName, x: cursorRef.current.x, y: cursorRef.current.y });
      }
    };

    const onMove = (e: PointerEvent): void => {
      cursorRef.current = { x: e.clientX / (window.innerWidth || 1), y: e.clientY / (window.innerHeight || 1) };
    };
    const heartbeat = window.setInterval(() => {
      channel.postMessage({ kind: "cursor", id: selfId, name: selfName, x: cursorRef.current.x, y: cursorRef.current.y });
      setPeers((prev) => prev.filter((p) => Date.now() - p.updatedAt < STALE_MS));
    }, HEARTBEAT_MS);

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pointermove", onMove);
      try { channel.postMessage({ kind: "bye", id: selfId, name: selfName }); } catch { /* closed */ }
      channel.close();
      setPeers([]);
    };
  }, [enabled, selfId, selfName]);

  return { peers, selfId };
}
export function CollabCursors({ peers }: { peers: CollabPeer[] }) {
  if (peers.length === 0) return null;
  return (
    <div data-collab-cursor data-export-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      {peers.map((peer) => (
        <div key={peer.id} className="absolute transition-[left,top] duration-150 ease-out" style={{ left: `${peer.x * 100}%`, top: `${peer.y * 100}%` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={peer.color} stroke="white" strokeWidth="1.5" aria-hidden>
            <path d="M5 3l14 7-6.5 1.5L9 18 5 3z" />
          </svg>
          <span className="ml-4 -mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow" style={{ backgroundColor: peer.color }}>
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
    description: enabled ? "Ouvrez ArchStudio dans un 2ᵉ onglet pour voir les curseurs temps réel." : "Présence temps réel coupée.",
  });
}

