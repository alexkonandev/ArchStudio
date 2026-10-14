import Link from "next/link";
import { Activity, Boxes, Database } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">Modelizia</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/studio" className="transition-colors hover:text-foreground">Studio</Link>
          <Link href="/studio/code" className="transition-colors hover:text-foreground">Studio de Code</Link>
          <a href="#features" className="transition-colors hover:text-foreground">Fonctionnalités</a>
          <a href="#gamification" className="transition-colors hover:text-foreground">Gamification</a>
        </nav>
        <div className="flex items-center gap-3 text-muted-foreground">
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="transition-colors hover:text-foreground"><Boxes className="size-5" /></a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="transition-colors hover:text-foreground"><Activity className="size-5" /></a>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        Fait avec <span className="text-rose-500">♥</span> pour les architectes de données. © {new Date().getFullYear()} Modelizia.
      </div>
    </footer>
  );
}
