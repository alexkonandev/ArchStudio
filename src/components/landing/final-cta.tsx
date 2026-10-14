import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-indigo-600 via-sky-600 to-fuchsia-600 p-10 text-center shadow-xl sm:p-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_-20%,rgba(255,255,255,0.25),transparent)]" />
        <h2 className="relative text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
          Prêt à architecturer votre prochaine base ?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/80 text-pretty">
          Ouvrez le Studio, dessinez vos tables et exportez du Prisma ou du SQL en quelques secondes. Gratuit, sans compte.
        </p>
        <Link href="/studio" className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          Ouvrir le Studio (Gratuit)
          <ArrowRight className="size-5" />
        </Link>
      </div>
    </section>
  );
}
