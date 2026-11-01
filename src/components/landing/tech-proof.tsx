import { FACTS, STACK_GROUPS } from "./data";
import { CountUp, Reveal, SectionHeading, SpotlightCard } from "./primitives";

export function TechProof() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="mdz-section mdz-section--soft">
      <div className="mdz-container">
        <Reveal>
          <SectionHeading
            id="stack-title"
            eyebrow="Sous le capot"
            title={<>Construit sur <em className="mdz-serif">du solide.</em></>}
            description="Un vrai moteur de schéma, pas un dessin : le canvas, le code et la collaboration partagent le même modèle de données."
          />
        </Reveal>

        <dl className="mdz-facts">
          {FACTS.map((f, i) => (
            <Reveal key={f.label} delay={i * 0.08} className="mdz-fill">
              <SpotlightCard className="mdz-fact">
                <dt><CountUp to={f.value} /></dt>
                <dd className="mdz-muted">{f.label}</dd>
              </SpotlightCard>
            </Reveal>
          ))}
        </dl>

        <div className="mdz-groups">
          {STACK_GROUPS.map((g, i) => (
            <Reveal key={g.label} delay={i * 0.06}>
              <h3 className="mdz-group__label">{g.label}</h3>
              <ul className="mdz-group__items">
                {g.items.map((it) => <li key={it} className="mdz-chip">{it}</li>)}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
