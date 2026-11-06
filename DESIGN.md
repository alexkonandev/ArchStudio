# DESIGN.md — Modelizia

> Source de vérité visuelle. Toute UI (landing, studio, futures pages) doit s'y conformer.
> Les valeurs vivent dans `src/app/tokens.css` : on utilise les **classes sémantiques**, jamais de valeur en dur.

## 1. Ambiance

**« Papier millimétré d'ingénieur ».** Un outil technique qui assume sa précision : crème chaud, encre quasi noire, quadrillage discret, **un seul accent orange**, ombres dures décalées comme un tampon. Sérieux sans être froid, vibrant sans être criard.

Mots-clés : précis · chaleureux · tactile · éditorial · technique.
Références : Linear (densité, rigueur), Stripe docs (clarté), Gumroad / Neobrutalism (ombres dures, contours), papier millimétré.

## 2. Couleur

Un accent. Le reste est neutre chaud. Les statuts n'apparaissent que pour porter un sens.

| Rôle | Token (classe Tailwind) | Clair | Sombre |
|---|---|---|---|
| Fond de page | `bg-background` | #f4f1e8 | #15130e |
| Surface (cartes, panneaux) | `bg-card` | #fbfaf5 | #1e1b15 |
| Surface secondaire / hover neutre | `bg-secondary`, `bg-muted` | #ebe7d9 | #2b271e |
| Texte | `text-foreground` | #15130e | #f4f1e8 |
| Texte secondaire | `text-muted-foreground` | #625e50 | #a8a290 |
| Bordure | `border-border` | #d8d2c0 | crème 14 % |
| Contour fort | `border-ink-line` | #15130e | crème 70 % |
| **Accent (actions principales)** | `bg-brand` `text-brand` | #d73202 | #ff6a45 |
| Accent au survol | `bg-brand-hover` | plus sombre | plus clair |
| Accent doux (fonds, sélection) | `bg-brand-soft` / `bg-accent` | #fbe2d9 | orange 16 % |
| Succès | `text-success-ink` / `bg-success` | #007245 / #1f8a5b | #3ecf8e |
| Avertissement | `text-warning-ink` / `bg-warning` | #885a00 / #e8b730 | #f0c24a |
| Info | `text-info-ink` / `bg-info` | #2e49fd / #2f4bff | #8b99ff |
| Erreur | `text-destructive-ink` / `bg-destructive` | #c01d37 / #c4223a | #ff6b7d |
| Code (panneaux) | `bg-code text-code-foreground` | #16140f | idem |

**Règles**
1. **Texte de statut = variante `-ink`** (contraste ≥ 4.8:1). Les couleurs pleines (`bg-success`) servent aux fonds, points, barres.
2. **Jamais** de classes de palette Tailwind brutes (`slate-*`, `emerald-*`, `indigo-*`, `rose-*`, `amber-*`, `orange-*`, `white`, `black`). Toujours un token.
3. Fonds teintés : opacité sur token (`bg-success/10`, `bg-warning/15`, `bg-destructive/10`).
4. Un seul bouton `brand` plein par écran ou par zone. Tout le reste est `outline`, `ghost` ou `secondary`.
5. Le texte sur `bg-brand` est **blanc en clair**, **encre en sombre** → utiliser `text-primary-foreground`.
6. L'orange ne sert jamais de couleur de texte courant (3.9:1 sur le fond clair) : en texte, uniquement gras/grand, ou via `text-brand` sur surfaces sombres.

### Couleurs de table (studio)
Les clés stockées restent `emerald | indigo | rose | amber | slate` (compatibilité des schémas déjà sauvegardés). Elles pointent vers : `emerald→tbl-green`, `indigo→tbl-blue`, `rose→tbl-red`, `amber→tbl-yellow`, `slate→tbl-gray`. Classes : `bg-tbl-green/10`, `border-tbl-green`, `ring-tbl-green/50`.

