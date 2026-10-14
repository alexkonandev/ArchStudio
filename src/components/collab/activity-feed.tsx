"use client";

import { useMemo } from "react";
import {
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Wand2,
  Link2,
  Lock,
  ShieldCheck,
  Type,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCollabStore } from "@/store/collab-store";
import { useGraphStore } from "@/store/graph-store";
import { Avatar } from "./avatar";
import type { ActivityKind } from "@/types";

const KIND_ICON: Record<ActivityKind, typeof Pencil> = {
  join: UserPlus,
  leave: UserMinus,
  create: Plus,
  delete: Trash2,
  rename: Type,
  field: Pencil,
  normalize: Wand2,
  comment: MessageSquare,
  lock: Lock,
  role: ShieldCheck,
};

const KIND_TONE: Record<ActivityKind, string> = {
  join: "text-emerald-600",
  leave: "text-slate-400",
  create: "text-indigo-600",
  delete: "text-rose-600",
  rename: "text-amber-600",
  field: "text-sky-600",
  normalize: "text-violet-600",
  comment: "text-amber-500",
  lock: "text-orange-500",
  role: "text-emerald-600",
};

const relativeTime = (ts: number): string => {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "à l'instant";
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  return `il y a ${h}h`;
};

/** Sliding side panel listing the chronological team activity feed. */
export function ActivityFeed() {
  const open = useCollabStore((s) => s.activityOpen);
  const setOpen = useCollabStore((s) => s.setActivityOpen);
  const activity = useCollabStore((s) => s.activity);
  const self = useCollabStore((s) => s.self);
  const selectNode = useGraphStore((s) => s.selectNode);
  const tables = useGraphStore((s) => s.tables);

  const nameOf = useMemo(() => {
    const map = new Map(tables.map((t) => [t.id, t.name]));
    return (id?: string) => (id ? map.get(id) ?? id : undefined);
  }, [tables]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Link2 className="size-4" /> Journal d&apos;activité
          </SheetTitle>
          <SheetDescription>
            Historique chronologique des actions de l&apos;équipe en temps réel.
          </SheetDescription>
        </SheetHeader>

        {activity.length === 0 ? (
          <p className="mt-6 rounded-lg border border-border p-4 text-center text-xs text-muted-foreground">
            Aucune activité pour l&apos;instant. Créez une table, appliquez la
            normalisation ou commentez pour démarrer le journal.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 overflow-y-auto p-4 pt-0">
            {activity.map((entry) => {
              const Icon = KIND_ICON[entry.kind];
              const tableLabel = nameOf(entry.tableId);
              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted",
                      KIND_TONE[entry.kind],
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{entry.authorName}</span>{" "}
                      {entry.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {relativeTime(entry.createdAt)}
                    </p>
                  </div>
                  {entry.tableId && tableLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        selectNode(entry.tableId as string);
                        setOpen(false);
                      }}
                      className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {tableLabel}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-auto flex items-center gap-2 border-t p-3 text-[11px] text-muted-foreground">
          <Avatar
            name={self.name}
            color={self.avatarColor}
            role={self.role}
            size="sm"
          />
          Connecté en tant que{" "}
          <span className="font-medium text-foreground">{self.name}</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
