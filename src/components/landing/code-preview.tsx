import Link from "next/link";
import { ArrowRight, Copy } from "lucide-react";
import { SectionHeading } from "./section-heading";

const DIALECTS = ["Prisma", "PostgreSQL", "MySQL", "SQLite", "TypeScript"] as const;

const PRISMA_SNIPPET = `model User {
  id    String   @id @default(uuid())
  email String   @unique
  posts Post[]
}

model Post {
  id       String    @id @default(uuid())
  title    String
  author   User      @relation(fields: [authorId], references: [id])
  authorId String
}`;

function Braces() {
  return (
    <svg className="size-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

export function CodePreview() {
  return (
    <section id="dialects" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <span id="pricing" className="block scroll-mt-20" aria-hidden />
      <SectionHeading
        eyebrow="Codegen"
        title="Un schéma, tous vos dialectes"
        subtitle="Générez du code prêt pour la production depuis le même graphe, et inspectez-le dans le Studio de Code intégré."
      />
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {DIALECTS.map((d) => (
          <span key={d} className="glass-panel inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm">
            <Braces />{d}
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
          <span className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"><Copy className="size-3" /> Copier</span>
            <Link href="/studio" className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">Ouvrir dans le Studio <ArrowRight className="size-3" /></Link>
          </span>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-600"><code>{PRISMA_SNIPPET}</code></pre>
      </div>
    </section>
  );
}
