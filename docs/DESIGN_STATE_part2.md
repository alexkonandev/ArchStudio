# MODELIZIA — Design State (export pour IA externe)

Document exportÃ© pour une IA qui n'a accÃ¨s qu'Ã  ce fichier. Toutes les
extractions de code sont faites **tel quel** (sans rÃ©sumÃ© ni abrÃ©viation).

---

## 1. TOKENS DU STUDIO â€” globals.css (100% copy)

> Chemin exact : `C:\Users\zoumanji\Desktop\Coding\ArchStudio\src\app\globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
    --font-heading: var(--font-sans);
    --font-sans: var(--font-sans);
    --color-sidebar-ring: var(--sidebar-ring);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar: var(--sidebar);
    --color-chart-5: var(--chart-5);
    --color-chart-4: var(--chart-4);
    --color-chart-3: var(--chart-3);
    --color-chart-2: var(--chart-2);
    --color-chart-1: var(--chart-1);
    --color-ring: var(--ring);
    --color-input: var(--input);
    --color-border: var(--border);
    --color-destructive: var(--destructive);
    --color-accent-foreground: var(--accent-foreground);
    --color-accent: var(--accent);
    --color-muted-foreground: var(--muted-foreground);
    --color-muted: var(--muted);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-secondary: var(--secondary);
    --color-primary-foreground: var(--primary-foreground);
    --color-primary: var(--primary);
    --color-popover-foreground: var(--popover-foreground);
    --color-popover: var(--popover);
    --color-card-foreground: var(--card-foreground);
    --color-card: var(--card);
    --color-foreground: var(--foreground);
    --color-background: var(--background);
    --radius-sm: calc(var(--radius) * 0.6);
    --radius-md: calc(var(--radius) * 0.8);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) * 1.4);
    --radius-2xl: calc(var(--radius) * 1.8);
    --radius-3xl: calc(var(--radius) * 2.2);
    --radius-4xl: calc(var(--radius) * 2.6);
}
```

### Configuration du style systÃ¨me

- **Pas de fichier `tailwind.config.*`** : Tailwind v4 en mode CSS-first
  (`@import "tailwindcss"`). La config se fait dans le CSS via `@theme inline`
  et `@custom-variant`.
- **Pas de `postcss.config.*`** : non dÃ©tectÃ©.
- **Pas de `components.json`** : non dÃ©tectÃ©.
- **`tw-animate-css`** est importÃ© comme plugin d'animation.
- **`@import "shadcn/tailwind.css"`** importe les tokens shadcn.

### Variables principales

| Couleur | Format | Valeur |
|---|---|---|
| `ink` (foreground) | oklch | `oklch(0.208 0.042 265.755)` |
| `paper` (background) | oklch | `oklch(0.984 0.003 247.858)` |
| `primary` | oklch | `= ink` |
| `accent` | oklch | `= paper` |
| `border` | oklch | `oklch(0.929 0.013 255.508)` |
| `ring` | oklch | `oklch(0.704 0.04 256.788)` |
| `destructive` | oklch | `oklch(0.577 0.245 27.325)` |
| `radius` | rem | `0.625rem` |

### Suite de globals.css (ajoutÃ© en continu)

Le reste du fichier (affichage de `:root`, `.dark`, `@layer base` et `.glass-panel`)
se trouve dans les blocs de code ajoutÃ©s aprÃ¨s celui-ci.


```css
:root {
    --background: oklch(0.984 0.003 247.858);
    --foreground: oklch(0.208 0.042 265.755);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.208 0.042 265.755);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.208 0.042 265.755);
    --primary: oklch(0.208 0.042 265.755);
    --primary-foreground: oklch(0.984 0.003 247.858);
    --secondary: oklch(0.968 0.007 247.896);
    --secondary-foreground: oklch(0.279 0.041 260.031);
    --muted: oklch(0.968 0.007 247.896);
    --muted-foreground: oklch(0.554 0.046 257.417);
    --accent: oklch(0.968 0.007 247.896);
    --accent-foreground: oklch(0.279 0.041 260.031);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.929 0.013 255.508);
    --input: oklch(0.929 0.013 255.508);
    --ring: oklch(0.704 0.04 256.788);
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
    --radius: 0.625rem;
    --sidebar: oklch(0.968 0.007 247.896);
    --sidebar-foreground: oklch(0.208 0.042 265.755);
    --sidebar-primary: oklch(0.208 0.042 265.755);
    --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
    --sidebar-accent: oklch(0.929 0.013 255.508);
    --sidebar-accent-foreground: oklch(0.279 0.041 260.031);
    --sidebar-border: oklch(0.929 0.013 255.508);
    --sidebar-ring: oklch(0.704 0.04 256.788);
}
```

