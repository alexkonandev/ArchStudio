"use client";

import {
  Activity,
  Boxes,
  GitBranch,
  KeyRound,
  OctagonAlert,
  ShieldCheck,
  Table2,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HealthScoreResult } from "@/lib/engine/health-score";
import type { ValidationIssue } from "@/types";
import type { RobustnessAlert, SchemaStats } from "@/lib/engine/codegen";

const SEVERITY_STYLES: Record<
  RobustnessAlert["severity"],
  { ring: string; icon: typeof Table2; label: string }
> = {
  error: { ring: "border-destructive/40 bg-destructive/10", icon: OctagonAlert, label: "Erreur" },
  warning: { ring: "border-amber-500/40 bg-amber-500/10", icon: TriangleAlert, label: "Avertissement" },
  info: { ring: "border-border bg-muted/40", icon: ShieldCheck, label: "Info" },
};

const SEVERITY_ICON_COLOR: Record<RobustnessAlert["severity"], string> = {
  error: "text-destructive",
  warning: "text-amber-500",
  info: "text-muted-foreground",
};

/** Progress-bar + rank tone keyed by score band (mirrors the canvas widget). */
function scoreTone(score: number): { bar: string; text: string } {
  if (score >= 90) return { bar: "bg-emerald-500", text: "text-emerald-600" };
  if (score >= 75) return { bar: "bg-sky-500", text: "text-sky-600" };
  if (score >= 50) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-rose-500", text: "text-rose-600" };
}

/**
 * Right panel: the schema Health Score, live statistics, graph validation
 * errors and static robustness analysis — wired together so a low score
 * immediately explains which errors dragged it down. Errors and alerts can be
 * clicked to jump back to the offending table on the canvas.
 */
export function DiagnosticsPanel({
  stats,
  health,
  issues,
  alerts,
  onGoToTable,
  onRevealTable,
  onHoverTable,
}: {
  stats: SchemaStats;
  /** Gamified health score derived from the live validation issues. */
  health: HealthScoreResult;
  /** Graph integrity issues (errors + warnings) from `validateGraph`. */
  issues: ValidationIssue[];
  alerts: RobustnessAlert[];
  /** Jump to the offending table on the canvas (navigates to `/studio`). */
  onGoToTable: (tableId: string) => void;
  /** Reveal the table's block in the Monaco editor (stays on this page). */
  onRevealTable: (tableId: string) => void;
  /** Optional hover link: highlights the offending table's lines in the editor. */
  onHoverTable?: (tableId: string | null) => void;
}) {
  const tone = scoreTone(health.score);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold">Diagnostics</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Santé du schéma et contrôles de robustesse en direct.
        </p>
      </div>

      {/* Health Score — mirrors the gamified canvas widget. */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={cn("size-4", tone.text)} />
            <span className="text-xs font-medium">Santé du schéma</span>
          </div>
          <span className={cn("text-lg leading-none font-bold tabular-nums", tone.text)}>
            {health.score}%
          </span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={health.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Score de santé du schéma"
        >
          <div
            className={cn("h-full rounded-full transition-all duration-500 ease-out", tone.bar)}
            style={{ width: `${health.score}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{health.rank.label}</Badge>
          {health.errorCount > 0 ? (
            <Badge variant="destructive">
              {health.errorCount} erreur{health.errorCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
          {health.warningCount > 0 ? (
            <Badge variant="secondary">
              {health.warningCount} avertissement{health.warningCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 border-b border-border p-4">
        <Stat icon={Table2} label="Tables" value={stats.tables} />
        <Stat icon={GitBranch} label="Relations" value={stats.relations} />
        <Stat icon={KeyRound} label="Champs" value={stats.fields} />
        <Stat icon={Boxes} label="Énums" value={stats.enums} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Schema integrity issues (graph errors + warnings). */}
        <div className="border-b border-border p-3">
          <p className="mb-2 px-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Intégrité du graphe
          </p>
          {issues.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
              Aucune erreur d&apos;intégrité. Le graphe est sain. 🎉
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {issues.map((issue) => {
                const isError = issue.severity === "error";
                return (
                  <li
                    key={issue.id}
                    onMouseEnter={() => onHoverTable?.(issue.target.tableId ?? null)}
                    onMouseLeave={() => onHoverTable?.(null)}
                    className={cn(
                      "cursor-pointer rounded-lg border p-2.5 text-xs transition-colors hover:ring-2 hover:ring-ring/40",
                      isError
                        ? "border-destructive/40 bg-destructive/10"
                        : "border-amber-500/40 bg-amber-500/10",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isError ? (
                        <OctagonAlert className="size-4 shrink-0 text-destructive" />
                      ) : (
                        <TriangleAlert className="size-4 shrink-0 text-amber-500" />
                      )}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {isError ? "Erreur" : "Avertissement"}
                      </span>
                    </div>
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">{issue.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onRevealTable(issue.target.tableId)}
                      >
                        Voir dans l&apos;éditeur
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onGoToTable(issue.target.tableId)}
                      >
                        Aller au canvas
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Robustesse */}
        <div className="p-3">
          <p className="mb-2 px-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Robustesse
          </p>

        {alerts.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
            Aucun problème de robustesse détecté.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((alert) => {
              const style = SEVERITY_STYLES[alert.severity];
              const Icon = style.icon;
              return (
                <li
                  key={alert.id}
                  onMouseEnter={() => onHoverTable?.(alert.tableId ?? null)}
                  onMouseLeave={() => onHoverTable?.(null)}
                  className={cn(
                    "rounded-lg border p-2.5 text-xs transition-colors",
                    alert.tableId && "cursor-pointer",
                    style.ring,
                    alert.tableId && "hover:ring-2 hover:ring-ring/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("size-4 shrink-0", SEVERITY_ICON_COLOR[alert.severity])} />
                    <span className="font-medium">{alert.title}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {style.label}
                    </span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{alert.message}</p>
                  {alert.tableId && (
                    <Button
                      variant="outline"
                      size="xs"
                      className="mt-2"
                      onClick={() => onGoToTable(alert.tableId as string)}
                    >
                      Aller à la table
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Table2;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-2">
      <Icon className="size-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-lg leading-none font-semibold tabular-nums">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
