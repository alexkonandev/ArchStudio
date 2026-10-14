import type { TableColor } from "@/types";

/**
 * Tailwind class bundles for each pastel accent.
 *
 * IMPORTANT: these are written as complete literal strings (never assembled at
 * runtime) so Tailwind's JIT scanner can see every utility and emit the CSS.
 * Each accent exposes a frosted-glass header, an accent border, a solid dot and
 * a soft ring used across the canvas node + floating toolbar.
 */
export interface TableColorTheme {
  /** Frosted header background (light glass). */
  header: string;
  /** Header foreground text. */
  headerText: string;
  /** Accent border used on selection / highlight. */
  border: string;
  /** Solid accent dot (badge / toolbar swatch). */
  dot: string;
  /** Soft focus/selection ring. */
  ring: string;
}

export const TABLE_COLOR_THEMES: Record<TableColor, TableColorTheme> = {
  emerald: {
    header: "bg-emerald-500/10",
    headerText: "text-emerald-900",
    border: "border-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-400/50",
  },
  indigo: {
    header: "bg-indigo-500/10",
    headerText: "text-indigo-900",
    border: "border-indigo-400",
    dot: "bg-indigo-500",
    ring: "ring-indigo-400/50",
  },
  rose: {
    header: "bg-rose-500/10",
    headerText: "text-rose-900",
    border: "border-rose-400",
    dot: "bg-rose-500",
    ring: "ring-rose-400/50",
  },
  amber: {
    header: "bg-amber-500/10",
    headerText: "text-amber-900",
    border: "border-amber-400",
    dot: "bg-amber-500",
    ring: "ring-amber-400/50",
  },
  slate: {
    header: "bg-slate-500/10",
    headerText: "text-slate-900",
    border: "border-slate-400",
    dot: "bg-slate-500",
    ring: "ring-slate-400/50",
  },
};

/** Resolve the theme for a (possibly undefined) table color. */
export function getTableColorTheme(color: TableColor | undefined): TableColorTheme {
  return TABLE_COLOR_THEMES[color ?? "slate"];
}
