"use client";

import { Boxes, GitBranch, KeyRound, Table2, TriangleAlert, OctagonAlert, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RobustnessAlert, SchemaStats } from "@/lib/engine/codegen";

const SEVERITY_STYLES: Record<RobustnessAlert["severity"], { ring: string; icon: typeof Table2; label: string }> = {
  error: { ring: "border-destructive/40 bg-destructive/10", icon: OctagonAlert, label: "Erreur" },
  warning: { ring: "border-amber-500/40 bg-amber-500/10", icon: TriangleAlert, label: "Avertissement" },
  info: { ring: "border-border bg-muted/40", icon: Info, label: "Info" },
};

const SEVERITY_ICON_COLOR: Record<RobustnessAlert["severity"], string> = {
  error: "text-destructive",
  warning: "text-amber-500",
  info: "text-muted-foreground",
};

/**
 * Right panel: live schema statistics + static robustness analysis. Alerts can
 * be clicked to jump back to the offending table on the canvas.
 */
export function DiagnosticsPanel({
  stats,
  alerts,
  onGoToTable,
  onHoverTable,
}: {
  stats: SchemaStats;
  alerts: RobustnessAlert[];
  onGoToTable: (tableId: string) => void;
  /** Optional hover link: highlights the offending table's lines in the editor. */
  onHoverTable?: (tableId: string | null) => void;
}) {
  const errorCount = alerts.filter((a) => a.severity === "error").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold">Diagnostics</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Analyse du schéma en direct et contrôles de robustesse.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-border p-4">
        <Stat icon={Table2} label="Tables" value={stats.tables} />
        <Stat icon={GitBranch} label="Relations" value={stats.relations} />
        <Stat icon={KeyRound} label="Champs" value={stats.fields} />
        <Stat icon={Boxes} label="Énums" value={stats.enums} />
      </div>

      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Badge variant={errorCount > 0 ? "destructive" : "secondary"}>
          {errorCount} erreur{errorCount === 1 ? "" : "s"}
        </Badge>
        <Badge variant="secondary">{warningCount} avertissement{warningCount === 1 ? "" : "s"}</Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {alerts.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Aucun problème de robustesse détecté. Le schéma semble sain. 🎉
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
