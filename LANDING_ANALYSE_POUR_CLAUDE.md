# ANALYSE CODEBASE — ArchStudio / Modelizia
## Résumé concis pour création d'une nouvelle landing page par Claude

---

## 1. VUE D'ENSEMBLE DU PROJET

**Nom** : ArchStudio (produit : Modelizia)  
**Type** : Outil de modélisation visuelle de bases de données (canvas infini)  
**Framework** : Next.js 16 (App Router, Turbopack)  
**Langage** : TypeScript (strict)  
**Gestionnaire de paquets** : pnpm 11  
**Langue de l'interface** : Français (fr-FR)

---

## 2. STACK TECHNIQUE (déjà installée, aucun ajout autorisé)

| Domaine | Technologie | Rôle |
|---------|-------------|------|
| Framework | Next.js 16 (App Router) | Routage, Server Components |
| Styling | Tailwind CSS v4 | Design tokens, utilitaires |
| UI primitives | shadcn/ui + @base-ui/react | Composants accessibles |
| Animations | GSAP + ScrollTrigger | Timeline, scroll-driven |
| Smooth scroll | Lenis | Synchronisé avec GSAP ticker |
| Icons | lucide-react | Icônes cohérentes |
| Polices | Geist (next/font/google) | Variable, optimisée |
| État | Zustand | Stores client |
| Temps réel | PartyKit + Partysocket | Collaboration multi-salons |
| Engine | Prisma, SQL-parser, Codegen | Modèle de données, génération SQL/Prisma/TS/Zod |
| Éditeur | Monaco Editor | Studio de code intégré |
| Analytics | @vercel/analytics | Tracking |
| Build | pnpm + Turbopack | Dev rapide |

**Contrainte importante** : Aucune nouvelle dépendance n'est autorisée. Tout doit utiliser ce qui est déjà dans `package.json`.

---

## 3. ARBRE DES FICHIERS RESTANTS (après suppression de la landing)

```
src/
├── app/
│   ├── layout.tsx          ← RACINE — ne PAS toucher (import globals.css, providers, analytics)
│   ├── studio/
│   │   ├── page.tsx        ← Page studio (canvas principal) — PROTÉGÉE
│   │   └── code/
│   │       └── page.tsx    ← Studio de code — PROTÉGÉE
│   └── globals.css         ← SUPPRIMÉ (était les design tokens landing)
│   └── page.tsx            ← SUPPRIMÉ (était la route racine / landing)
├── components/
│   ├── landing/            ← SUPPRIMÉ (tous les composants landing)
│   ├── ui/                 ← shadcn/ui (badge, button, card, dialog, input, etc.) — GARDÉ
│   ├── canvas/             ← Composants canvas studio — PROTÉGÉS
│   ├── toolbar/            ← Toolbar studio — PROTÉGÉE
│   └── providers/
│       └── smooth-scroll-provider.tsx ← Lenis + GSAP — GARDÉ (réutilisable)
├── lib/
│   ├── engine/             ← Engine de schéma (parser, codegen, validation) — PROTÉGÉ
│   ├── collab/             ← Synchronisation PartyKit — PROTÉGÉ
│   ├── export/             ← Export image — PROTÉGÉ
│   ├── monaco/             ← Config Monaco — PROTÉGÉ
│   ├── templates/          ← Presets de schémas — PROTÉGÉ
│   ├── alignment.ts        — PROTÉGÉ
│   ├── history.ts          — PROTÉGÉ
│   ├── table-colors.ts     — PROTÉGÉ
│   └── utils.ts            (`cn` helper) — GARDÉ
├── store/
│   ├── code-workspace-store.ts — PROTÉGÉ
│   ├── collab-store.ts     — PROTÉGÉ
│   ├── focus-store.ts      — PROTÉGÉ
│   ├── graph-store.ts      — PROTÉGÉ
│   └── profile-store.ts    — PROTÉGÉ
├── types/
│   ├── ast.ts              — PROTÉGÉ
│   ├── collab.ts           — PROTÉGÉ
│   ├── database.ts         — PROTÉGÉ
│   ├── flow.ts             — PROTÉGÉ
│   └── index.ts            — PROTÉGÉ
└── hooks/                  — divers hooks studio — PROTÉGÉS
```

