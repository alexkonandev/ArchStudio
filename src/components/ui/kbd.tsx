import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Keyboard shortcut hint. Renders a small monospaced "key cap". Accepts either a
 * raw string ("Ctrl") or a shortcut descriptor ("mod+z") where `mod` maps to
 * ⌘ on Apple platforms and Ctrl elsewhere.
 */
function Kbd({
  children,
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-0.5 rounded border border-border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground",
        "[&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

/** Normalise a `mod` token to the platform modifier for display. */
export function formatShortcut(shortcut: string): string[] {
  const isApple =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
  return shortcut.split("+").map((token) => {
    const key = token.trim()
    if (key === "mod") return isApple ? "⌘" : "Ctrl"
    if (key === "shift") return "⇧"
    if (key === "alt") return isApple ? "⌥" : "Alt"
    if (key === "del") return "⌫"
    return key.charAt(0).toUpperCase() + key.slice(1)
  })
}

export { Kbd }
