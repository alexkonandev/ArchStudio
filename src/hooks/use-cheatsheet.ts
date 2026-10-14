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
 * Global `?` shortcut that toggles the keyboard cheatsheet.
 *
 * Mirrors `useGlobalHistoryShortcuts`: never fires while the user types in a
 * field. Calls `onToggle` so a single listener both opens and closes.
 */
export function useCheatsheet(onToggle: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "?") return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      onToggle();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle]);
}
