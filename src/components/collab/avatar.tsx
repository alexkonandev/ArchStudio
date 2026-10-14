"use client";

import { cn } from "@/lib/utils";
import type { CollabRole } from "@/types";

/** Role → accent + short French label used across collab UI. */
export const ROLE_META: Record<
  CollabRole,
  { label: string; ring: string; text: string }
> = {
  owner: { label: "Propriétaire", ring: "ring-violet-400", text: "text-violet-700" },
  editor: { label: "Éditeur", ring: "ring-emerald-400", text: "text-emerald-700" },
  viewer: { label: "Lecteur", ring: "ring-slate-300", text: "text-slate-600" },
};

/** Round pastel avatar with initials + a role-colored ring. */
export function Avatar({
  name,
  color,
  role = "editor",
  size = "md",
  className,
}: {
  name: string;
  color: string;
  role?: CollabRole;
  size?: "sm" | "md";
  className?: string;
}) {
  const initials = name
    .split(/[\s·]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white select-none",
        size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs",
        ROLE_META[role].ring,
        className,
      )}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      {initials || "?"}
    </span>
  );
}
