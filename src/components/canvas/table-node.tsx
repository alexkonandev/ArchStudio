"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertTriangle, KeyRound, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TableFlowNode } from "@/types";
import { useGraphStore } from "@/store/graph-store";

export function TableNode({ id, selected }: NodeProps<TableFlowNode>) {
  const table = useGraphStore((state) =>
    state.tables.find((t) => t.id === id),
  );
  const validationIssues = useGraphStore((state) => state.validationIssues);

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

  return (
    <div
      className={cn(
        "w-60 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xl transition-colors",
        selected ? "border-primary" : "border-border",
        hasError && "border-destructive",
        !hasError && hasWarning && "border-amber-500",
      )}
    >
      <div className="flex items-center justify-between bg-muted/60 px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {hasError ? (
            <OctagonAlert className="size-3.5 shrink-0 text-destructive" />
          ) : hasWarning ? (
            <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
          ) : null}
          <span className="truncate text-sm font-semibold">{table.name}</span>
        </span>
        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground">
          {table.fields.length} cols
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {table.fields.map((field) => {
          const severity = fieldIssueSeverity.get(field.id);
          return (
            <div
              key={field.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs",
                severity === "error" && "bg-destructive/10",
                severity === "warning" && "bg-amber-500/10",
              )}
            >
              {field.isPrimaryKey ? (
                <KeyRound className="size-3 shrink-0 text-amber-400" />
              ) : (
                <span className="size-3 shrink-0" />
              )}
              <span className="truncate font-mono">{field.name}</span>
              {severity === "error" ? (
                <OctagonAlert className="size-3 shrink-0 text-destructive" />
              ) : severity === "warning" ? (
                <AlertTriangle className="size-3 shrink-0 text-amber-500" />
              ) : null}
              <span className="ml-auto shrink-0 font-mono text-muted-foreground">
                {field.type}
                {field.isNullable ? "?" : ""}
              </span>
            </div>
          );
        })}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary"
      />
    </div>
  );
}
