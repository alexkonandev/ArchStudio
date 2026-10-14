import { useEffect } from "react";

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
 * Global `?` shortcut that opens the keyboard cheatsheet.
 *
 * Mirrors `useGlobalHistoryShortcuts`: never fires while the user types in a
 * field. Returns a `setOpen` control the caller wires to its dialog state.
 */
export function useCheatsheet(setOpen: (open: boolean) => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "?") return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);
}
