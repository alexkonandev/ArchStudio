import type { CSSProperties } from "react";

/**
 * Transforme un objet de variables CSS personnalisées (`--*`) en propriétés
 * `style` utilisables en JSX. Pur et sans dépendance côté client : il peut
 * être importé depuis des composants serveur.
 */
export function vars(v: Record<`--${string}`, string | number>): CSSProperties {
  return v as CSSProperties;
}
