"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePointerVars } from "./hooks";
import { Magnetic, Reveal } from "./primitives";

export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  usePointerVars(ref);

  return (
    <section aria-labelledby="cta-title" className="mdz-section">
      <div className="mdz-container">
        <Reveal>
          <div ref={ref} className="mdz-cta">
            <div className="mdz-cta__grid" aria-hidden="true" />
            <div className="mdz-cta__glow" aria-hidden="true" />
            <div className="mdz-cta__inner">
              <h2 id="cta-title" className="mdz-h2 mdz-h2--xl">
                Votre prochain schéma <em className="mdz-serif">commence ici.</em>
              </h2>
              <p className="mdz-lead">Ouvrez le Studio, posez une première table et regardez le code se générer.</p>
              <div className="mdz-cta-row">
                <Magnetic>
                  <Link href="/studio" className="mdz-btn mdz-btn--accent">
                    Ouvrir le Studio <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </Magnetic>
                <Link href="/studio/code" className="mdz-btn mdz-btn--outline-light">Studio de code</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
