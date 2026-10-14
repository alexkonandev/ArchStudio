# ArchStudio — Phase 3 : Delight & Polish

> Suite de l'audit UX/UI. Exécution **séquentielle** des 4 blocs ci-dessous.
> Validation obligatoire à la fin de **chaque** étape : `pnpm exec tsc --noEmit` (0 erreur), `eslint src` (0 erreur / 0 warning), `next build` (OK).
> Contraintes : 0 placeholder, 0 `any`, respect du design system existant (glass-panel, tokens oklch, Base UI, lucide). Aucune régression Phases 1/2.

---

## Étape 1 — Raccourcis clavier & Aide (`kbd` + cheatsheet `?`)

**Objectif :** rendre les raccourcis visibles et découvrables.

Livrables :
1. **Composant `Kbd`** (`src/components/ui/kbd.tsx`) — touche clavier stylisée réutilisable.
2. **Composant `Tooltip`** (`src/components/ui/tooltip.tsx`) — wrapper Base UI `Tooltip` avec support `shortcut` (affiche `label + <Kbd>`).
3. **Hook `useCheatsheet`** — écouteur global sur `?` (ignoré dans les champs éditables, comme `use-global-history-shortcuts.ts`), ouvre/ferme la modale.
4. **Modale `ShortcutsDialog`** — liste catégorisée : Navigation, Canvas, Catalogue/Inspecteur, Code Studio.
5. **Application** : `Tooltip` avec `kbd` sur les actions principales (Topbar undo/redo/auto-layout, boutons Code Studio, menu contextuel Catalogue, floating node toolbar). Remplacer les `title=` natifs par ces tooltips.

Fichiers touchés : `ui/kbd.tsx` (new), `ui/tooltip.tsx` (new), `hooks/use-cheatsheet.ts` (new), `components/toolbar/shortcuts-dialog.tsx` (new), `app/layout.tsx` (TooltipProvider), `studio-header.tsx`, `code-studio.tsx`, `catalog-panel.tsx`, `floating-node-toolbar.tsx`.

---

## Étape 2 — Templates de création dans le catalogue

**Objectif :** peupler le graphe en 1 clic depuis des modèles prêts à l'emploi.

Livrables :
1. **Templates locaux** (`src/lib/templates/quick-starters.ts`) — 3 modèles compacts : SaaS Multi-tenant, E-commerce, Blog (id PK `autoincrement()`, 1-2 relations réalistes, timestamps).
2. **Section « Démarrage rapide »** dans `catalog-panel.tsx` — grille de boutons (visible notamment quand le catalogue est vide ou via un état repliable en tête).
3. **Intégration store** : utiliser `loadSchema` (déjà existant, undoable + validation) pour peupler le graphe, avec `pushToast` de confirmation.

Fichiers touchés : `lib/templates/quick-starters.ts` (new), `sidebar/catalog-panel.tsx`.

---

## Étape 3 — Panels redimensionnables & Mode Zen (Code Studio)

**Objectif :** confort d'usage de l'IDE plein écran.

Livrables :
1. **Panneaux redimensionnables** — poignées de drag entre les 3 colonnes de `/studio` (file-tree / éditeur / diagnostics). Implémentation légère maison (sans dépendance) : poignée verticale + largeurs en state + `onPointerDown`/move, min/max bornées, persistées optionnellement.
2. **Mode Zen** — bouton bascule dans la toolbar Code Studio (`Maximize2`/`Minimize2`) masquant les 2 sidebars + barre d'onglets format pour un focus éditeur. Raccourci `Ctrl/Cmd+K Z` optionnel + sortie `Esc`.

Fichiers touchés : `code-studio/code-studio.tsx`, éventuel `code-studio/resizable-panel.tsx` (new helper).

---

## Étape 4 — Micro-interactions & Delight (Gamification)

**Objectif :** expérience vivante et gratifiante.

Livrables :
1. **Confettis au score 100 %** — animation (canvas custom léger, 0 dépendance) déclenchée quand `HealthScore` atteint 100 et 0 erreur. Vérifier `prefers-reduced-motion` (respect accessibilité déjà en place).
2. **Micro-animations d'actions clés** : création de table (apparition nœud), création de relation (le pulse `edge-pulse` existe déjà — l'étendre), ajout de champ (flash ligne), suppression (fondu). Classes utilitaires CSS dans `globals.css` (`@keyframes` existantes conservées).
3. **Compteur « +2 pts » flottant** (optionnel si temps) sur amélioration du score.

Fichiers touchés : `components/canvas/confetti.tsx` (new), `app/globals.css` (keyframes), `canvas/health-score-bar.tsx` ou `graph-canvas.tsx` (déclenchement), `canvas/table-node.tsx` (flash).

---

## Hors périmètre Phase 3 (rappel)
- Export ZIP réel (`jszip`) — nécessite ajout de dépendance, non demandé ici.
- Palette `⌘P`, recherche globale.

---

## Suivi
| Étape | Statut | tsc | eslint | build |
|-------|--------|-----|--------|-------|
| 1 — Raccourcis & Aide | ✅ | ✅ | ✅ | ✅ |
| 2 — Templates catalogue | ✅ | ✅ | ✅ | ✅ |
| 3 — Panels & Zen | ✅ | ✅ | ✅ | ✅ |
| 4 — Delight | ✅ | ✅ | ✅ | ✅ |