## 3. Typographie

- **Sans** : Geist (`font-sans`) — tout le texte.
- **Mono** : Geist Mono (`font-mono`) — libellés techniques, code, noms de colonnes/types, eyebrows.
- Chargées via `next/font` (auto-hébergé, compatible CSP). Variables : `--font-sans`, `--font-mono`.

| Usage | Style |
|---|---|
| Titre hero | `text-5xl md:text-7xl font-semibold tracking-[-0.04em] leading-[1.02]` |
| Titre de section | classe `heading-display` (clamp 2→3.25rem, -0.035em, 600) |
| Titre de carte | `text-lg font-semibold tracking-tight` |
| Corps | `text-base leading-relaxed` ; secondaire `text-muted-foreground` |
| UI dense (studio) | `text-sm` ; méta `text-xs` |
| Eyebrow | classe `eyebrow` (mono, 12 px, majuscules, trait orange devant) |

Titres serrés (tracking négatif), corps aéré. Pas de gras 700+ : 500 pour l'UI, 600 pour les titres.

## 4. Forme

| Élément | Rayon |
|---|---|
| Boutons, chips, badges de statut | **pilule** `rounded-full` |
| Inputs, selects | `rounded-lg` |
| Panneaux studio, popovers, modales | `rounded-xl` |
| Grandes cartes landing | `rounded-card` (1.5rem) |
| Nœuds de table (canvas) | `rounded-xl` |

Bordures : 1 px `border-border` par défaut ; 1.5 px `border-ink-line` pour les éléments « tamponnés » (fenêtres, panneau de code).

## 5. Profondeur : l'ombre dure (signature)

Pas de flou gris. Une ombre pleine, décalée, couleur d'encre.

| Classe | Usage |
|---|---|
| `shadow-hard-sm` (3px) | nœud sélectionné, bouton `outline` au survol, popover |
| `shadow-hard` (6px) | carte au survol (`card-hard`) |
| `shadow-hard-lg` (10px) | grande fenêtre produit (`window-hard`), hero |
| `shadow-hard-brand` (8px orange) | panneau de code (`code-panel`) |
| `shadow-glow-brand` | bouton principal (halo orange doux) |

**Règle de parcimonie** : l'ombre dure marque un élément **important, survolé ou sélectionné**. Pas sur chaque carte au repos. Le studio, dense, est plat par défaut ; l'ombre dure n'apparaît que sur la sélection.
Surfaces flottantes du studio (barre haute, panneaux latéraux) : `glass-panel`.

## 6. Composants

**Bouton** (pilule, tailles `sm` h-8 · `md` h-10 · `lg` h-12)
- `default` : `bg-primary text-primary-foreground shadow-glow-brand hover:bg-brand-hover`
- `outline` : `border border-ink-line bg-transparent hover:bg-foreground hover:text-background`
- `secondary` : `bg-secondary hover:bg-border`
- `ghost` : `hover:bg-accent`
- `destructive` : `bg-destructive text-white`
- Flèche `→` qui glisse de 3 px au survol. Focus : anneau 2 px `ring`, offset 3.

**Input** : `rounded-lg border-input bg-card`, focus `ring-2 ring-ring`. Libellé au-dessus, `text-sm font-medium`.

**Carte** : `bg-card border-border rounded-card`. Variante interactive : `card-hard`.

**Badge / chip** : pilule, `text-xs`, fond `bg-secondary` (neutre) ou `bg-{statut}/15 text-{statut}-ink`.

**Nœud de table** : en-tête teinté `bg-tbl-*/10`, point de couleur, noms de colonnes en `font-mono text-xs`, types en `text-muted-foreground`. PK/FK en badges. Sélection : `border-tbl-* ring-2 ring-tbl-*/50 shadow-hard-sm`.

**Relation (edge)** : trait `stroke-info`, 1.5 px ; sélectionnée `stroke-brand` 2 px. Badge CASCADE `text-warning-ink bg-warning/15`.

