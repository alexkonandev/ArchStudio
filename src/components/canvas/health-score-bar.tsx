"use client";

import { useMemo } from "react";
import { Award, ShieldCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGraphStore } from "@/store/graph-store";
import {
  computeHealthScore,
  type HealthScoreResult,
} from "@/lib/engine/health-score";
import { useHealthCelebration } from "@/hooks/use-health-celebration";
import { CelebrationConfetti } from "./celebration-confetti";


/** Color of the progress fill + ring, keyed by score band. */
function scoreTone(score: number): {
  bar: string;
  text: string;
  glow: string;
} {
  if (score >= 90)
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-700",
      glow: "shadow-emerald-500/30",
    };
  if (score >= 75)
    return {
      bar: "bg-sky-500",
      text: "text-sky-700",
      glow: "shadow-sky-500/30",
    };
  if (score >= 50)
    return {
      bar: "bg-amber-500",
      text: "text-amber-700",
      glow: "shadow-amber-500/30",
    };
  return {
    bar: "bg-rose-500",
    text: "text-rose-700",
    glow: "shadow-rose-500/30",
  };
}

/**
 * Gamified schema health widget pinned to the top of the canvas.
 *
 * Derives a 0–100 score from the live validation issues (memoised selector so
 * it never touches the persisted store) and shows a rank badge + progress bar
 * that transitions smoothly as the schema heals or degrades.
 */
export function HealthScoreBar() {
  const tables = useGraphStore((state) => state.tables);
  const relations = useGraphStore((state) => state.relations);
  const validationIssues = useGraphStore((state) => state.validationIssues);

  const health: HealthScoreResult = useMemo(
    () => computeHealthScore(tables, relations, validationIssues),
    [tables, relations, validationIssues],
  );

  const tone = scoreTone(health.score);
  const isPerfect = health.score === 100;
  // Silent: the global layout mount owns the shared confetti canvas; this
  // widget only renders its local pop/shine/delta visuals.
  const celebration = useHealthCelebration({ silent: true });

  return (
    <div className="pointer-events-none absolute top-3 left-1/2 z-10 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2">
      <CelebrationConfetti
        active={celebration.confetti}
        onDone={celebration.dismissConfetti}
      />
      {/* Floating score delta ("+8") on improvements. */}
      {celebration.delta !== null && (
        <span
          key={`delta-${celebration.delta}-${celebration.popKey}`}
          role="status"
          aria-label={`Score amélioré de ${celebration.delta} points`}
          onAnimationEnd={celebration.clearDelta}
          className="score-delta-rise pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-md tabular-nums"
        >
          +{celebration.delta}
        </span>
      )}
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-md transition-shadow duration-300",
          isPerfect && cn("shadow-lg", tone.glow),
        )}
      >
        {/* Rank badge — pops + shines exactly once per level-up (key remount). */}
        <span
          key={`rank-${celebration.shineKey}`}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
            isPerfect
              ? "bg-emerald-500/15 text-emerald-700"
              : "bg-slate-500/10 text-slate-700",
            celebration.shineKey > 0 && "badge-shine",
          )}
          aria-label={`Rang : ${health.rank.label}`}
        >
          {isPerfect ? (
            <Award className="size-3.5" />
          ) : (
            <ShieldCheck className="size-3.5" />
          )}
          <span className="whitespace-nowrap">{health.rank.label}</span>
        </span>

        {/* Progress bar */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-medium">
            <span className="text-muted-foreground">Santé du schéma</span>
            {/* Score pops once per celebration (key remount); tabular-nums keeps digits stable. */}
            <span key={`score-${celebration.popKey}`} className={cn("tabular-nums", tone.text, celebration.popKey > 0 && "score-pop")}>
              {health.score}%
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80"
            role="progressbar"
            aria-valuenow={health.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Score de santé du schéma"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                tone.bar,
                isPerfect && "progress-shimmer",
              )}
              style={{ width: `${health.score}%` }}
            />
          </div>
        </div>

        {/* Issue counters */}
        {(health.errorCount > 0 || health.warningCount > 0) && (
          <span
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600"
            aria-label={`${health.errorCount} erreur(s), ${health.warningCount} avertissement(s)`}
          >
            <TriangleAlert className="size-3.5" />
            {health.errorCount + health.warningCount}
          </span>
        )}
      </div>
    </div>
  );
}