**Fichiers de config à la racine** : `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `package.json`, `pnpm-workspace.yaml`, `partykit.json`, `next-env.d.ts`

---

## 4. CE QUI A ÉTÉ SUPPRIMÉ (table rase landing)

Tous les fichiers suivants ont été supprimés :

- `src/app/page.tsx` — Route racine `/` (landing)
- `src/app/globals.css` — Design tokens light mode (landing)
- `src/components/landing/` — Dossier entier (15 fichiers) :
  - `layout.tsx`, `navbar.tsx`, `hero-section.tsx`, `hero.tsx`
  - `hero-canvas-mockup.tsx`, `canvas-preview.tsx`
  - `bento-grid.tsx`, `code-preview.tsx`
  - `collaboration.tsx`, `social-proof.tsx`
  - `final-cta.tsx`, `footer.tsx`, `health-score-section.tsx`
  - `section-heading.tsx`, `landing-nav.tsx`
- `LANDING_BLUEPRINT.md` — Document de cadrage (supprimé)

---

## 5. CE QUI DOIT ÊTRE CRÉÉ (nouvelle landing page)

### Fichiers requis par Claude

1. **`src/app/page.tsx`** — Route racine `/`, Server Component ou Client Component
   - Wrapper avec `SmoothScrollProvider` (déjà existant dans `src/components/providers/`)
   - Structure de sections ordonnées

2. **`src/components/landing/layout.tsx`** — Wrapper de page avec navbar fixe + sections ordonnées

3. **`src/components/landing/navbar.tsx`** — Navigation fixe, blur, liens ancres, CTA "Ouvrir le Studio" (`/studio`)

4. **Sections de landing** (au choix de Claude) :
   - Hero avec H1, sous-titre, 2 CTAs (Studio, Démo)
   - Features / Bento grid (6–8 features, asymétrique)
   - Canvas showcase (mockup 3D interactif, tilt souris)
   - Collaboration temps réel (avatars, curseurs)
   - Architecture / Stack technique (badges dialectes)
   - Social proof (métriques, badges stack, PAS de faux témoignages)
   - CTA section finale
   - Footer (liens studio, réseaux sociaux, copyright)

### Contraintes à respecter

- **Zéro régression** sur `/studio` et `/studio/code` — ces routes doivent continuer à fonctionner
- **Aucune nouvelle dépendance** — utiliser uniquement ce qui est dans `package.json`
- **Tailwind CSS v4** avec les design tokens existants (ou nouveaux si nécessaires)
- **Animations** respectant `prefers-reduced-motion`
- **Build et lint doivent passer sans erreur** (`pnpm build`, `pnpm lint`)
- **Dark mode non requis** pour l'instant (light mode uniquement)
- **Pas de faux témoignages** dans la social proof — uniquement faits vérifiables et badges de stack
- **Composants shadcn/ui** déjà disponibles dans `src/components/ui/`
- **Icônes lucide-react** déjà installées
- **Police Geist** déjà chargée via `next/font/google` dans `layout.tsx`

### Notes techniques importantes

- `src/app/layout.tsx` importe `./globals.css` — puisque ce fichier a été supprimé, Claude doit soit recréer un `globals.css`, soit importer Tailwind directement dans le layout, soit utiliser une autre approche CSS. Le fichier `layout.tsx` existe et ne doit pas être modifié (il contient les providers globaux : Tooltip, Toast, CommandPalette, Analytics, etc.).
- `src/components/providers/smooth-scroll-provider.tsx` existe et fournit Lenis + GSAP configuré. Il est prêt à être utilisé.
- `src/lib/utils.ts` exporte la fonction `cn()` (class-variance-authority + tailwind-merge) — utilitaire standard shadcn.
- `@/components/ui/` contient : badge, button, card, dialog, input, kbd, resize-handle, select, sheet, tabs, toast, tooltip.

### Commandes de validation

```bash
pnpm dev      # Serveur de développement
pnpm build    # Build de production (doit passer sans erreur)
pnpm lint     # Lint (doit passer sans erreur)
```

---

## 6. EXEMPLE DE STRUCTURE ATTENDUE POUR CLAUDE

```tsx
// src/app/page.tsx
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-dvh bg-background text-foreground antialiased">
        {/* Sections de landing */}
      </div>
    </SmoothScrollProvider>
  );
}
```

---

## 7. RÉFÉRENCES RAPIDES

- **Port dev** : standard Next.js (3000)
- **PartyKit dev** : `pnpm party:dev` (port 1999)
- **Git** : branche `main`, remote `origin` (alexkonandev/ArchStudio)
- **Dernier commit** : `f8d9097` — feat: collaboration PartyKit multi-salons, refonte topbar, profils, DX unifié et Vercel Analytics

---

**Statut** : Prêt pour Claude. Tous les fichiers landing ont été supprimés. Le reste du codebase (studio, engine, stores, types, UI components) est intact et protégé.
