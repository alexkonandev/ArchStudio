"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ResizablePanelOptions {
  /** localStorage key for the persisted width. */
  storageKey: string;
  /** Width used when nothing is persisted yet. */
  defaultWidth: number;
  /** Hard bounds so the layout can never break. */
  minWidth: number;
  maxWidth: number;
  /**
   * Which edge the handle sits on.
   * - `"right"`: handle on the right edge (left sidebar) — drag right to grow.
   * - `"left"`: handle on the left edge (right sidebar) — drag left to grow.
   */
  side: "left" | "right";
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const readStoredWidth = (
  storageKey: string,
  defaultWidth: number,
  minWidth: number,
  maxWidth: number,
): number => {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) {
      return defaultWidth;
    }
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return defaultWidth;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return defaultWidth;
    return clamp(parsed, minWidth, maxWidth);
  } catch {
    return defaultWidth;
  }
};

/**
 * Horizontally resizable sidebar panel.
 *
 * Returns the current width plus a `handleProps` spread for a
 * `ResizeHandle` element. Dragging updates the width live (pointer capture,
 * so releasing outside still ends the gesture); arrow keys on the focused
 * handle nudge by 8px; double-click resets to the default. Widths persist in
 * `localStorage` (debounced) so user preferences survive refresh.
 */
export function useResizablePanel({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  side,
}: ResizablePanelOptions) {
  const [width, setWidth] = useState<number>(() =>
    readStoredWidth(storageKey, defaultWidth, minWidth, maxWidth),
  );
  const dragStartRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (next: number) => {
      if (persistTimerRef.current !== null) {
        clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = setTimeout(() => {
        persistTimerRef.current = null;
        try {
          window.localStorage.setItem(storageKey, String(Math.round(next)));
        } catch {
          // Storage unavailable: widths still work in memory.
        }
      }, 250);
    },
    [storageKey],
  );

  useEffect(
    () => () => {
      if (persistTimerRef.current !== null) {
        clearTimeout(persistTimerRef.current);
      }
    },
    [],
  );

  const applyWidth = useCallback(
    (next: number) => {
      const clamped = clamp(Math.round(next), minWidth, maxWidth);
      setWidth(clamped);
      persist(clamped);
    },
    [minWidth, maxWidth, persist],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Left button (or touch/pen) only — right-click drag must not resize.
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
      dragStartRef.current = { startX: event.clientX, startWidth: width };
      const direction = side === "left" ? -1 : 1;
      const handleMove = (moveEvent: PointerEvent): void => {
        const start = dragStartRef.current;
        if (!start) return;
        applyWidth(start.startWidth + (moveEvent.clientX - start.startX) * direction);
      };
      const handleUp = (): void => {
        dragStartRef.current = null;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    },
    [width, applyWidth, side],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        applyWidth(width - 8);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        applyWidth(width + 8);
      }
    },
    [width, applyWidth],
  );

  const onDoubleClick = useCallback(() => {
    applyWidth(defaultWidth);
  }, [applyWidth, defaultWidth]);

  return {
    width,
    handleProps: { onPointerDown, onKeyDown, onDoubleClick },
  };
}
