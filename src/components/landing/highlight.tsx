import { Fragment, type ReactNode } from "react";

/**
 * Coloration syntaxique légère (SQL / Prisma / TS / Zod).
 * Une seule regex à groupes : 1 commentaire, 2 chaîne, 3 décorateur,
 * 4 mot-clé, 5 type, 6 appel zod, 7 nombre / booléen.
 */
const RE =
  /(\/\/.*$|--.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@\w+(?:\.\w+)?)|\b(CREATE|TABLE|PRIMARY|KEY|NOT|NULL|UNIQUE|DEFAULT|REFERENCES|model|export|interface|import|from|const)\b|\b(UUID|TEXT|TIMESTAMPTZ|BOOLEAN|String|DateTime|Boolean|Date|string|boolean)\b|(\bz\.\w+)|\b(\d+|true|false)\b/g;

const CLASSES = ["", "mdz-c-com", "mdz-c-str", "mdz-c-fn", "mdz-c-kw", "mdz-c-ty", "mdz-c-fn", "mdz-c-num"];

export function HighlightedLine({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(RE)) {
    const idx = m.index ?? 0;
    if (idx > last) nodes.push(<Fragment key={`t${last}`}>{text.slice(last, idx)}</Fragment>);
    const group = m.findIndex((g, i) => i > 0 && g !== undefined);
    nodes.push(
      <span key={`m${idx}`} className={CLASSES[group]}>
        {m[0]}
      </span>,
    );
    last = idx + m[0].length;
  }
  if (last < text.length) nodes.push(<Fragment key={`t${last}`}>{text.slice(last)}</Fragment>);
  return <>{nodes}</>;
}