### Suite : `.dark`

```css
.dark {
    --background: oklch(0.141 0.005 285.823);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.21 0.006 285.885);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.21 0.006 285.885);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.92 0.004 286.32);
    --primary-foreground: oklch(0.21 0.006 285.885);
    --secondary: oklch(0.274 0.006 286.033);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.274 0.006 286.033);
    --muted-foreground: oklch(0.705 0.015 286.067);
    --accent: oklch(0.274 0.006 286.033);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.552 0.016 285.938);
    --chart-1: oklch(0.871 0.006 286.286);
    --chart-2: oklch(0.552 0.016 285.938);
    --chart-3: oklch(0.442 0.017 285.786);
    --chart-4: oklch(0.37 0.013 285.805);
    --chart-5: oklch(0.274 0.006 286.033);
    --sidebar: oklch(0.21 0.006 285.885);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.488 0.243 264.376);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.274 0.006 286.033);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.552 0.016 285.938);
}
```

### Suite : `@layer base`

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
    }
  body {
    @apply bg-background text-foreground;
    }
  html {
    @apply font-sans;
    }
}
```

---

## 3. POLICES ET SPECTRE DE POLICES

| Utilisateur | Police | Provenance | Statut |
|---|---|---|---|
| Body du studio | `var(--font-sans)` = `Geist` | `layout.tsx`: `Geist({ subsets: [\"latin\"], variable: \"--font-sans\" })` | âœ… `Geist` chargÃ© |
| Mono pour la landing | `var(--font-geist-mono)` | **absent de `layout.tsx` (seul `Geist` est importÃ©)** | âŒ Non dÃ©fini |
| Body landing | `var(--font-geist-sans)` | `landing.css` | âœ… MÃªme source |

> `next/font/google` expose `Geist` et `Geist_Mono`. Le studio n'exporte que
> `Geist`. La landing utilise `var(--font-geist-mono)` dans `.l-mono`, or cette
> variable ne vient pas du studio. Si la landing est rendue par un layout
> sÃ©parÃ©, la police mono n'est pas garantie.

## 4. CSP â€” `next.config.ts`

```ts
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}${collabOrigin ? ` ${collabOrigin}` : ""}${partykitOrigin ? ` ${partykitOrigin}` : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");
```

**Analyse :**
- `font-src 'self' data:` **bloque l'import de polices externes** (Google Fonts
  CDN). Seules les polices locales `Geist` (via `next/font`) sont sÃ©curisÃ©es.
- Si on ajoute Google Fonts via `@import url(...)`, il faudrait ajouter
  `https://fonts.googleapis.com` et `https://fonts.gstatic.com` Ã  `font-src`.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
    --font-heading: var(--font-sans);
    --font-sans: var(--font-sans);
    --color-sidebar-ring: var(--sidebar-ring);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar: var(--sidebar);
    --color-chart-5: var(--chart-5);
    --color-chart-4: var(--chart-4);
    --color-chart-3: var(--chart-3);
    --color-chart-2: var(--chart-2);
    --color-chart-1: var(--chart-1);
    --color-ring: var(--ring);
    --color-input: var(--input);
    --color-border: var(--border);
    --color-destructive: var(--destructive);
    --color-accent-foreground: var(--accent-foreground);
    --color-accent: var(--accent);
    --color-muted-foreground: var(--muted-foreground);
    --color-muted: var(--muted);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-secondary: var(--secondary);
    --color-primary-foreground: var(--primary-foreground);
    --color-primary: var(--primary);
    --color-popover-foreground: var(--popover-foreground);
    --color-popover: var(--popover);
    --color-card-foreground: var(--card-foreground);
    --color-card: var(--card);
    --color-foreground: var(--foreground);
    --color-background: var(--background);
    --radius-sm: calc(var(--radius) * 0.6);
    --radius-md: calc(var(--radius) * 0.8);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) * 1.4);
    --radius-2xl: calc(var(--radius) * 1.8);
    --radius-3xl: calc(var(--radius) * 2.2);
    --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
    --background: oklch(0.984 0.003 247.858);
    --foreground: oklch(0.208 0.042 265.755);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.208 0.042 265.755);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.208 0.042 265.755);
    --primary: oklch(0.208 0.042 265.755);
    --primary-foreground: oklch(0.984 0.003 247.858);
    --secondary: oklch(0.968 0.007 247.896);
    --secondary-foreground: oklch(0.279 0.041 260.031);
    --muted: oklch(0.968 0.007 247.896);
    --muted-foreground: oklch(0.554 0.046 257.417);
    --accent: oklch(0.968 0.007 247.896);
    --accent-foreground: oklch(0.279 0.041 260.031);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.929 0.013 255.508);
    --input: oklch(0.929 0.013 255.508);
    --ring: oklch(0.704 0.04 256.788);
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
    --radius: 0.625rem;
    --sidebar: oklch(0.968 0.007 247.896);
    --sidebar-foreground: oklch(0.208 0.042 265.755);
    --sidebar-primary: oklch(0.208 0.042 265.755);
    --sidebar-primary-foreground: oklch(0.984 0.003 247.858);
    --sidebar-accent: oklch(0.929 0.013 255.508);
    --sidebar-accent-foreground: oklch(0.279 0.041 260.031);
    --sidebar-border: oklch(0.929 0.013 255.508);
    --sidebar-ring: oklch(0.704 0.04 256.788);
}

