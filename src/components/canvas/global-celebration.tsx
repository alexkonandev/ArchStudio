"use client";

import { useHealthCelebration } from "@/hooks/use-health-celebration";
import { CelebrationConfetti } from "@/components/canvas/celebration-confetti";

/**
 * Global celebration layer: a single confetti renderer for the whole app.
 *
 * Mounted once in the root layout so the 100%-score burst fires on `/` and
 * `/studio` alike. Local widgets (HealthScoreBar on the canvas) subscribe in
 * `silent` mode and only render their own pop/shine/delta visuals.
 */
export function GlobalCelebration() {
  const celebration = useHealthCelebration();
  return (
    <CelebrationConfetti
      active={celebration.confetti}
      onDone={celebration.dismissConfetti}
    />
  );
}
