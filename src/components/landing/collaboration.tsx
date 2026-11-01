"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MousePointer2 } from "lucide-react";
import { ACTIVITY, COLLAB_CARDS, PEOPLE, POINTS } from "./data";
import { Reveal, SectionHeading } from "./primitives";
import { vars } from "./css";

export function Collaboration() {
  const stage = useRef<HTMLDivElement>(null);
  const [activity, setActivity] = useState(0);

  // Curseurs animés (désactivés si prefers-reduced-motion).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        PEOPLE.forEach((p, i) => {
          const tl = gsap.timeline({ repeat: -1, delay: i * 0.6 });
          p.path.forEach(([x, y]) => {
            tl.to(`[data-cursor="${p.id}"]`, { left: `${x}%`, top: `${y}%`, duration: 1.8 + i * 0.25, ease: "power2.inOut" }).to({}, { duration: 0.35 });
          });
        });
      }, el);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  // Fil d'activité.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActivity((v) => (v + 1) % ACTIVITY.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="collaboration" aria-labelledby="collab-title" className="mdz-section">
      <div className="mdz-container mdz-collab">
        <div>
          <Reveal>
            <SectionHeading
              id="collab-title"
              eyebrow="Collaboration"
              title={<>Modélisez <em className="mdz-serif">à plusieurs.</em></>}
              description="Fini les captures d'écran de schémas qui circulent en pièces jointes. Tout le monde travaille sur le même canvas, en temps réel."
            />
          </Reveal>

          <ul className="mdz-points">
            {POINTS.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={i * 0.08}>
                  <div className="mdz-point">
                    <span className="mdz-point__n" aria-hidden="true">0{i + 1}</span>
                    <div>
                      <h3 className="mdz-h3 mdz-h3--sm">{p.title}</h3>
                      <p className="mdz-muted">{p.text}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <Reveal delay={0.1}>
          <div className="mdz-window">
            <div className="mdz-window__bar">
              <span className="mdz-window__title mdz-window__title--left">salon · blog</span>
              <div className="mdz-avatars" aria-hidden="true">
                {PEOPLE.map((p, i) => (
                  <span key={p.id} className="mdz-avatar mdz-avatar--sm" style={{ background: p.color, zIndex: 3 - i }}>{p.name[0]}</span>
                ))}
              </div>
            </div>

            <div ref={stage} className="mdz-collab__stage mdz-dots" role="img" aria-label="Démo : trois curseurs nommés se déplacent sur un schéma partagé.">
              {COLLAB_CARDS.map((c) => (
                <div key={c.name} className="mdz-mini mdz-mini--abs" style={{ left: c.left, top: c.top }}>
                  <div className="mdz-mini__head" style={{ background: c.color }}>{c.name}</div>
                  {c.rows.map((r) => <div key={r} className="mdz-mini__row">{r}</div>)}
                </div>
              ))}

              {PEOPLE.map((p) => (
                <div key={p.id} data-cursor={p.id} className="mdz-cursor" style={{ left: `${p.start[0]}%`, top: `${p.start[1]}%`, ...vars({ "--c": p.color }) }} aria-hidden="true">
                  <MousePointer2 size={20} style={{ color: p.color, fill: p.color }} />
                  <span className="mdz-cursor__label" style={{ background: p.color }}>{p.name}</span>
                </div>
              ))}
            </div>

            <div className="mdz-ticker" aria-live="off">
              <i aria-hidden="true" />
              <span key={activity} className="mdz-ticker__text">{ACTIVITY[activity]}</span>
            </div>
          </div>
          <p className="mdz-note">Démo illustrative : les prénoms sont fictifs.</p>
        </Reveal>
      </div>
    </section>
  );
}
