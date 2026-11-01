import { Reveal, SectionHeading } from "./primitives";
import { vars } from "./css";

function MiniTable({ name, color, rows, className = "" }: { name: string; color: string; rows: string[]; className?: string }) {
  return (
    <div className={`mdz-mini ${className}`}>
      <div className="mdz-mini__head" style={{ background: color }}>{name}</div>
      {rows.map((r, i) => (
        <div key={r} className="mdz-mini__row" style={vars({ "--i": i })}>{r}</div>
      ))}
    </div>
  );
}

function StepPlace() {
  return (
    <div className="mdz-step__visual mdz-dots" aria-hidden="true">
      <MiniTable name="users" color="#26241d" rows={["id", "email", "name"]} />
      <span className="mdz-addcol">+ colonne</span>
    </div>
  );
}

function StepLink() {
  return (
    <div className="mdz-step__visual mdz-dots" aria-hidden="true">
      <MiniTable name="users" color="#26241d" rows={["id", "email"]} />
      <svg width="64" height="44" viewBox="0 0 64 44" fill="none" className="mdz-linkline">
        <circle cx="4" cy="12" r="4" className="mdz-dot-pk" />
        <path d="M4 12 C32 12 32 32 60 32" pathLength={1} className="mdz-linkline__path" />
        <circle cx="60" cy="32" r="4" className="mdz-dot-fk" />
      </svg>
      <MiniTable name="posts" color="#ff4a1c" rows={["id", "author_id"]} />
    </div>
  );
}

function StepGenerate() {
  return (
    <div className="mdz-step__visual mdz-step__visual--code" aria-hidden="true">
      <span className="mdz-type" style={vars({ "--i": 0 })}><span className="mdz-c-kw">CREATE TABLE</span> posts (</span>
      <span className="mdz-type" style={vars({ "--i": 1 })}>&nbsp;&nbsp;author_id <span className="mdz-c-ty">UUID</span> <span className="mdz-c-kw">REFERENCES</span> users</span>
      <span className="mdz-type" style={vars({ "--i": 2 })}>);</span>
      <span className="mdz-caret" />
    </div>
  );
}

const STEPS = [
  { n: "01", title: "Posez vos tables", text: "Ajoutez des tables et des colonnes directement sur le canvas. Déplacez, alignez, colorez, sans quitter la vue d'ensemble.", visual: <StepPlace /> },
  { n: "02", title: "Reliez-les", text: "Tracez les clés étrangères entre colonnes. Vous avez déjà du SQL ? Le parser le transforme en schéma visuel.", visual: <StepLink /> },
  { n: "03", title: "Générez le code", text: "SQL, Prisma, TypeScript et Zod sont produits à partir du même schéma, toujours synchronisés avec ce que vous voyez.", visual: <StepGenerate /> },
];

export function HowItWorks() {
  return (
    <section id="comment" aria-labelledby="comment-title" className="mdz-section mdz-section--soft">
      <div className="mdz-container">
        <Reveal>
          <SectionHeading id="comment-title" eyebrow="Le principe" title={<>Du schéma au code <em className="mdz-serif">en trois gestes.</em></>} />
        </Reveal>

        <ol className="mdz-steps">
          {STEPS.map((s, i) => (
            <li key={s.n} className="mdz-step">
              <Reveal delay={i * 0.1} className="mdz-fill">
                {s.visual}
                <p className="mdz-step__n">{s.n}</p>
                <h3 className="mdz-h3">{s.title}</h3>
                <p className="mdz-muted">{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
