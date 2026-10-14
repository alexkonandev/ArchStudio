"use client";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

interface ResizeHandleProps {
  /** Which edge of the sidebar the handle sits on. */
  side: "left" | "right";
  label: string;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  onDoubleClick: () => void;
}

/**
 * Accessible vertical drag handle between a sidebar and the main content.
 *
 * - Pointer: drag to resize (see `useResizablePanel`).
 * - Keyboard: focusable (`tabIndex={0}`, `role="separator"`), ←/→ nudge 8px.
 * - Double-click resets to the default width.
 * The visible grip appears on hover/focus only, so the layout stays clean.
 */
export function ResizeHandle({
  side,
  label,
  onPointerDown,
  onKeyDown,
  onDoubleClick,
}: ResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group/handle relative z-10 w-2 shrink-0 cursor-col-resize touch-none outline-none select-none",
        side === "left" ? "-ml-1" : "-mr-1",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/handle:bg-primary/50 group-focus-visible/handle:bg-primary"
      />
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 shadow-sm group-hover/handle:flex group-focus-visible/handle:flex"
      >
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
      </span>
    </div>
  );
}
