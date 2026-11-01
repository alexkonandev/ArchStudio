import type { ReactNode } from "react";
import { Braces, Code, Database, ImageDown, Infinity as InfinityIcon, LayoutTemplate, Redo2, Undo2, Users } from "lucide-react";
import { Reveal, SectionHeading, SpotlightCard } from "./primitives";
import { vars } from "./css";

const ICON = 20;

function VisualInfinite() {
  const tables: [string, string, string][] = [["6%", "14%", "#26241d"], ["34%", "46%", "#ff4a1c"], ["58%", "10%", "#3b5bff"], ["72%", "58%", "#12a36b"], ["14%", "62%", "#7c4dff"]];
  return (
    <div className="mdz-fv mdz-fv--canvas mdz-dots" aria-hidden="true">
      <div className="mdz-pan">
        {tables.map(([l, t, c]) => (
          <span key={`${l}${t}`} className="mdz-tinytbl" style={{ left: l, top: t }}>
            <span style={{ background: c }} />
          </span>
        ))}
      </div>
      <span className="mdz-viewport" />
      <span className="mdz-fv__tag">vue</span>
    </div>
  );
}

function VisualSql() {
  return (
    <div className="mdz-fv mdz-fv--row" aria-hidden="true">
      <div className="mdz-codebox">
        <span className="mdz-c-kw">CREATE TABLE</span> users (<br />&nbsp;&nbsp;id <span className="mdz-c-ty">UUID</span> …
      </div>
      <span className="mdz-arrow">→</span>
      <div className="mdz-mini mdz-mini--xs">
        <div className="mdz-mini__head mdz-mini__head--plain">users</div>
        <div className="mdz-mini__row">id</div>
      </div>
    </div>
  );
}

function VisualFormats() {
  return (
    <div className="mdz-fv mdz-fv--chips" aria-hidden="true">
      {["SQL", "Prisma", "TypeScript", "Zod"].map((f, i) => (
        <span key={f} className="mdz-chip" style={vars({ "--i": i })}>{f}</span>
      ))}
    </div>
  );
}

function VisualEditor() {
  return (
    <div className="mdz-fv mdz-codebox mdz-codebox--block" aria-hidden="true">
      <div><span className="mdz-c-com">1  </span><span className="mdz-c-kw">model</span> Post {"{"}</div>
      <div><span className="mdz-c-com">2  </span>  id <span className="mdz-c-ty">String</span> <span className="mdz-c-fn">@id</span><span className="mdz-caret" /></div>
      <div><span className="mdz-c-com">3  </span>{"}"}</div>
    </div>
  );
}

function VisualCollab() {
  return (
    <div className="mdz-fv mdz-fv--row" aria-hidden="true">
      <div className="mdz-avatars">
        {[["A", "#ff4a1c"], ["K", "#3b5bff"], ["L", "#12a36b"]].map(([i, c], idx) => (
          <span key={i} className="mdz-avatar" style={{ background: c, zIndex: 3 - idx }}>{i}</span>
        ))}
      </div>
      <span className="mdz-live"><i /> en direct</span>
    </div>
  );
}

function VisualExport() {
  return (
    <div className="mdz-fv mdz-fv--row" aria-hidden="true">
      <span className="mdz-export">
        <i /><i /><i />
      </span>
      <span className="mdz-chip">.png</span>
      <span className="mdz-chip">.svg</span>
    </div>
  );
}

function VisualTemplates() {
  return (
    <div className="mdz-fv mdz-fan" aria-hidden="true">
      {["#26241d", "#ff4a1c", "#3b5bff"].map((c, i) => (
        <span key={c} style={vars({ "--i": i })}>
          <b style={{ background: c }} />
        </span>
      ))}
    </div>
  );
}

function VisualHistory() {
  return (
    <div className="mdz-fv mdz-fv--row" aria-hidden="true">
      {[Undo2, Redo2].map((Icon, i) => (
        <span key={i} className="mdz-squarebtn"><Icon size={16} /></span>
      ))}
      <span className="mdz-fv__tag mdz-fv__tag--inline">historique</span>
    </div>
  );
}

type Feature = { title: string; text: string; icon: ReactNode; span: 2 | 4; visual?: ReactNode };

const FEATURES: Feature[] = [
  { title: "Un canvas infini", text: "Pas de page, pas de limite. Déplacez-vous dans des schémas de toutes tailles et gardez la vue d'ensemble.", icon: <InfinityIcon size={ICON} />, span: 4, visual: <VisualInfinite /> },
  { title: "Import SQL", text: "Collez votre SQL existant : le parser reconstruit les tables et les relations.", icon: <Database size={ICON} />, span: 2, visual: <VisualSql /> },
  { title: "Quatre formats générés", text: "Un seul schéma : SQL, Prisma, TypeScript et Zod.", icon: <Braces size={ICON} />, span: 2, visual: <VisualFormats /> },
  { title: "Studio de code", text: "Un éditeur Monaco intégré pour travailler directement sur le code de votre schéma.", icon: <Code size={ICON} />, span: 2, visual: <VisualEditor /> },
  { title: "Temps réel", text: "Plusieurs personnes sur le même schéma, avec présence et curseurs en direct.", icon: <Users size={ICON} />, span: 2, visual: <VisualCollab /> },
  { title: "Export en image", text: "Sortez votre schéma en image pour vos docs, vos PR et vos présentations.", icon: <ImageDown size={ICON} />, span: 2, visual: <VisualExport /> },
  { title: "Modèles prêts à l'emploi", text: "Partez d'un schéma existant plutôt que d'une page blanche.", icon: <LayoutTemplate size={ICON} />, span: 2, visual: <VisualTemplates /> },
  { title: "Historique et alignement", text: "Annulez, restaurez, alignez, colorez vos tables pour un schéma lisible.", icon: <Undo2 size={ICON} />, span: 2, visual: <VisualHistory /> },
];

export function FeaturesBento() {
  return (
    <section id="fonctionnalites" aria-labelledby="features-title" className="mdz-section">
      <div className="mdz-container">
        <Reveal>
          <SectionHeading
            id="features-title"
            eyebrow="Fonctionnalités"
            title={<>Tout ce qu&apos;il faut pour <em className="mdz-serif">penser vos données.</em></>}
            description="Un outil de modélisation, pas un énième formulaire : vous voyez votre schéma, vous le manipulez, il produit le code."
          />
        </Reveal>

        <div className="mdz-bento">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08} className={`mdz-bento__cell mdz-span-${f.span}`}>
              <SpotlightCard className="mdz-feature">
                <span className="mdz-feature__icon" aria-hidden="true">{f.icon}</span>
                <h3 className="mdz-h3">{f.title}</h3>
                <p className="mdz-muted">{f.text}</p>
                {f.visual}
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
