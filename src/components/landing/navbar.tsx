"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { NAV_LINKS } from "./data";
import { Logo, Magnetic } from "./primitives";
import { vars } from "./css";

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".mdz");
    if (!root) return;
    let saved: string | null = null;
    try { saved = localStorage.getItem("mdz-theme"); } catch { /* stockage indisponible */ }
    const initial =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.dataset.theme = initial;
    setTheme(initial);
  }, []);

  const toggle = () => {
    const root = document.querySelector<HTMLElement>(".mdz");
    if (!root || !theme) return;
    const next = theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem("mdz-theme", next); } catch { /* ignore */ }
  };

  return (
    <button type="button" className="mdz-iconbtn" onClick={toggle} aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}>
      {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(window.scrollY > 8);
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`mdz-nav ${scrolled || open ? "is-solid" : ""}`}>
      <div className="mdz-container mdz-nav__bar">
        <Link href="/" aria-label="Modelizia — accueil" className="mdz-nav__brand">
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="mdz-nav__links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="mdz-nav__link">{l.label}</a>
          ))}
        </nav>

        <div className="mdz-nav__actions">
          <ThemeToggle />
          <span className="mdz-hide-sm">
            <Magnetic>
              <Link href="/studio" className="mdz-btn mdz-btn--primary mdz-btn--sm">
                Ouvrir le Studio <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </Magnetic>
          </span>
          <button
            type="button"
            className="mdz-iconbtn mdz-nav__burger"
            aria-expanded={open}
            aria-controls="mdz-menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="mdz-nav__progress" style={vars({ "--p": progress })} aria-hidden="true" />

      <nav id="mdz-menu" aria-label="Menu mobile" className={`mdz-menu ${open ? "is-open" : ""}`} hidden={!open}>
        <div className="mdz-container">
          {NAV_LINKS.map((l, i) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="mdz-menu__link" style={vars({ "--i": i })}>
              {l.label}
            </a>
          ))}
          <Link href="/studio" className="mdz-btn mdz-btn--primary mdz-menu__cta" onClick={() => setOpen(false)}>
            Ouvrir le Studio <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
