import Link from "next/link";
import { ArrowRight, Check, Compass, Sparkles } from "lucide-react";

const STUDIO_HREF = "/studio";

const REASSURANCE = ["100% Gratuit", "Sans Inscription", "En Navigateur"] as const;

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="glass-panel inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          <Sparkles className="size-3.5 animate-pulse text-indigo-500" />
          L'art de concevoir vos bases de données
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
            Ouvrir le Studio
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#demo"
            className="glass-panel inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-base font-semibold shadow-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
          >
            <Compass className="size-5" />
            Explorer
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {REASSURANCE.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-emerald-500" /> {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
