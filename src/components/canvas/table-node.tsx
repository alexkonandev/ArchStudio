"use client";

import { useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertTriangle, KeyRound, Link2, Lock, MessageSquare, OctagonAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TableFlowNode } from "@/types";
import { useGraphStore } from "@/store/graph-store";
import { useCollabStore } from "@/store/collab-store";
import { getTableColorTheme } from "@/lib/table-colors";
import { FloatingNodeToolbar } from "./floating-node-toolbar";
import { useTableLock, useUnreadCount } from "@/components/collab/collab-badges";

export function TableNode({ id, selected }: NodeProps<TableFlowNode>) {
  const table = useGraphStore((state) =>
    state.tables.find((t) => t.id === id),
  );
  const validationIssues = useGraphStore((state) => state.validationIssues);
  const relations = useGraphStore((state) => state.relations);
  const isFreshTable = useGraphStore((state) =>
    state.freshTableIds.includes(id),
  );
  const freshFieldIds = useGraphStore((state) => state.freshFieldIds);
  const consumeFreshIds = useGraphStore((state) => state.consumeFreshIds);
  // Collaboration: soft-lock owner + unread comment pastille.
  const lock = useTableLock(id);
  const unread = useUnreadCount(id);
  const setActiveCommentTableId = useCollabStore(
    (state) => state.setActiveCommentTableId,
  );
  const lockTable = useCollabStore((state) => state.lockTable);

  // One-shot birth animation: play `node-enter` for freshly created tables,
  // then consume the marker so re-renders/selection never replay it.
  useEffect(() => {
    if (!isFreshTable) return;
    const timer = setTimeout(() => consumeFreshIds([id], []), 300);
    return () => clearTimeout(timer);
  }, [isFreshTable, id, consumeFreshIds]);

  // Soft lock: selecting a node asserts an edit lock (skipped for viewers and
  // when another peer already holds a fresh lock). Released on deselect/unmount.
  const selfRole = useCollabStore((state) => state.self.role);
  const releaseLock = useCollabStore((state) => state.releaseLock);
  useEffect(() => {
    if (selfRole === "viewer") return;
    if (selected) {
      lockTable(id);
      return () => releaseLock(id);
    }
  }, [selected, id, selfRole, lockTable, releaseLock]);


  if (!table) return null;

  const tableIssues = validationIssues.filter(
    (issue) => issue.target.tableId === table.id,
  );
  const hasError = tableIssues.some((issue) => issue.severity === "error");
  const hasWarning = tableIssues.some((issue) => issue.severity === "warning");
  const fieldIssueSeverity = new Map<string, "error" | "warning">();
  for (const issue of tableIssues) {
    if (!issue.target.fieldId) continue;
    const current = fieldIssueSeverity.get(issue.target.fieldId);
    if (current !== "error") fieldIssueSeverity.set(issue.target.fieldId, issue.severity);
  }

  // Foreign keys: fields referenced as the FK column of a relation sourced here.
  const fkFieldIds = new Set(
    relations
      .filter((rel) => rel.fromTableId === table.id && rel.fromFieldId)
      .map((rel) => rel.fromFieldId as string),
  );
  // Indexed fields: any field covered by a declared index on this table.
  const indexedFieldIds = new Set(
    (table.indexes ?? []).flatMap((index) => index.fieldIds),
  );

  const theme = getTableColorTheme(table.color);

  return (
    <div className="relative">
      <FloatingNodeToolbar tableId={table.id} visible={selected} />
      <div
        className={cn(
          "w-60 overflow-hidden rounded-xl border bg-white/80 text-card-foreground shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-lg",
          "border-slate-200",
          selected && cn("shadow-lg ring-2", theme.ring, theme.border),
          !selected && hasError && "border-destructive",
          !selected && !hasError && hasWarning && "border-amber-500",
          isFreshTable && "node-enter",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2",
            theme.header,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {hasError ? (
              <OctagonAlert className="size-3.5 shrink-0 text-destructive" />
            ) : hasWarning ? (
              <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
            ) : null}
            <span className={cn("truncate text-sm font-semibold", theme.headerText)}>
              {table.name}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {lock && (
              <span
                className="flex items-center gap-1 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700"
                title={`${lock.userName} édite cette table`}
              >
                <Lock className="size-3" />
                {lock.userName.split(" ")[0]}
              </span>
            )}
            <button
              type="button"
              onClick={() => setActiveCommentTableId(table.id)}
              aria-label="Ouvrir les commentaires"
              className="nodrag relative flex items-center gap-1 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            >
              <MessageSquare className="size-3" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {unread}
                </span>
              )}
            </button>
            <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {table.fields.length} col.
            </span>
          </span>
        </div>
        <div className="divide-y divide-border/60">
          {table.fields.map((field) => {
            const severity = fieldIssueSeverity.get(field.id);
            const isFk = fkFieldIds.has(field.id);
            const isIndexed = indexedFieldIds.has(field.id);
            const isFreshField = freshFieldIds.includes(field.id);
            return (
              <div
                key={field.id}
                onAnimationEnd={
                  isFreshField
                    ? () => consumeFreshIds([], [field.id])
                    : undefined
                }
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors hover:bg-slate-50/80",
                  severity === "error" && "bg-destructive/10",
                  severity === "warning" && "bg-amber-500/10",
                  isFreshField && "field-flash",
                )}
              >
                <span className="flex w-6 shrink-0 items-center gap-0.5">
                  {field.isPrimaryKey ? (
                    <KeyRound
                      className="size-3 shrink-0 text-amber-500"
                      aria-label="Clé primaire"
                    />
                  ) : null}
                  {isFk ? (
                    <Link2
                      className="size-3 shrink-0 text-indigo-500"
                      aria-label="Clé étrangère"
                    />
                  ) : null}
                  {isIndexed ? (
                    <Zap
                      className="size-3 shrink-0 text-sky-500"
                      aria-label="Index"
                    />
                  ) : null}
                </span>
                <span className="truncate font-mono">{field.name}</span>
                {severity === "error" ? (
                  <OctagonAlert className="size-3 shrink-0 text-destructive" />
                ) : severity === "warning" ? (
                  <AlertTriangle className="size-3 shrink-0 text-amber-500" />
                ) : null}
                <span className="ml-auto shrink-0 font-mono text-muted-foreground tabular-nums">
                  {field.type}
                  {field.isList ? "[]" : ""}
                  {field.isNullable ? "?" : ""}
                </span>
              </div>
            );
          })}
        </div>
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-slate-400 !border-slate-500"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-slate-400 !border-slate-500"
        />
      </div>
    </div>
  );
}

