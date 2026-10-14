"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "@/lib/utils"
import { Kbd, formatShortcut } from "./kbd"

/**
 * Accessible tooltip with an optional keyboard-shortcut hint.
 *
 * `render` lets the trigger wrap any element (Button, menu item, icon…). The
 * shortcut is rendered as platform-aware `<Kbd>` caps on the right of the label.
 */
function Tooltip({
  label,
  shortcut,
  side = "top",
  children,
}: {
  label: React.ReactNode
  /** e.g. "mod+z", "del", "?" — rendered as kbd caps. */
  shortcut?: string
  side?: "top" | "bottom" | "left" | "right"
  /** The trigger element to attach to. */
  children: React.ReactElement
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6} className="z-[90]">
          <TooltipPrimitive.Popup
            className={cn(
              "glass-panel flex max-w-xs items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium shadow-lg ring-1 ring-foreground/10 backdrop-blur-md",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0",
            )}
          >
            <span>{label}</span>
            {shortcut && (
              <span className="flex items-center gap-0.5">
                {formatShortcut(shortcut).map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            )}
            <TooltipPrimitive.Arrow className="fill-foreground/10" />
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip }
