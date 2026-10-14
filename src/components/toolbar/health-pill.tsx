"use client"

import { useMemo } from "react"
import { Award, ShieldCheck, TriangleAlert, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGraphStore } from "@/store/graph-store"
import { computeHealthScore } from "@/lib/engine/health-score"
import { useHealthCelebration } from "@/hooks/use-health-celebration"

/** Color tokens keyed by score band (mirrors health-score-bar.tsx). */
function scoreTone(score: number): { bar: string; text: string; ring: string } {
  if (score >= 90) return { bar: "bg-emerald-500", text: "text-emerald-700", ring: "hover:bg-emerald-500/10" }
  if (score >= 75) return { bar: "bg-sky-500", text: "text-sky-700", ring: "hover:bg-sky-500/10" }
  if (score >= 50) return { bar: "bg-amber-500", text: "text-amber-700", ring: "hover:bg-amber-500/10" }
  return { bar: "bg-rose-500", text: "text-rose-700", ring: "hover:bg-rose-500/10" }
}

/**
 * Compact gamification pill for the Topbar: rank badge + live health score +
 * issue counter. Clicking it opens the validation sheet; the optional
 * {@link onNormalize} action surfaces a "normalise in one click" button
 * whenever the schema can still be improved.
 */
export function HealthPill({
  onOpenIssues,
  onNormalize,
}: {
  onOpenIssues: () => void
  onNormalize?: () => void
}) {
  const tables = useGraphStore((s) => s.tables)
  const relations = useGraphStore((s) => s.relations)
  const validationIssues = useGraphStore((s) => s.validationIssues)

  const health = useMemo(
    () => computeHealthScore(tables, relations, validationIssues),
    [tables, relations, validationIssues],
  )
  const tone = scoreTone(health.score)
  const perfect = health.score === 100
  const canNormalize = onNormalize && health.score < 100 && tables.length > 0
  // Silent: toasts fire here for the topbar, but the shared confetti canvas
  // lives in the global layout mount — no double burst.
  const celebration = useHealthCelebration({ silent: true })

  const nextRankHint =
    health.score >= 90
      ? "Schéma parfait"
      : health.score >= 75
        ? "Maître des BDD à 90%"
        : health.score >= 50
          ? "Architecte Senior à 75%"
          : "Architecte Junior à 50%"

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border px-2 py-1 transition-colors",
        tone.ring,
      )}
      title={`${health.score}% — ${health.rank.label}\n${health.errorCount} erreur(s), ${health.warningCount} avertissement(s)\n${nextRankHint}`}
    >
      <button
        type="button"
        onClick={onOpenIssues}
        className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Santé du schéma ${health.score}%, ouvrir le rapport`}
      >
        {perfect ? (
          <Award
            key={`pill-award-${celebration.shineKey}`}
            className={cn(
              "size-3.5 text-emerald-600",
              celebration.shineKey > 0 && "badge-shine rounded-full",
            )}
          />
        ) : (
          <ShieldCheck className={cn("size-3.5 transition-colors", tone.text)} />
        )}
        <span
          key={`pill-score-${celebration.popKey}`}
          className={cn(
            "text-xs font-semibold whitespace-nowrap tabular-nums transition-colors",
            tone.text,
            celebration.popKey > 0 && "score-pop inline-block",
          )}
        >
          {health.score}%
        </span>
        <span
          className={cn(
            "hidden h-1.5 w-14 overflow-hidden rounded-full bg-slate-200/80 md:block",
          )}
        >
          <span
            className={cn(
              "block h-full rounded-full transition-all duration-500",
              tone.bar,
              perfect && "progress-shimmer",
            )}
            style={{ width: `${health.score}%` }}
          />
        </span>
        {health.errorCount + health.warningCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-xs font-medium text-amber-600 tabular-nums"
            aria-label={`${health.errorCount + health.warningCount} problèmes`}
          >
            <TriangleAlert className="size-3" />
            {health.errorCount + health.warningCount}
          </span>
        )}
      </button>

      {canNormalize && (
        <button
          type="button"
          onClick={onNormalize}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          title="Normaliser en 1-click (ajoute les PK, corrige les types FK, indexe les uniques)"
        >
          <Zap className="size-3" />
          <span className="hidden lg:inline">Normaliser</span>
        </button>
      )}
    </div>
  )
}
