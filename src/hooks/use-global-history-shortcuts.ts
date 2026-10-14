import { useEffect } from "react";
import { useGraphStore } from "@/store/graph-store";

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
 * Global undo/redo shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y).
 *
 * Shared by the canvas (`/`) and the Code Studio (`/studio`) since both edit
 * the same persisted store. Never steals Ctrl+Z from text fields — native
 * text undo keeps working there.
 */
export function useGlobalHistoryShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        if (isEditableTarget(event.target)) return;
        event.preventDefault();
        useGraphStore.getState().undo();
        return;
      }
      if (
        (key === "y" || (key === "z" && event.shiftKey)) &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        useGraphStore.getState().redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
