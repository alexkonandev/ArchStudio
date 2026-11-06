# MODELIZIA — Design State (export pour IA externe)

Document exporté pour une IA qui n'a accès qu'à ce fichier. Toutes les
extractions de code sont faites **tel quel** (sans résumé ni abréviation).

---

## Table des matières

1. [TOKENS DU STUDIO](#1-tokens-du-studio-globalscss-100-copy) — `globals.css`
2. [CSS DE LA LANDING](#2-css-de-la-landing--landingcss) — `landing.css`
3. [POLICES ET SPECTRE DE POLICES](#3-polices-et-spectre-de-polices)
4. [CSP — next.config.ts](#4-csp--nextconfigts)
5. [COMPOSANTS UI DE BASE](#5-composants-ui-de-base--srccomponentsuivtsx)
6. [DEUX LANDINGS (comparison)](#6-deux-landings-comparison)
7. [STYLE RÉEL DU STUDIO](#7-style-réel-du-studio) — TableNode, RelationshipEdge, StudioHeader, CatalogPanel, InspectorPanel, HealthScoreBar, WorkspaceShell
8. [PALETTE TableColor](#8-palette-tablecolor-et-table_color_themes)
9. [COULEURS CODÉES EN DUR](#9-couleurs-codées-en-dur)
10. [POINTS CLÉS À RETENIR](#10-points-clés-à-retenir)
11. [ANIMATIONS — INVENTAIRE COMPLET](#11-animations--inventaire-complet)
12. [LANDING VS STUDIO — TABLEAU COMPARATIF](#12-landing-vs-studio--tableau-comparatif)
13. [MODE SOMMEIL (DARK MODE)](#13-mode-sommeil-dark-mode)
14. [RÉSUMÉ DES DÉPENDANCES ET MÉCANISMES AUDE](#14-résumé-des-dépendances-et-mécanismes-aude)

---

## 1. TOKENS DU STUDIO — globals.css (100% copy)

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

> Ce document est une capture du contenu du `globals.css` complet, qui contient
> également `:root`, `.dark`, `@layer base` et `.glass-panel`. Le reste du
> fichier est inclus dans les blocs de code suivants.

---

## 2. CSS DE LA LANDING — landing.css

> Chemin exact : `C:\Users\zoumanji\Desktop\Coding\ArchStudio\src\components\landing\landing.css`

[Code complet de `landing.css`](./DESIGN_STATE_part1.md#2-css-de-la-landing--landingcss)

﻿# MODELIZIA — Design State (export pour IA externe)

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




### 7.4 `CatalogPanel` (`src/components/sidebar/catalog-panel.tsx`)

```tsx
<div className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors">
  <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left">
    <span className={cn("size-2 shrink-0 rounded-full", theme.dot)} />
    <Table2 className="size-3.5 shrink-0 text-muted-foreground" />
    <span className="truncate text-sm">{name}</span>
    {status?.error ? (
      <OctagonAlert className="size-3.5 shrink-0 text-destructive" aria-label="Erreur" />
    ) : !hasPk ? (
      <span className="shrink-0 rounded bg-amber-500/15 px-1 text-[10px] font-medium text-amber-600">PK</span>
    ) : null}
  </button>
  <Badge variant="secondary">{fieldCount}</Badge>
</div>
```

- `theme.dot` vient de `TABLE_COLOR_THEMES` : `bg-emerald-500` etc.
- `bg-amber-500/15` + `text-amber-600` pour le badge "PK".
- `bg-muted` pour le hover.
- `ring-primary/30` pour l'état selected.

---

### 7.5 `InspectorPanel` (`src/components/sidebar/inspector-panel.tsx`)

- `glass-panel` (principalement dans `SheetContent` et les modals)
- `border-border` (lignes de séparation)
- `bg-input/30 dark:bg-input/80` (dans `Input`)
- `text-muted-foreground` (labels)
- `text-destructive` (boutons suppression)
- `bg-destructive/10` (fond ligne avec erreur)
- `bg-amber-500/10` (fond ligne avec warning)
- `field-flash` (animation CSS)
- `Dialog` pour confirmation de suppression
- `Tabs` / `TabsContent` pour les onglets
- `Input` pour renommer, `Select` pour les types

---

### 7.6 `HealthScoreBar` (`src/components/canvas/health-score-bar.tsx`)

```tsx
if (score >= 90)
  return { bar: "bg-emerald-500", text: "text-emerald-700", glow: "shadow-emerald-500/30" };
if (score >= 75)
  return { bar: "bg-sky-500", text: "text-sky-700", glow: "shadow-sky-500/30" };
if (score >= 50)
  return { bar: "bg-amber-500", text: "text-amber-700", glow: "shadow-amber-500/30" };
return { bar: "bg-rose-500", text: "text-rose-700", glow: "shadow-rose-500/30" };
```

- **Bande de couleurs** : `emerald` (90-100), `sky` (75-89), `amber` (50-74), `rose` (0-49).
- **Éléments** : score popup, progress bar (`h-1.5 w-full rounded-full`), rank badge, counters.
- **Animations** : `score-pop`, `score-delta-rise`, `progress-shimmer`, `badge-shine`.
- **Fond** : `bg-white/80`, `border-slate-200`, `backdrop-blur-md`, `shadow-lg`.
- **Couleurs hardcodées** :
  - `bg-emerald-500/15 text-emerald-700` (perfect)
  - `bg-slate-500/10 text-slate-700` (non perfect)
- **Utilise** `useHealthCelebration` (hook pour les animations de célébration).

---

### 7.7 `WorkspaceShell` (`src/components/layout/workspace-shell.tsx`)

```tsx
<div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
  {!focusCanvasOnly && <StudioHeader />}
  <WorkspacePanels catalog={catalog} canvas={canvas} inspector={inspector} />
</div>
```

- `glass-panel` dans `WorkspacePanels` (sidebars) avec `border-r` / `border-l` et `backdrop-blur-md`.
- **Mode Focus Graph** : `focusCanvasOnly` → `w-full h-screen`, les sidebars cachées.
- `useResizablePanel` : `defaultWidth: 250` (catalogue), `defaultWidth: 300` (inspecteur).

---

## 8. PALETTE `TableColor` ET `TABLE_COLOR_THEMES`

### 8.1 Type `TableColor`

```ts
export const TABLE_COLORS = ["emerald", "indigo", "rose", "amber", "slate"] as const;
export type TableColor = (typeof TABLE_COLORS)[number];
export const DEFAULT_TABLE_COLOR: TableColor = "slate";
```

### 8.2 `TABLE_COLOR_THEMES` (`src/lib/table-colors.ts`)

```ts
export interface TableColorTheme {
  header: string;  // frosted header bg (light glass)
  headerText: string; // header foreground text
  border: string;  // accent border on selection
  dot: string;     // solid accent dot
  ring: string;    // soft focus ring
}

export const TABLE_COLOR_THEMES: Record<TableColor, TableColorTheme> = {
  emerald: {
    header: "bg-emerald-500/10",
    headerText: "text-emerald-900",
    border: "border-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-400/50",
  },
  indigo: {
    header: "bg-indigo-500/10",
    headerText: "text-indigo-900",
    border: "border-indigo-400",
    dot: "bg-indigo-500",
    ring: "ring-indigo-400/50",
  },
  rose: {
    header: "bg-rose-500/10",
    headerText: "text-rose-900",
    border: "border-rose-400",
    dot: "bg-rose-500",
    ring: "ring-rose-400/50",
  },
  amber: {
    header: "bg-amber-500/10",
    headerText: "text-amber-900",
    border: "border-amber-400",
    dot: "bg-amber-500",
    ring: "ring-amber-400/50",
  },
  slate: {
    header: "bg-slate-500/10",
    headerText: "text-slate-900",
    border: "border-slate-400",
    dot: "bg-slate-500",
    ring: "ring-slate-400/50",
  },
};
```

**Utilisation :** `getTableColorTheme(color ?? "slate")` dans `TableNode`
et `FloatingNodeToolbar`.


## 6. DEUX LANDINGS (comparison)

### 6.1 Où sont les fichiers ?

| Dossier | Chemin | Rôle |
|---|---|---|
| `src/components/landing/` | `C:\Users\zoumanji\Desktop\Coding\ArchStudio\src\components\landing\` | **Utilisé par `src/app/page.tsx`** (la landing client `/`) |

### 6.2 `src/components/landing/*` vs `modelizia-landing/*`

| Fichier | `src/components/landing/` | `modelizia-landing/src/components/landing/` | Identiques ? |
|---|---|---|---|
| `layout.tsx` | ✅ | ✅ | Oui (819 octets) |
| `hero.tsx` | ✅ | ✅ | Oui (3616 octets) |
| `how-it-works.tsx` | ✅ | ✅ | Oui (4192 octets) |
| `features-bento.tsx` | ✅ | ✅ | Oui (7641 octets) |
| `code-generation.tsx` | ✅ | ✅ | Oui (7048 octets) |
| `collaboration.tsx` | ✅ | ✅ | Oui (6116 octets) |
| `final-cta.tsx` | ✅ | ✅ | Oui (1883 octets) |
| `footer.tsx` | ✅ | ✅ | Oui (1772 octets) |
| `tech-proof.tsx` | ✅ | ✅ | Oui (2379 octets) |
| `navbar.tsx` | ✅ | ✅ | Oui (3481 octets) |
| `logo.tsx` | ✅ | ✅ | Oui (704 octets) |
| `reveal.tsx` | ✅ | ✅ | Oui (1144 octets) |
| `section-heading.tsx` | ✅ | ✅ | Oui (609 octets) |
| `schema-canvas.tsx` | ✅ | ✅ | Oui (5285 octets) |
| `tilt.tsx` | ✅ | ✅ | Oui (1725 octets) |
| `landing.css` | ✅ | ✅ | Oui (6399 octets, identique) |
| `css-vars.ts` | ❌ | ✅ | Seul dans `modelizia-landing` |
| `app/page.tsx` | ✅ (LandingPage) | ✅ (LandingPage) | Oui (structure identique) |

### 6.3 Quelle landing est utilisée par `src/app/page.tsx` ?

**La landing client est `src/components/landing/*`** (import via
`"@/components/landing/landing.css"`). Le dossier `modelizia-landing/` est un
dossier parallèle qui n'est **pas** utilisé par l'application courante.

### 6.4 Différences notables

- **Aucune différence de contenu** entre les deux dossiers : les fichiers sont
  identiques (vérifié ligne par ligne pour `landing.css`).
- `modelizia-landing/` contient un fichier `css-vars.ts` qui n'existe pas dans
  `src/components/landing/`. Ce fichier fournit un typage utilitaire pour les
  variables CSS (`cssVars(vars)`) mais n'est pas utilisé dans les composants
  de la landing (ils utilisent directement `style={{ "--d": `${ms}ms` }}`).
- `modelizia-landing/src/app/page.tsx` existe mais ne fait pas l'objet d'un
  import direct depuis le studio (l'entrée est `src/app/page.tsx`).

### 6.5 D'où vient le fichier `landing.css` ?

Les deux dossiers contiennent chacun leur propre `landing.css` (la version
actuelle des deux est identique). La landing sur `/` importe
`src/components/landing/landing.css`.

> **En somme :** les deux landings sont **100% identiques** en contenu.
> Rien ne distingue une versioning du dossier `modelizia-landing/`.




## 9. COULEURS CODÉES EN DUR (src, excluant globals.css + landing.css)

| Fichier | Valeur | Usage |
|---|---|---|
| `src/components/canvas/relationship-edge.tsx` | `stroke-indigo-400` | bord de l'edge, état selected |
| `src/components/canvas/relationship-edge.tsx` | `rgb(129 140 248)` | glow `drop-shadow` de l'edge |
| `src/components/canvas/relationship-edge.tsx` | `text-orange-500` / `text-orange-200` | badge CASCADE |
| `src/components/canvas/celebration-confetti.tsx` | `"#10b981"` | confetti vert |
| `src/components/canvas/collab-presence.tsx` | `["#7c3aed", "#059669", "#ea580c", "#db2777", "#0284c7", "#ca8a04"]` | couleurs de présence (peers) |
| `src/components/collab/comment-drawer.tsx` | `"#e2e8f0"` | fond du commentaire |
| `src/components/collab/profile-modal.tsx` | `"#ffffff"` | fond du modal de profil |
| `src/components/landing/code-generation.tsx` | `#ff8d6e` | `l-kw` |
| `src/components/landing/code-generation.tsx` | `#94d9ab` | `l-str` |
| `src/components/landing/code-generation.tsx` | `#9fb0ff` | `l-fn` |
| `src/components/landing/collaboration.tsx` | `#e5421b` | color des avatars |
| `src/components/landing/collaboration.tsx` | `#2f4bff` | color des avatars |
| `src/components/landing/collaboration.tsx` | `#1f8a5b` | color des avatars |
| `src/components/landing/features-bento.tsx` | `#15130e` | header icons |
| `src/components/landing/features-bento.tsx` | `#e5421b` | header icons |
| `src/components/landing/features-bento.tsx` | `#2f4bff` | header icons |
| `src/components/landing/features-bento.tsx` | `#1f8a5b` | header icons |
| `src/components/landing/final-cta.tsx` | `#15130e` | background CTA |
| `src/components/landing/hero.tsx` | `#15130e` | dots background |
| `src/components/landing/hero.tsx` | `#e8b730` | dot secondaire |
| `src/components/landing/how-it-works.tsx` | `#15130e` | header tables |
| `src/components/landing/landing.css` | `#f4f1e8` | `--l-paper` |
| `src/components/landing/landing.css` | `#15130e` | `--l-ink` |
| `src/components/landing/landing.css` | `#e5421b` | `--l-accent` |
| `src/components/landing/landing.css` | `#2f4bff` | `--l-blue` |
| `src/components/landing/landing.css` | `#1f8a5b` | `--l-green` |
| `src/components/landing/logo.tsx` | `#15130e` | background rect |
| `src/components/landing/logo.tsx` | `#f4f1e8` | rect middle |
| `src/components/landing/logo.tsx` | `#e5421b` | rect accent |
| `src/components/landing/schema-canvas.tsx` | `#15130e` | `const INK = "#15130e"` |
| `src/components/collab/comment-drawer.tsx` | `#e2e8f0` | `color={comment.authorId === self.id ? self.avatarColor : "#e2e8f0"}` |
| `src/components/collab/profile-modal.tsx` | `"#ffffff"` | `style={{ backgroundColor: "#ffffff" }}` |

> **Note :** la plupart des couleurs de la landing sont définies dans
> `landing.css` via les variables `--l-*`. Les valeurs hardcodées dans
> `src/**` sont limitées à des jeux de couleurs d'illustration.

---

## 10. POINTS CLÉS À RETENIR

| Sujet | Résultat |
|---|---|
| Mode sombre studio | ✅ `.dark` + `dark:` variant + `@custom-variant dark` |
| Mode sombre landing | ❌ Pas implémenté dans `landing.css` |
| Fonts chargés | ✅ `Geist` (sans-serif). `Geist Mono` non chargé dans layout.tsx |
| CSP | ✅ `font-src 'self' data:` bloque Google Fonts |
| Tailwind | ✅ v4 CSS-first, sans `tailwind.config`, `postcss.config`, `components.json` |
| Animations | ✅ CSS pur (`@keyframes`), GSAP (`collaboration.tsx`), Framer Motion installé mais **non utilisé** |
| `components.json` | ❌ Non détecté |
| `tailwind.config.*` | ❌ Non détecté |
| `postcss.config.*` | ❌ Non détecté |
| `landing.css` | ✅ Doublon dans `modelizia-landing/` identique |


## 11. ANIMATIONS — INVENTAIRE COMPLET

### 11.1 Vue d'ensemble

| Type | Bibliothèque | Fichiers concernés | Statut |
|---|---|---|---|
| CSS pur (`@keyframes`) | Aucune | `globals.css`, `landing.css` | ✅ Utilisé |
| GSAP | `gsap` 3.15.0, `@gsap/react` 2.1.2 | `src/components/landing/collaboration.tsx` | ✅ Utilisé |
| Framer Motion | `framer-motion` 14.4.0 | Aucun | ❌ Installé, mais **non utilisé** |
| Tailwind (tw-animate-css) | `tw-animate-css` 1.4.0 | `globals.css` (`@import "tw-animate-css"`) | ✅ Importé |
| Base UI | `@base-ui/react` | `dialog.tsx`, `select.tsx`, `sheet.tsx`, `toast.tsx`, `tooltip.tsx` | ✅ `data-open:animate-in`, `data-closed:animate-out` |

### 11.2 Animations CSS dans `globals.css`

| Nom | Durée | Easing | Usage |
|---|---|---|---|
| `edge-pulse` | `1400ms` | `ease-out` | Pulse sur l'edge lors de sa création |
| `edge-pulse-fade` | `1400ms` | `ease-out` | Label fade-in/out quand l'edge est créé |
| `score-pop` | `480ms` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Pop du badge de score |
| `badge-shine` | `900ms` | `ease-out` | Lueur sur le badge (level-up) |
| `progress-shimmer` | `2.2s` | `linear infinite` | Shimmer sur la barre de progression (score 100) |
| `node-enter` | `260ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Apparition d'un nœud (TableNode) |
| `field-flash` | `900ms` | `ease-out` | Fond amber sur colonne ajoutée |
| `score-delta-rise` | `1600ms` | `ease-out` | Flotteur du "+" en amélioration |
| `l-rise` | `900ms` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Entrée élément sur la landing |
| `l-pop` | `700ms` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Pop scale sur la landing |
| `l-draw` | `1200ms` | `cubic-bezier(0.6, 0, 0.2, 1)` | Trace du SVG sur la landing |
| `l-blink` | `1100ms` | `steps(1) infinite` | Clignotant caret |

### 11.3 Animations GSAP

- Fichier : `src/components/landing/collaboration.tsx`
- API : `gsap.context()`, `gsap.timeline({ repeat: -1 })`, `mm.add()` / `mm.revert()`
- Usage : animation des curseurs (`data-cursor`) sur le canvas de démonstration.
- Respect de `prefers-reduced-motion: no-preference` via `gsap.matchMedia()`.

### 11.4 Animations Framer Motion

- **Installé** : `package.json` → `framer-motion: ^14.4.0`.
- **Non utilisé** : aucune importation de `framer-motion` dans `src/**`.

### 11.5 `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .score-pop, .badge-shine::after, .progress-shimmer, .node-enter, .field-flash, .score-delta-rise {
    animation: none;
  }
  .landing .l-rise, .landing .l-pop, .landing .l-draw, .landing .l-caret {
    animation: none;
  }
}
```

---

## 12. LANDING VS STUDIO — TABLEAU COMPARATIF

| Critère | Landing (`landing.css`) | Studio (globals.css) | Alignés ? |
|---|---|---|---|
| Couleur de fond | `var(--l-paper)` = `#f4f1e8` (beige clair) | `var(--background)` = `oklch(0.984 0.003 247.858)` | ❌ Non |
| Couleur de texte | `var(--l-ink)` = `#15130e` | `var(--foreground)` = `oklch(0.208 0.042 265.755)` | ❌ Non |
| Couleur d'accent | `#e5421b` (rouge cuivre) | `var(--primary)` = `= ink` | ❌ Non |
| Police | `var(--font-geist-sans)` | `var(--font-sans)` = `Geist` | ✅ Oui |
| Rayons de bordure | `1.5rem` (cartes), `999px` (boutons) | `var(--radius)` = `0.625rem` | ❌ Non |
| Ombres | `6px 6px 0 var(--l-ink)` (séries) | `shadow-sm/lg/xl` (Tailwind) | ❌ Non |
| Boutons | Pillos `999px`, `height: 3rem` | `rounded-lg`, `h-8` | ❌ Non |
| Cartes | `border: 1px`, `radius: 1.5rem` | `rounded-xl`, `ring-1` | ❌ Non |
| Glassmorphism | `rgba(244,241,232,0.82)` + `blur(14px)` | `white/80` + `blur(12px)` | ❌ Non |
| Fond canvas | `var(--l-card)` | `bg-background` | ❌ Non |
| Grille de fond | `l-gridbg` (papillonne) | Aucune | ❌ Non |

---

## 13. MODE SOMMEIL (DARK MODE)

### 13.1 Studio

- **Implémentation** : `.dark` class sur `<html>` + `dark:` variant.
- **Définition** : dans `globals.css`, la règle `.dark` surcharge tous les tokens.
- **Activation** : via `@custom-variant dark (&:is(.dark *))` (Tailwind v4).
- **Utilisation** : `dark:bg-input/30`, `dark:border-input`, etc.
- **Palettes** : `.dark` utilise des teintes plus sombres (ex: `--primary` =
  `oklch(0.92 0.004 286.32)`, `--background` = `oklch(0.141 0.005 285.823)`).

### 13.2 Landing

- **Aucun dark mode** dans `landing.css`.

### 13.3 Activation

| Mécanisme | Studio | Landing |
|---|---|---|
| Class CSS | `.dark` sur `<html>` | N/A |
| `@media (prefers-color-scheme)` | Non utilisé | N/A |
| Override | `.dark` + `dark:` utilities | N/A |

> **Recommandation** : pour un dark mode sur la landing, dupliquer les
> variables `--l-*` dans un contexte `.landing.dark`, ou créer
> `landing.dark.css` à importer conditionnellement.

---

## 14. RÉSUMÉ DES DÉPENDANCES ET MÉCANISMES AUDE

| Élément | Statut |
|---|---|
| `tailwindcss` (v4) | ✅ CSS-first, `@import "tailwindcss"` |
| `tw-animate-css` | ✅ Importé dans `globals.css` |
| `shadcn/tailwind.css` | ✅ Importé dans `globals.css` |
| `next/font/google` | ✅ `Geist` (variable `--font-sans`) |
| `Geist_Mono` | ❌ Non importé |
| `framer-motion` | ❌ Installé, pas utilisé |
| `gsap` | ✅ Utilisé dans `collaboration.tsx` |
| `lenis` | ❌ Installé, pas visible dans `src` |
| `monaco-editor` | ❌ Installé, pas visible dans `landing` |
| `@base-ui/react` | ✅ Utilisé pour la plupart des composants UI |
| `@xyflow/react` | ✅ React Flow pour le canvas |
| `@vercel/analytics` | ✅ Injécter dans `layout.tsx` |
| `@base-ui/react/tooltip` | ✅ Via `Tooltip` wrapper |


