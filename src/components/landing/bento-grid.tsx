import { Check, Code2, MousePointer2, Users, Wand2 } from "lucide-react";
import { SectionHeading } from "./section-heading";

const FEATURES = [
  {
    icon: MousePointer2,
    accent: "from-indigo-500 to-sky-500",
    title: "Ergonomie Figma-Grade",
    tag: "Canvas",
    description:
      "Un canvas infini, fluide et magnétique : sélection (V), main (H ou Espace), guides d'alignement intelligents et Focus Graphe plein écran (Shift+Z) pour modéliser sans aucune distraction.",
    bullets: [
      "Modes Sélection / Main à la Figma",
      "Alignement & aimantation en direct",
      "Focus Graphe : 100 % du viewport (Shift+Z)",
    ],
  },
  {
    icon: Wand2,
    accent: "from-emerald-500 to-teal-500",
    title: "Normalisation 1-Clic",
    tag: "Qualité",
    description:
      "Ajoutez les clés primaires manquantes, corrigez les types de clés étrangères et créez les index uniques en un seul clic — le tout annulable (Ctrl+Z), avec un Health Score gamifié.",
    bullets: [
      "Auto-correction du schéma",
      "Historique undo/redo global",
      "Score de santé gamifié",
    ],
  },
  {
    icon: Users,
    accent: "from-fuchsia-500 to-purple-500",
    title: "Collaboration temps réel",
    tag: "Équipe",
    description:
      "Curseurs de vos co-équipiers en direct, soft-locking des tables en cours d'édition et commentaires contextuels directement sur les nœuds du graphe.",
    bullets: [
      "Présence & curseurs live",
      "Soft lock anti-conflits",
      "Commentaires & fil d'activité",
    ],
  },
  {
    icon: Code2,
    accent: "from-amber-500 to-orange-500",
    title: "Moteur multi-dialecte",
    tag: "Codegen",
    description:
      "Générez et inspectez votre schéma dans un IDE intégré : Prisma, PostgreSQL, MySQL, SQLite, types TypeScript et schémas Zod — synchronisés avec le canvas.",
    bullets: [
      "Prisma · PostgreSQL · MySQL · SQLite",
      "Types TypeScript & Zod",
      "Studio de Code plein écran",
    ],
  },
] as const;

export function BentoGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Fonctionnalités"
        title="Tout ce qu'il faut pour architecturer vos données"
        subtitle="De l'esquisse au code de production, sans quitter votre navigateur."
      />

      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="glass-panel group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-transform hover:-translate-y-1"
          >
            <div
              aria-hidden
              className={`absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br ${f.accent} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
            />
            <div className="flex items-center gap-3">
              <span
                className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-sm`}
              >
                <f.icon className="size-5" />
              </span>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {f.tag}
                </span>
                <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground text-pretty">
              {f.description}
            </p>

            <ul className="mt-4 space-y-2">
              {f.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-emerald-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
