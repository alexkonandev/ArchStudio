import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";

const STUDIO_HREF = "/studio";

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

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Modelizia — accueil"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Database className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Modelizia</span>
        </Link>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          <NavLink href="#features">Fonctionnalités</NavLink>
          <NavLink href="#demo">Démo</NavLink>
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