.dark {
    --background: oklch(0.141 0.005 285.823);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.21 0.006 285.885);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.21 0.006 285.885);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.92 0.004 286.32);
    --primary-foreground: oklch(0.21 0.006 285.885);
    --secondary: oklch(0.274 0.006 286.033);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.274 0.006 286.033);
    --muted-foreground: oklch(0.705 0.015 286.067);
    --accent: oklch(0.274 0.006 286.033);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.552 0.016 285.938);
    --chart-1: oklch(0.871 0.006 286.286);
    --chart-2: oklch(0.552 0.016 285.938);
    --chart-3: oklch(0.442 0.017 285.786);
    --chart-4: oklch(0.37 0.013 285.805);
    --chart-5: oklch(0.274 0.006 286.033);
    --sidebar: oklch(0.21 0.006 285.885);
    --sidebar-foreground: oklch(0.985 0 0);
    --sidebar-primary: oklch(0.488 0.243 264.376);
    --sidebar-primary-foreground: oklch(0.985 0 0);
    --sidebar-accent: oklch(0.274 0.006 286.033);
    --sidebar-accent-foreground: oklch(0.985 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: oklch(0.552 0.016 285.938);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
    }
  body {
    @apply bg-background text-foreground;
    }
  html {
    @apply font-sans;
    }
}

/* --- Global Light Glassmorphism -------------------------------------------- */

/*
 * Shared frosted-glass surface used by the topbar, sidebars, modals and the
 * Code Studio panels. Keeps the light-glass token in one place:
 * white/80 + backdrop blur + hairline slate border.
 */
.glass-panel {
  background-color: rgb(255 255 255 / 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: rgb(226 232 240);
}

/* Thin scrollbars for glass panels. */
.glass-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}
.glass-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.glass-scroll::-webkit-scrollbar-thumb {
  background-color: rgb(203 213 225);
  border-radius: 9999px;
}
.glass-scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* --- Canvas micro-interactions ------------------------------------------- */

/* One-shot luminous pulse played along a freshly created relation cable. */
@keyframes edge-pulse {
  0% {
    opacity: 0.15;
    stroke-width: 3;
  }
  25% {
    opacity: 0.75;
    stroke-width: 9;
  }
  100% {
    opacity: 0;
    stroke-width: 3;
  }
}

/* Fade-out for the transient "Relation créée" floating label. */
@keyframes edge-pulse-fade {
  0% {
    opacity: 0;
    transform: translate(-50%, -140%) scale(0.9);
  }
  15% {
    opacity: 1;
    transform: translate(-50%, -160%) scale(1);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* --- Phase 3 · Delight utilities ------------------------------------------- */

/*
 * Score pop: played once on the health badge when the score crosses a rank
 * threshold or reaches 100. Quick scale bounce, GPU-friendly.
 */
@keyframes score-pop {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.18);
  }
  70% {
    transform: scale(0.96);
  }
  100% {
    transform: scale(1);
  }
}

