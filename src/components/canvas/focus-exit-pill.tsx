"use client";

import { Minimize2 } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { useFocusStore } from "@/store/focus-store";

/**
 * Discreet floating exit control for Focus Graphe.
 *
 * Rendered at the bottom-center of the canvas (between MiniMap and
 * Controls), only while `focusCanvasOnly` is active. One click — or
 * `Shift+Z` / `Escape` — restores the studio chrome.
 */
export function FocusExitPill() {
  const focusCanvasOnly = useFocusStore((state) => state.focusCanvasOnly);
  const setFocusCanvasOnly = useFocusStore((state) => state.setFocusCanvasOnly);

  if (!focusCanvasOnly) return null;

  return (
    <button
      type="button"
      onClick={() => setFocusCanvasOnly(false)}
      aria-label="Quitter le mode Focus Graphe"
      title="Quitter le mode Focus (Shift+Z ou Échap)"
      className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/80 py-1 pr-3 pl-1.5 text-[11px] text-slate-600 opacity-60 shadow-lg backdrop-blur-md transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-white">
        <Minimize2 className="size-3.5" />
      </span>
      Quitter le focus
      <span className="flex items-center gap-0.5">
        <Kbd>⇧</Kbd>
        <Kbd>Z</Kbd>
      </span>
      <span className="text-slate-400">·</span>
      <Kbd>Échap</Kbd>
    </button>
  );
}
