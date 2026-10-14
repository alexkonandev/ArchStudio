"use client";

import { create } from "zustand";

interface FocusStore {
  /** Full-canvas mode: hides header + both sidebars, canvas takes 100%. */
  focusCanvasOnly: boolean;
  setFocusCanvasOnly: (value: boolean) => void;
  toggleFocusCanvasOnly: () => void;
}

/**
 * Global Focus Graphe state (canvas route).
 *
 * Kept in a tiny zustand store (not inside `GraphCanvas`) so the header,
 * the workspace shell and the canvas can all react without prop drilling
 * and without remounting `ReactFlow` — toggling only hides chrome via CSS,
 * so node positions and zoom are preserved.
 */
export const useFocusStore = create<FocusStore>()((set) => ({
  focusCanvasOnly: false,
  setFocusCanvasOnly: (value) => set({ focusCanvasOnly: value }),
  toggleFocusCanvasOnly: () =>
    set((state) => ({ focusCanvasOnly: !state.focusCanvasOnly })),
}));

/** Imperative toggle for the ⌘K palette (mirrors `toggleZenMode`). */
export function toggleCanvasFocus(): void {
  window.dispatchEvent(new CustomEvent("archstudio:toggle-canvas-focus"));
}
