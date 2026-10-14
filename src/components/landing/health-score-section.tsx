import Link from "next/link";
import { ArrowRight, Gauge, ShieldCheck, Star, Trophy, Zap } from "lucide-react";
import { HEALTH_RANKS } from "@/lib/engine/health-score";
import { SectionHeading } from "./section-heading";

const SCORE = 96;

function HealthGauge() {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <Gauge className="size-5" />
          </span>
          <div>
            <div className="text-sm font-semibold">Score de santé</div>
            <div className="text-xs text-muted-foreground">Maître des BDD</div>
          </div>
        </div>
        <div className="text-3xl font-bold tabular-nums text-emerald-600">{SCORE}%</div>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${SCORE}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5 text-emerald-500" /> 0 erreur</span>
        <span className="inline-flex items-center gap-1"><Zap className="size-3.5 text-amber-500" /> Bonus normalisation +8</span>
      </div>
    </div>
  );
}

export function HealthScoreSection() {
  return (
    <section id="gamification" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="glass-panel overflow-hidden rounded-3xl border p-8 shadow-sm sm:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Gamification"
              title="Un score de santé pour votre schéma"
              subtitle="Chaque correction améliore votre score de 0 à 100 % et vous fait gravir les rangs d'architecte de bases de données."
              align="left"
            />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/studio" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">
                Tenter le 100 % <ArrowRight className="size-4" />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Trophy className="size-4 text-amber-500" /> Débloquez tous les rangs
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <HealthGauge />
            <div className="grid grid-cols-2 gap-3">
              {HEALTH_RANKS.filter((r) => r.minScore > 0).map((rank) => (
                <div key={rank.id} className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-background/60 p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <Star className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{rank.label}</div>
                    <div className="text-xs text-muted-foreground">≥ {rank.minScore} %</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
