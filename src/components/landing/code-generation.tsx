"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy } from "lucide-react";
import { FORMATS } from "./data";
import { HighlightedLine } from "./highlight";
import { Reveal, SectionHeading } from "./primitives";
import { vars } from "./css";

function MiniSchema() {
  return (
    <div className="mdz-minischema mdz-dots" aria-hidden="true">
      <div className="mdz-minischema__row">
        <div className="mdz-mini mdz-mini--lg">
          <div className="mdz-mini__head" style={{ background: "#26241d" }}>users</div>
          {["id", "email", "name", "created_at"].map((c) => <div key={c} className="mdz-mini__row">{c}</div>)}
        </div>
        <svg width="56" height="64" viewBox="0 0 56 64" fill="none" className="mdz-linkline">
          <circle cx="4" cy="12" r="4" className="mdz-dot-pk" />
          <path d="M4 12 C30 12 26 44 52 44" pathLength={1} className="mdz-linkline__path" />
          <circle cx="52" cy="44" r="4" className="mdz-dot-fk" />
        </svg>
        <div className="mdz-mini mdz-mini--lg">
          <div className="mdz-mini__head" style={{ background: "#ff4a1c" }}>posts</div>
          {["id", "author_id", "title", "published"].map((c) => <div key={c} className="mdz-mini__row">{c}</div>)}
        </div>
      </div>
      <p className="mdz-minischema__sync"><i /> 1 schéma → 4 sorties, toujours synchronisées</p>
    </div>
  );
}

export function CodeGeneration() {
  const uid = useId();
  const [active, setActive] = useState(FORMATS[0].id);
  const [copied, setCopied] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const current = FORMATS.find((f) => f.id === active) ?? FORMATS[0];
  const lines = current.code.split("\n");

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = FORMATS.findIndex((f) => f.id === active);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % FORMATS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + FORMATS.length) % FORMATS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = FORMATS.length - 1;
    else return;
    e.preventDefault();
    setActive(FORMATS[next].id);
    tabs.current[next]?.focus();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  return (
    <section id="code" aria-labelledby="code-title" className="mdz-section mdz-section--soft">
      <div className="mdz-container">
        <Reveal>
          <SectionHeading
            id="code-title"
            eyebrow="Génération de code"
            title={<>Un schéma, <em className="mdz-serif">quatre sorties.</em></>}
            description="Ce que vous dessinez devient du code propre, prêt à coller dans votre projet. Changez de format d'un clic."
          />
        </Reveal>

        <Reveal className="mdz-codegrid" delay={0.1}>
          <MiniSchema />

          <div className="mdz-codepanel">
            <div className="mdz-codepanel__bar">
              <div role="tablist" aria-label="Format de sortie" className="mdz-tabs" onKeyDown={onKeyDown}>
                {FORMATS.map((f, i) => {
                  const selected = f.id === active;
                  return (
                    <button
                      key={f.id}
                      ref={(el) => { tabs.current[i] = el; }}
                      role="tab"
                      id={`${uid}-tab-${f.id}`}
                      aria-selected={selected}
                      aria-controls={`${uid}-panel`}
                      tabIndex={selected ? 0 : -1}
                      type="button"
                      onClick={() => setActive(f.id)}
                      className={`mdz-tab ${selected ? "is-active" : ""}`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <div className="mdz-codepanel__tools">
                <span className="mdz-codepanel__file">{current.file}</span>
                <button type="button" className="mdz-copy" onClick={copy} aria-label="Copier le code">
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  <span>{copied ? "Copié" : "Copier"}</span>
                </button>
              </div>
            </div>

            <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${current.id}`} tabIndex={0} className="mdz-codepanel__body">
              <pre key={current.id}>
                {lines.map((line, i) => (
                  <div key={i} className="mdz-codeline" style={vars({ "--i": i })}>
                    <span className="mdz-codeline__n" aria-hidden="true">{i + 1}</span>
                    <code>
                      <HighlightedLine text={line} />
                      {line === "" ? " " : null}
                    </code>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