.score-pop {
  animation: score-pop 480ms cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

/*
 * Badge shine: a light sweep across a rank badge on level-up. Applied to an
 * ::after overlay so no extra DOM is needed; keep the host positioned.
 */
@keyframes badge-shine {
  0% {
    transform: translateX(-120%) skewX(-18deg);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translateX(240%) skewX(-18deg);
    opacity: 0;
  }
}

.badge-shine {
  position: relative;
  overflow: hidden;
}

.badge-shine::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 40%;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 255 255 / 0.75),
    transparent
  );
  animation: badge-shine 900ms ease-out forwards;
  pointer-events: none;
}

/*
 * Progress shimmer: a soft travelling highlight on a progress fill, used on
 * the health bar when the schema is perfect (100%).
 */
@keyframes progress-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.progress-shimmer {
  background-image: linear-gradient(
    100deg,
    transparent 20%,
    rgb(255 255 255 / 0.55) 50%,
    transparent 80%
  );
  background-size: 200% 100%;
  animation: progress-shimmer 2.2s linear infinite;
}

/*
 * Node entrance: freshly created tables scale/fade in on the canvas.
 * Keyed by node id (see TableNode) so it only plays for brand-new nodes.
 */
@keyframes node-enter {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(6px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.node-enter {
  animation: node-enter 260ms cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: center;
}

/*
 * Field flash: a one-shot highlight on a newly added column row in a
 * table node (amber wash fading to transparent).
 */
@keyframes field-flash {
  0% {
    background-color: rgb(245 158 11 / 0.35);
  }
  100% {
    background-color: transparent;
  }
}

.field-flash {
  animation: field-flash 900ms ease-out forwards;
}

/*
 * Floating score delta ("+2", "+8"...): rises and fades above the health
 * widget when the score improves.
 */
@keyframes score-delta-rise {
  0% {
    opacity: 0;
    transform: translate(-50%, 6px) scale(0.9);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -14px) scale(1);
  }
}

.score-delta-rise {
  animation: score-delta-rise 1600ms ease-out forwards;
}

/* Respect users who prefer reduced motion: kill all delight loops. */
@media (prefers-reduced-motion: reduce) {
  .score-pop,
  .badge-shine::after,
  .progress-shimmer,
  .node-enter,
  .field-flash,
  .score-delta-rise {
    animation: none;
  }
}

/*
 * Monaco whole-line highlight: a soft amber wash behind a line when the
 * diagnostics panel hovers a table (applied via editor decorations, so the
 * theme owns the token colours and this only tints the background).
 */
.modelizia-highlight-line {
  background-color: rgb(251 191 36 / 0.14);
  box-shadow: inset 2px 0 0 0 rgb(251 191 36 / 0.6);
}
```



## 2. CSS DE LA LANDING — landing.css

> Chemin exact : `C:\Users\zoumanji\Desktop\Coding\ArchStudio\src\components\landing\landing.css`

```css
/* ==========================================================================
   Modelizia — landing. Tout est scopé sous `.landing` pour ne jamais
   intervenir avec le studio ni avec les tokens de globals.css.
   ========================================================================== */

.landing {
  --l-paper: #f4f1e8;
  --l-paper-2: #ebe7d9;
  --l-card: #fbfaf5;
  --l-ink: #15130e;
  --l-muted: #625e50;
  --l-line: #d8d2c0;
  --l-accent: #e5421b;
  --l-accent-soft: #fbe2d9;
  --l-blue: #2f4bff;
  --l-green: #1f8a5b;
  --l-code: #16140f;

  background: var(--l-paper);
  color: var(--l-ink);
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100dvh;
  overflow-x: clip;
}

.landing ::selection {
  background: var(--l-accent);
  color: #fff;
}

.landing a {
  color: inherit;
  text-decoration: none;


```css
/* ---------- Fond quadrillé "papier millimétré" ---------- */

.landing .l-gridbg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, rgba(21, 19, 14, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(21, 19, 14, 0.06) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 25%, #000 25%, transparent 75%);
  mask-image: radial-gradient(ellipse 80% 70% at 50% 25%, #000 25%, transparent 75%);
}

.landing .l-dots {
  background-image: radial-gradient(rgba(21, 19, 14, 0.18) 1px, transparent 1.2px);
  background-size: 18px 18px;
}

/* ---------- Boutons ---------- */

.landing .l-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  height: 3rem;
  padding-inline: 1.4rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.landing .l-btn:focus-visible,
.landing a:focus-visible,
.landing button:focus-visible {
  outline: 2px solid var(--l-ink);
  outline-offset: 3px;
}

.landing .l-btn-primary {
  background: var(--l-accent);
  color: #fff;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.18),
    0 10px 28px -10px rgba(229, 66, 27, 0.7);
}

.landing .l-btn-primary:hover {
  background: #cf3612;
}

.landing .l-btn-ghost {
  border: 1.5px solid var(--l-ink);
  color: var(--l-ink);


```css
/* ---------- Détails typographiques ---------- */

.landing .l-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--l-muted);
}

