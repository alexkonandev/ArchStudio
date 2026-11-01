"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Minus, MousePointer2, Plus } from "lucide-react";
import { usePointerVars } from "./hooks";
import { Magnetic, Tilt } from "./primitives";
import { vars } from "./css";
import { SchemaCanvas } from "./schema-canvas";

/** Découpe un titre en mots animés (rendu identique serveur / client). */
function Words({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={`${w}-${i}`} className="mdz-word">
          <span style={vars({ "--i": start + i })}>{w}</span>{" "}
        </span>
      ))}
    </>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  usePointerVars(ref);
  const d = (s: number) => vars({ "--d": `${s}s` });

  return (
    <section ref={ref} aria-labelledby="hero-title" className="mdz-hero">
      <div className="mdz-hero__grid" aria-hidden="true" />
      <div className="mdz-hero__glow" aria-hidden="true" />

      <div className="mdz-container mdz-hero__inner">
        <a href="#collaboration" className="mdz-badge mdz-rise" style={d(0)}>
          <span className="mdz-badge__dot" aria-hidden="true" />
          Nouveau · Collaboration en temps réel
          <ArrowRight size={14} aria-hidden="true" />
        </a>

        <h1 id="hero-title" className="mdz-h1">
          <Words text="Dessinez votre base de données." />
          <br />
          <em className="mdz-serif">
            <Words text="Le code suit." start={5} />
          </em>
        </h1>

        <p className="mdz-lead mdz-lead--xl mdz-rise" style={d(0.45)}>
          Modelizia est un canvas infini pour poser vos tables et vos relations, puis générer le SQL, le schéma Prisma,
          les types TypeScript et les validateurs Zod. À plusieurs, en temps réel.
        </p>

        <div className="mdz-cta-row mdz-rise" style={d(0.55)}>
          <Magnetic>
            <Link href="/studio" className="mdz-btn mdz-btn--primary">
              Ouvrir le Studio <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Magnetic>
          <a href="#comment" className="mdz-btn mdz-btn--ghost">Voir comment ça marche</a>
        </div>

        <ul className="mdz-meta mdz-rise" style={d(0.65)}>
          <li>Canvas infini</li>
          <li>Studio de code</li>
          <li>Collaboration en direct</li>
        </ul>

        <div className="mdz-stage mdz-rise" style={d(0.75)}>
          <Tilt className="mdz-stage__tilt">
            <div className="mdz-window">
              <div className="mdz-window__bar">
                <div className="mdz-window__lights" aria-hidden="true">
                  <span /><span /><span />
                </div>
                <span className="mdz-window__title">blog.modelizia</span>
                <div className="mdz-window__zoom" aria-hidden="true">
                  <Minus size={13} /> <span>100&nbsp;%</span> <Plus size={13} />
                </div>
              </div>
              <div className="mdz-window__canvas mdz-dots">
                <SchemaCanvas className="mdz-svg" />
                <div className="mdz-pill" aria-hidden="true">
                  <MousePointer2 size={12} /> 6 tables · 5 relations
                </div>
              </div>
            </div>

            <div className="mdz-float" aria-hidden="true">
              <div className="mdz-float__bar">
                <span>schema.sql</span>
                <span className="mdz-float__live"><i /> synchronisé</span>
              </div>
              <pre>
                <span className="mdz-c-kw">CREATE TABLE</span> posts (
                {"\n"}  author_id <span className="mdz-c-ty">UUID</span> <span className="mdz-c-kw">REFERENCES</span> users
                {"\n"});<span className="mdz-caret" />
              </pre>
            </div>
          </Tilt>
        </div>
      </div>
    </section>
  );
}