**Barre de santé** : paliers `success` (≥90) · `info` (≥75) · `warning` (≥50) · `destructive` (<50), via tokens.

## 7. Mouvement

- Entrées : `anim-rise` (montée 22 px, 0.9 s, `--ease-out-soft`) avec décalage `--d`.
- Micro-interactions studio : durées 150–260 ms ; le rebond (`--ease-spring`) est réservé aux récompenses (score).
- Landing : GSAP pour le scroll et le tilt 3D ; **tout** est désactivé sous `prefers-reduced-motion`.
- Jamais d'animation infinie sauf : caret, shimmer du score parfait.

## 8. Fond et texture

Fond de page crème + `bg-grid-paper` (quadrillage 56 px, masque radial) en haut des pages marketing. `bg-dots-paper` pour les zones « canevas ». Le canvas du studio utilise `bg-dots-paper` pour rappeler la landing.

## 9. Accessibilité (non négociable)

- Texte ≥ 4.5:1, composants d'interface ≥ 3:1 (les couples du tableau ci-dessus sont calculés).
- Focus visible partout (défini dans `tokens.css`).
- `<html lang="fr">`.
- Sens jamais porté par la couleur seule (icône + libellé avec les statuts).
- `prefers-reduced-motion` respecté.

## 10. Table de correspondance (ancien → nouveau)

| Ancien | Nouveau |
|---|---|
| `bg-white/80`, `bg-white` (panneaux) | `glass-panel` ou `bg-card` |
| `border-slate-200`, `border-slate-*` | `border-border` |
| `text-slate-700/900` | `text-foreground` ; `text-slate-500` → `text-muted-foreground` |
| `bg-slate-500/10` | `bg-muted` |
| `text-emerald-700`, `text-emerald-900` | `text-success-ink` |
| `bg-emerald-500`, `bg-emerald-500/15` | `bg-success`, `bg-success/15` |
| `bg-sky-500`, `text-sky-700` | `bg-info`, `text-info-ink` |
| `bg-amber-500/10`, `text-amber-600/700` | `bg-warning/15`, `text-warning-ink` |
| `bg-rose-500`, `text-rose-700` | `bg-destructive`, `text-destructive-ink` |
| `stroke-indigo-400`, `rgb(129 140 248)` | `stroke-info` |
| `text-orange-500/200` | `text-warning-ink` |
| `shadow-lg`, `shadow-xl`, `shadow-*/30` | `shadow-hard-sm` (ou aucune) |
| `#15130e`, `#f4f1e8` | `foreground`, `background` |
| `#e5421b` | `brand` |
| `#2f4bff` / `#1f8a5b` / `#e8b730` | `info` / `success` / `warning` |
| `.landing .l-btn*` | composant `Button` (variantes) |
| `.landing .l-card`, `.l-window`, `.l-codepanel` | `card-hard`, `window-hard`, `code-panel` |
| `.l-rise`, `.l-pop`, `.l-draw`, `.l-caret` | `anim-rise`, `anim-pop`, `anim-draw`, `anim-caret` |
| `.l-mono`, `.l-eyebrow`, `.l-h2`, `.l-chip` | `font-mono`, `eyebrow`, `heading-display`, `chip` |
| `--l-*` | tokens sémantiques (voir §2) |

## 11. Règles pour toute IA qui code l'UI

1. Lis ce fichier et `tokens.css` avant de toucher au style.
2. N'invente aucune valeur : pas de `#hex`, `rgb()`, `oklch()`, `style={{ color }}`, ni palette Tailwind brute.
3. Si un besoin n'a pas de token, **propose d'ajouter le token** dans `tokens.css` (clair + sombre) plutôt que de contourner.
4. Réutilise les composants de `src/components/ui/*` avant d'en créer.
5. Vérifie toujours le rendu en clair **et** en sombre.