.landing .l-eyebrow::before {
  content: "";
  width: 1.5rem;
  height: 1.5px;
  background: var(--l-accent);
}

.landing .l-h2 {
  font-size: clamp(2rem, 4.2vw, 3.25rem);
  line-height: 1.04;
  letter-spacing: -0.035em;
  font-weight: 600;
}

.landing .l-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--l-line);
  border-radius: 999px;
  background: var(--l-card);
  font-size: 0.75rem;
  line-height: 1;
}

/* ---------- Cartes ---------- */

.landing .l-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--l-line);
  border-radius: 1.5rem;
  background: var(--l-card);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .landing .l-card:hover {
    transform: translateY(-3px);
    border-color: var(--l-ink);
    box-shadow: 6px 6px 0 var(--l-ink);
  }
}

.landing .l-window {
  border: 1.5px solid var(--l-ink);
  border-radius: 1.1rem;
  background: var(--l-card);
  box-shadow: 10px 10px 0 var(--l-ink);
  overflow: hidden;
}

/* ---------- Code ---------- */

.landing .l-codepanel {
  background: var(--l-code);
  color: #e9e5d8;
  border-radius: 1.25rem;
  border: 1.5px solid var(--l-ink);
  box-shadow: 8px 8px 0 var(--l-accent);
}

.landing .l-kw {
  color: #ff8d6e;
}
.landing .l-str {
  color: #94d9ab;
}
.landing .l-fn {
  color: #9fb0ff;
}
```

### Suite : animations

```css
/* ---------- Animations ---------- */

