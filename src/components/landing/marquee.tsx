import { MARQUEE_ITEMS } from "./data";

/** Bandeau défilant (CSS pur) : contenu dupliqué pour une boucle sans saut. */
export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="mdz-marquee__row" aria-hidden={hidden || undefined}>
      {MARQUEE_ITEMS.map((t) => (
        <li key={t}>
          <span className="mdz-marquee__star" aria-hidden="true">✦</span> {t}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="mdz-marquee" aria-label="Technologies prises en charge">
      <div className="mdz-marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
