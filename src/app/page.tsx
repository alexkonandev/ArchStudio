import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Boxes,
  Check,
  Code2,
  Database,
  Frame,
  Gauge,
  Layers,
  MessageSquare,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { HEALTH_RANKS } from "@/lib/engine/health-score";

/**
 * Public marketing landing page for ArchStudio (route `/`).
 *
 * The actual modelling product lives on `/studio`. This page is a static,
 * server-rendered marketing surface: hero + interactive canvas mockup, a bento
 * feature grid, a gamification showcase (health score + architect ranks) and a
 * footer. It leans on the shared `.glass-panel` token and Tailwind v4 theme
 * colors so it feels native to the app.
 */

/** Reusable primary CTA — always points at the Studio. */
const STUDIO_HREF = "/studio";

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
      "Focus Graphe : 100 % du viewport",
    ],
  },
  {
    icon: Wand2,
    accent: "from-emerald-500 to-teal-500",
    title: "Normalisation 1-Clic",
    tag: "Qualité",
    description:
      "Ajoutez les clés primaires manquantes, corrigez les types de clés étrangères et créez les index uniques en un seul clic — le tout annulable (Ctrl+Z).",
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

const DIALECTS = ["Prisma", "PostgreSQL", "MySQL", "SQLite", "TypeScript"] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      {/* Soft ambient gradient wash behind the whole page. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_50%_-10%,theme(colors.indigo.100/0.7),transparent),radial-gradient(40rem_30rem_at_90%_10%,theme(colors.sky.100/0.6),transparent),radial-gradient(40rem_30rem_at_10%_30%,theme(colors.fuchsia.100/0.5),transparent)]"
      />

      <LandingNav />

      <main>
        <Hero />
        <BentoFeatures />
        <Gamification />
        <Dialects />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*                                   Nav                                      */
/* -------------------------------------------------------------------------- */

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="ArchStudio — accueil"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Database className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">ArchStudio</span>
        </Link>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          <NavLink href="#features">Fonctionnalités</NavLink>
          <NavLink href="#gamification">Gamification</NavLink>
          <NavLink href="#dialects">Dialectes</NavLink>
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href={STUDIO_HREF}
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Ouvrir le Studio
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </a>
  );
}
/* -------------------------------------------------------------------------- */
/*                                   Hero                                     */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="glass-panel inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          <Sparkles className="size-3.5 text-indigo-500" />
          Le studio de modélisation BDD nouvelle génération
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Modélisez votre base de données{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-fuchsia-500 bg-clip-text text-transparent">
            comme sur Figma
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-pretty">
          Un canvas infini pour dessiner vos tables et relations, une
          normalisation automatique en un clic et un générateur de code
          multi-dialecte. Gratuit, dans votre navigateur.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={STUDIO_HREF}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
          >
            Ouvrir le Studio (Gratuit)
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#features"
            className="glass-panel inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold shadow-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
          >
            <Layers className="size-5" />
            Voir les Modèles
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-500" /> Sans inscription
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-500" /> 100 % navigateur
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-500" /> Export Prisma & SQL
          </span>
        </div>
      </div>

      <CanvasMockup />
    </section>
  );
}
/* -------------------------------------------------------------------------- */
/*                            Interactive mockup                              */
/* -------------------------------------------------------------------------- */