@keyframes l-rise {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes l-pop {
  from {
    opacity: 0;
    transform: scale(0.93);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes l-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes l-blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .landing .l-rise {
    animation: l-rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .landing .l-pop {
    transform-box: fill-box;
    transform-origin: center;
    animation: l-pop 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .landing .l-draw {
    stroke-dasharray: var(--len, 400);
    stroke-dashoffset: var(--len, 400);
    animation: l-draw 1.2s cubic-bezier(0.6, 0, 0.2, 1) forwards;
    animation-delay: var(--d, 0ms);
  }

  .landing .l-caret {
    animation: l-blink 1.1s steps(1) infinite;
  }
}
```

  background: transparent;
}

.landing .l-btn-ghost:hover {
  background: var(--l-ink);
  color: var(--l-paper);
}

.landing .l-btn-light {
  background: var(--l-paper);
  color: var(--l-ink);
}

.landing .l-btn-light:hover {
  background: #fff;
}

.landing .l-btn-outline-light {
  border: 1.5px solid rgba(244, 241, 232, 0.4);
  color: var(--l-paper);
}

.landing .l-btn-outline-light:hover {
  border-color: var(--l-paper);
  background: rgba(244, 241, 232, 0.08);
}

.landing .l-btn .l-arrow {
  transition: transform 0.2s ease;
}

.landing .l-btn:hover .l-arrow {
  transform: translateX(3px);
}
```

}

.landing .l-mono {
  font-family: var(--font-geist-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
}

.landing .l-muted {
  color: var(--l-muted);
}

.landing .l-accent {
  color: var(--l-accent);
}

.landing .l-container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 1.25rem;
}

@media (min-width: 768px) {
  .landing .l-container {
    padding-inline: 2rem;
  }
}

.landing section[id] {
  scroll-margin-top: 5rem;
}
```



## 5. COMPOSANTS UI DE BASE — `src/components/ui/*`

> Chemins exacts : `C:\Users\zoumanji\Desktop\Coding\ArchStudio\src\components\ui\*.tsx`

### 5.1 `button.tsx`

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive


### 5.2 `input.tsx`

```tsx
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

**Variantes :** une seule variante (aucune)
**Tailles :** `default` (h-8), `md` (text-sm via `md:`)

---

### 5.3 `card.tsx`

```tsx
import * as React from "react"
import { cn } from "cn"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />


### 5.4 `badge.tsx`

```tsx
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
```

**Variants :** `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`

---

### 5.5 `dialog.tsx` — partie 1/2

```tsx
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}


```tsx
function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />


### 5.6 `select.tsx` — partie 1/2

```tsx
"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}



```tsx
function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {


```tsx
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
```


### 5.7 `sheet.tsx`

```tsx
"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "glass-panel fixed z-50 flex flex-col gap-4 bg-clip-padding text-sm text-popover-foreground shadow-xl backdrop-blur-md transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {


### 5.8 `tabs.tsx`

```tsx
"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}


```tsx
function ToastTone({ toast }: { toast: Toast.Root.ToastObject }) {
  const tone =
    toast.type === "success"
      ? "text-emerald-600"
      : toast.type === "error"
        ? "text-destructive"
        : toast.type === "warning"
          ? "text-amber-500"
          : "text-primary"
  return <span className={cn("mt-0.5 shrink-0", tone)} aria-hidden>•</span>
}

function Toaster() {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed top-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className={cn(
              "glass-panel pointer-events-auto flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm shadow-xl ring-1 ring-foreground/10 backdrop-blur-md",
              "data-ending-style:translate-x-2 data-ending-style:opacity-0 data-starting-style:translate-x-2 data-starting-style:opacity-0",
              "transition-all duration-200 ease-out",
            )}
          >
            <ToastTone toast={toast} />
            <Toast.Content className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
              {toast.title && (
                <Toast.Title className="text-sm font-medium text-foreground">
                  {toast.title}
                </Toast.Title>
              )}
              {toast.description && (
                <Toast.Description className="text-xs text-muted-foreground">
                  {toast.description}
                </Toast.Description>


```tsx
export type ToastType = "info" | "success" | "error" | "warning"

/** Push a toast from anywhere (React or plain module code). */
export function pushToast(
  title: string,
  options: { description?: string; type?: ToastType } = {},
): string {
  return toastManager.add({
    title,
    description: options.description,
    type: options.type ?? "info",
  })
}

export { ToastProvider, toastManager }
```

**Notes :** `pushToast(title, options)` permet d'envoyer un toast depuis n'importe
quel module (non-Render props). `ToastTone` mappe `type` → couleur :
success=emerald, error=destructive, warning=amber, info=primary.



### 5.10 `tooltip.tsx`

```tsx
"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "@/lib/utils"
import { Kbd, formatShortcut } from "./kbd"

function Tooltip({
  label,
  shortcut,
  side = "top",
  children,
}: {
  label: React.ReactNode


### 5.11 `kbd.tsx`

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Kbd({
  children,
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-0.5 rounded border border-border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground",
        "[&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

export function formatShortcut(shortcut: string): string[] {
  const isApple =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
  return shortcut.split("+").map((token) => {
    const key = token.trim()
    if (key === "mod") return isApple ? "⌘" : "Ctrl"
    if (key === "shift") return "⇧"
    if (key === "alt") return isApple ? "⌥" : "Alt"
    if (key === "del") return "⌦"
    return key.charAt(0).toUpperCase() + key.slice(1)
  })
}

export { Kbd }
```

---

### 5.12 `resize-handle.tsx`

```tsx


### 5.13 Résumé des composants UI

| Composant | Fichier | Variants principales | Tailles | Notes |
|---|---|---|---|---|
| `Button` | button.tsx | `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` | `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg` | `cva` + `@base-ui/react/button` |
| `Input` | input.tsx | (1) | (1) | `base-ui/input` |
| `Card` | card.tsx | `size: "default" \| "sm"` | — | `data-slot` + CSS var `--card-spacing` |
| `Badge` | badge.tsx | `default`, `secondary`, `destructive`, `outline`, `ghost`, `link` | — | `useRender` de Base UI |
| `Dialog` | dialog.tsx | — | — | `glass-panel` dans `DialogContent` |
| `Select` | select.tsx | — | `size: "sm" \| "default"` | `glass-panel` dans `SelectContent` |
| `Sheet` | sheet.tsx | — | — | `glass-panel`, `side: top|right|bottom|left` |
| `Tabs` | tabs.tsx | `tabsListVariant: "default" \| "line"` | — | `data-active` pour état actif |
| `Toast` | toast.tsx | `type: "info" \| "success" \| "error" \| "warning"` | — | `pushToast` globale |
| `Tooltip` | tooltip.tsx | — | — | Compatible `shortcut` + `Kbd` |
| `Kbd` | kbd.tsx | — | — | `font-sans`, `text-[11px]` |
| `ResizeHandle` | resize-handle.tsx | — | — | `side: "left" \| "right"` |

**Bibliothèques partagées :**
- `@base-ui/react` (1.8.0) : Button, Input, Dialog, Select, Tabs, Toast, Tooltip
- `class-variance-authority` (0.7.1) : cva pour les variants
- `tailwind-merge` (3.7.0) via `cn` : fusion des classes Tailwind
- `shadcn/tailwind.css` importé dans `globals.css`

> **Fin Part 2** — Composants UI. Pour le style réel du studio, la palette
> `TableColor` et les couleurs codées en dur, voir `DESIGN_STATE_part3.md`.

"use client";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

interface ResizeHandleProps {
  side: "left" | "right";
  label: string;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  onDoubleClick: () => void;
}

export function ResizeHandle({
  side,
  label,
  onPointerDown,
  onKeyDown,
  onDoubleClick,
}: ResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group/handle relative z-10 w-2 shrink-0 cursor-col-resize touch-none outline-none select-none",
        side === "left" ? "-ml-1" : "-mr-1",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/handle:bg-primary/50 group-focus-visible/handle:bg-primary"
      />
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 shadow-sm group-hover/handle:flex group-focus-visible/handle:flex"
      >
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
      </span>
    </div>
  );
}
```

  shortcut?: string
  side?: "top" | "bottom" | "left" | "right"
  children: React.ReactElement
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6} className="z-[90]">
          <TooltipPrimitive.Popup
            className={cn(
              "glass-panel flex max-w-xs items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium shadow-lg ring-1 ring-foreground/10 backdrop-blur-md",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0",
            )}
          >
            <span>{label}</span>
            {shortcut && (
              <span className="flex items-center gap-0.5">
                {formatShortcut(shortcut).map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            )}
            <TooltipPrimitive.Arrow className="fill-foreground/10" />
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip }
```

              )}
            </Toast.Content>
            <Toast.Close
              aria-label="Fermer"
              className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              •
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}
```


const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
```

**Variants :** `TabsList` : `default` (bg-muted), `line` (gap-1, bg-transparent).
**Sous-composants :** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.

---

### 5.9 `toast.tsx` — partie 1/3

```tsx
"use client"

import { Toast } from "@base-ui/react/toast"
import { cn } from "@/lib/utils"

/** Base UI Toast primitives wrapped in the Modelizia glass design system. */
const toastManager = Toast.createToastManager()

function ToastProvider({
  children,
  ...props
}: Toast.Provider.Props) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={4000} limit={3} {...props}>
      {children}
      <Toaster />
    </Toast.Provider>
  )
}
```

  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```


  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}
```

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn("glass-panel relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg text-popover-foreground shadow-xl ring-1 ring-foreground/10 backdrop-blur-md duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}
```

**Structure :** primitives de `Select` de Base UI, `SelectContent` utilise `glass-panel` + `SelectPrimitive.List`.

---

### 5.6 `select.tsx` — partie 2/2

```tsx
function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}
```

  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
```


function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "glass-panel fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-4 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/10 backdrop-blur-md duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}
```

**Structure :** primitives de `Dialog` de Base UI, `DialogContent` utilise `glass-panel` de globals.css + `Button` pour la croix.

  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
```

**Variantes :** `size: "default" | "sm"`
**Sous-composants :** `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`

      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

**Variants :** `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`
**Tailles :** `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`


