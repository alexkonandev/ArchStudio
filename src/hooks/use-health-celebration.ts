"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeHealthScore } from "@/lib/engine/health-score";
import { useGraphStore } from "@/store/graph-store";
import { pushToast } from "@/components/ui/toast";

export interface CelebrationState {
  /** Show the confetti burst overlay. */
  confetti: boolean;
  /** One-shot pop on the health badge (re-triggered via key change). */
  popKey: number;
  /** One-shot shine sweep on the rank badge (re-triggered via key change). */
  shineKey: number;
  /** Floating score delta (e.g. "+8"), cleared after its animation. */
  delta: number | null;
  dismissConfetti: () => void;
  clearDelta: () => void;
}

interface PreviousHealth {
  score: number;
  rankId: string;
}

/**
 * Gamified celebration watcher.
 *
 * Observes the live health score and fires delight exactly once per
 * transition:
 * - score hits **100**: confetti burst + badge pop/shine + gratifying toast;
 * - rank band crossed **upwards** (below 100): pop/shine + level-up toast;
 * - score improves without a rank change: floating "+N" delta only.
 *
 * Degradations never celebrate. Toasts always fire (they are the accessible
 * channel); the visual burst is skipped when the user prefers reduced motion,
 * and toast spam across rapid edits is avoided by only reacting to upward
 * band crossings and improvements, not to every recompute.
 *
 * Set `silent: true` when the confetti + visuals are rendered elsewhere
 * (e.g. a single global mount in the root layout) — this instance then only
 * fires the accessible toasts and never claims the shared burst.
 */
export function useHealthCelebration(options?: {
  silent?: boolean;
}): CelebrationState {
  const silent = options?.silent ?? false;
  const tables = useGraphStore((s) => s.tables);
  const relations = useGraphStore((s) => s.relations);
  const validationIssues = useGraphStore((s) => s.validationIssues);

  const health = useMemo(
    () => computeHealthScore(tables, relations, validationIssues),
    [tables, relations, validationIssues],
  );

  const [confetti, setConfetti] = useState(false);
  const [popKey, setPopKey] = useState(0);
  const [shineKey, setShineKey] = useState(0);
  const [delta, setDelta] = useState<number | null>(null);
  const prevRef = useRef<PreviousHealth | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    // First observation seeds the baseline — no celebration on load.
    if (!prev) {
      prevRef.current = { score: health.score, rankId: health.rank.id };
      return;
    }
    const rankChangedUp = health.rank.id !== prev.rankId && health.score > prev.score;
    const hitPerfect = health.score === 100 && prev.score !== 100;
    const improved = health.score > prev.score;

    prevRef.current = { score: health.score, rankId: health.rank.id };

    if (hitPerfect) {
      setPopKey((k) => k + 1);
      setShineKey((k) => k + 1);
      setDelta(health.score - prev.score > 0 ? health.score - prev.score : null);
      if (!silent) setConfetti(true);
      pushToast("Schéma parfait — 100 % !", {
        type: "success",
        description: `Rang « ${health.rank.label} » · 0 erreur. Exportez-le !`,
      });
      return;
    }
    if (rankChangedUp) {
      setPopKey((k) => k + 1);
      setShineKey((k) => k + 1);
      pushToast(`Rang « ${health.rank.label} » débloqué !`, {
        type: "success",
        description: `Score ${health.score} % — continuez sur cette lancée.`,
      });
      return;
    }
    if (improved) {
      setDelta(health.score - prev.score);
    }
  }, [health.score, health.rank, silent]);

  return {
    confetti,
    popKey,
    shineKey,
    delta,
    dismissConfetti: () => setConfetti(false),
    clearDelta: () => setDelta(null),
  };
}
