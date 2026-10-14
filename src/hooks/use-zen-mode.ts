"use client";

import { useEffect } from "react";
import { useFocusStore } from "@/store/focus-store";

/** True when the event target is a text-editing surface. */
function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.closest !== "function") return false;
  return Boolean(
    element.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]',
    ),
  );
}

/**
 * Focus Graphe (full canvas) shortcuts.
 *
 * - `Shift+Z` toggles `focusCanvasOnly` (plain Shift+Z, no Ctrl/Cmd so it never
 *   collides with `Ctrl+Shift+Z` redo, which always carries ctrl/meta).
 * - `Escape` exits focus mode (and lets the canvas' own Escape handler
 *   deselect afterwards — both listeners coexist on `window`).
 * - Also listens to the ⌘K palette bus (`archstudio:toggle-canvas-focus`).
 *
 * Ignored inside editable fields, like every other global shortcut.
 */
export function useCanvasFocus(): void {
  useEffect(() => {
    const onBusToggle = (): void => {
      useFocusStore.getState().toggleFocusCanvasOnly();
    };
    window.addEventListener("archstudio:toggle-canvas-focus", onBusToggle);
    return () =>
      window.removeEventListener("archstudio:toggle-canvas-focus", onBusToggle);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      // Never steal redo (Ctrl/Cmd+Shift+Z) or Alt+Z (Code Studio zen).
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Escape") {
        if (useFocusStore.getState().focusCanvasOnly) {
          useFocusStore.getState().setFocusCanvasOnly(false);
        }
        return;
      }

      // Shift+Z: `key` is "Z" with shift, "z" on some layouts — normalise.
      if (event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        useFocusStore.getState().toggleFocusCanvasOnly();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