/** A stylised, non-interactive preview of the canvas workspace. */
function CanvasMockup() {
  return (
    <div className="relative mt-14">
      <div className="glass-panel relative overflow-hidden rounded-2xl border shadow-2xl">
        {/* Mock topbar */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="size-4" />
          </span>
          <span className="text-sm font-semibold">Mon schéma</span>
          <span className="ml-2 hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 sm:inline-flex">
            <ShieldCheck className="size-3.5" /> 96 % · Maître des BDD
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="hidden size-7 items-center justify-center rounded-md border border-border text-muted-foreground sm:flex">
              <MousePointer2 className="size-3.5" />
            </span>
            <span className="hidden size-7 items-center justify-center rounded-md border border-border text-muted-foreground sm:flex">
              <Frame className="size-3.5" />
            </span>
          </span>
        </div>

        {/* Mock canvas */}
        <div className="relative h-72 bg-[radial-gradient(theme(colors.slate.200/0.8)_1px,transparent_1px)] [background-size:16px_16px] sm:h-80">
          <MockNode
            className="left-[12%] top-8 w-40"
            title="User"
            color="indigo"
            rows={["id · uuid", "email · text", "name · text"]}
          />
          <MockNode
            className="left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2"
            title="Post"
            color="sky"
            rows={["id · uuid", "title · text", "authorId · uuid"]}
            highlight
          />
          <MockNode
            className="right-[12%] top-10 w-36"
            title="Comment"
            color="fuchsia"
            rows={["id · uuid", "body · text", "postId · uuid"]}
          />

          {/* Edge lines (decorative) */}
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
            <path
              d="M150 70 C 260 70, 300 150, 360 150"
              stroke="currentColor"
              className="text-slate-300"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
            <path
              d="M520 60 C 470 90, 470 120, 440 150"
              stroke="currentColor"
              className="text-slate-300"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
          </svg>

          {/* Floating node toolbar on the highlighted node */}
          <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 translate-y-8 items-center gap-0.5 rounded-lg border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur-md">
            <span className="flex size-6 items-center justify-center rounded text-slate-500">
              <Wand2 className="size-3.5" />
            </span>
            <span className="flex size-6 items-center justify-center rounded text-slate-500">
              <Layers className="size-3.5" />
            </span>
            <span className="flex size-6 items-center justify-center rounded text-slate-500">
              <MessageSquare className="size-3.5" />
            </span>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-md">
            <span className="flex size-7 items-center justify-center text-slate-500">+</span>
            <span className="h-px bg-slate-200" />
            <span className="flex size-7 items-center justify-center text-slate-500">−</span>
          </div>
        </div>
      </div>

      {/* Floating collaboration cursor */}
      <div className="pointer-events-none absolute right-10 top-24 hidden items-center gap-1 sm:flex">
        <MousePointer2 className="size-4 text-fuchsia-500" />
        <span className="rounded-md bg-fuchsia-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Alice
        </span>
      </div>
    </div>
  );
}

function MockNode({
  className,
  title,
  color,
  rows,
  highlight = false,
}: {
  className?: string;
  title: string;
  color: string;
  rows: readonly string[];
  highlight?: boolean;
}) {
  const ring = highlight ? "ring-2 ring-indigo-400" : "";
  const dot =
    color === "indigo"
      ? "bg-indigo-500"
      : color === "sky"
        ? "bg-sky-500"
        : "bg-fuchsia-500";
  return (
    <div
      className={`absolute rounded-xl border border-slate-200 bg-white/95 p-2 shadow-md backdrop-blur-sm ${ring} ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
      <ul className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <li
            key={r}
            className="truncate rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500"
          >
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*                              Bento features                                */
/* -------------------------------------------------------------------------- */

function BentoFeatures() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
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
/* -------------------------------------------------------------------------- */
/*                               Gamification                                 */
/* -------------------------------------------------------------------------- */

function Gamification() {
  return (
    <section id="gamification" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
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
              <Link
                href={STUDIO_HREF}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
              >
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
                <div
                  key={rank.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-background/60 p-3"
                >
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

/** A static representation of the animated health bar shown in the app. */
function HealthGauge() {
  const score = 96;
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
        <div className="text-3xl font-bold tabular-nums text-emerald-600">{score}%</div>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-emerald-500" /> 0 erreur
        </span>
        <span className="inline-flex items-center gap-1">
          <Zap className="size-3.5 text-amber-500" /> Bonus normalisation +8
        </span>
      </div>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*                                Dialects                                    */
/* -------------------------------------------------------------------------- */

function Dialects() {
  return (
    <section id="dialects" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Codegen"
        title="Un schéma, tous vos dialectes"
        subtitle="Générez du code prêt pour la production depuis le même graphe, et inspectez-le dans le Studio de Code intégré."
      />

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {DIALECTS.map((d) => (
          <span
            key={d}
            className="glass-panel inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm"
          >
            <Braces />
            {d}
          </span>
        ))}
      </div>

      <div className="glass-panel mt-8 overflow-hidden rounded-2xl border shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </span>
          <span className="ml-2 font-mono text-xs text-muted-foreground">schema.prisma</span>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-600">
          <code>{`model User {
  id    String   @id @default(uuid())
  email String   @unique
  posts Post[]
}

model Post {
  id       String    @id @default(uuid())
  title    String
  author   User      @relation(fields: [authorId], references: [id])
  authorId String
}`}</code>
        </pre>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Final CTA                                   */
/* -------------------------------------------------------------------------- */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-indigo-600 via-sky-600 to-fuchsia-600 p-10 text-center shadow-xl sm:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_-20%,rgba(255,255,255,0.25),transparent)]"
        />
        <h2 className="relative text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
          Prêt à architecturer votre prochaine base ?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/80 text-pretty">
          Ouvrez le Studio, dessinez vos tables et exportez du Prisma ou du SQL
          en quelques secondes. Gratuit, sans compte.
        </p>
        <Link
          href={STUDIO_HREF}
          className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Ouvrir le Studio (Gratuit)
          <ArrowRight className="size-5" />
        </Link>
      </div>
    </section>
  );
}
/* -------------------------------------------------------------------------- */
/*                                 Footer                                     */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">ArchStudio</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href={STUDIO_HREF} className="transition-colors hover:text-foreground">
            Studio
          </Link>
          <Link href={`${STUDIO_HREF}/code`} className="transition-colors hover:text-foreground">
            Studio de Code
          </Link>
          <a href="#features" className="transition-colors hover:text-foreground">
            Fonctionnalités
          </a>
          <a href="#gamification" className="transition-colors hover:text-foreground">
            Gamification
          </a>
        </nav>

        <div className="flex items-center gap-3 text-muted-foreground">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="transition-colors hover:text-foreground"
          >
            <Boxes className="size-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter"
            className="transition-colors hover:text-foreground"
          >
            <Activity className="size-5" />
          </a>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        Fait avec <span className="text-rose-500">♥</span> pour les architectes de
        données. © {new Date().getFullYear()} ArchStudio.
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Shared bits                                   */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "center" | "left";
}) {
  const alignment =
    align === "center" ? "mx-auto text-center items-center" : "text-left items-start";
  return (
    <div className={`flex max-w-2xl flex-col ${alignment}`}>
      <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground text-pretty">{subtitle}</p>
    </div>
  );
}

/** Inline Braces glyph for the dialect chips. */
function Braces() {
  return (
    <svg
      className="size-4 text-indigo-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}