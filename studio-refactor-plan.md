# Studio Refactor Plan — Modelizia / ArchStudio

> Refonte visuelle et technique du Studio (canvas de modélisation) en 3 étapes séquentielles.
> Référence de design : la nouvelle TopBar `src/components/toolbar/studio-header.tsx` (Tailwind v4, `border-border/40`, fonds translucides `bg-background/80`, `backdrop-blur-md`, tokens oklch, glass-panel).
>
> Chaque étape se termine par `pnpm exec tsc --noEmit` (0 erreur TypeScript) avant de passer à la suivante.

---

## Référence de design — TopBar (`studio-header.tsx`)

### Classes de conteneur (à réutiliser partout)

| Élément | Classes Tailwind v4 |
|---|---|
| Barre principale | `sticky top-0 z-40 grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-border/40 bg-background/80 px-3 backdrop-blur-md sm:px-4` |
| Popup / menu déroulant | `min-w-48 rounded-xl border border-border/40 bg-background/90 p-1 shadow-xl backdrop-blur-md` |
| Panel latéral (glass) | `bg-background/90 border border-border/40 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md` |
| Séparateur vertical | `hidden h-5 w-px shrink-0 bg-border/60 sm:block` |
| Bouton icône fantôme | `size-8 shrink-0 text-muted-foreground hover:text-foreground` |
| Pilule santé / badge arrondi | `rounded-full border border-border/40 py-0.5 pr-0.5 pl-2` |
| Champ de saisie | `h-7 rounded-md border border-border/60 bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50` |
| Menu item | `flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-muted` |

### Tokens CSS (`src/app/tokens.css`)

- `--background`: `oklch(0.958 0.012 91.5)` (papier crème `#f4f1e8`)
- `--foreground`: `oklch(0.187 0.010 88.8)` (encre `#15130e`)
- `--border`: `oklch(0.864 0.025 91.6)` (`#d8d2c0`)
- `--muted`: `oklch(0.927 0.019 93.7)` (papier-2)
- `--muted-foreground`: `oklch(0.481 0.022 93.9)` (`#625e50`)
- `--primary` / `--brand`: `oklch(0.575 0.206 33.9)` (orange `#d73202`)
- `--ring`: `oklch(0.187 0.010 88.8)` (encre)
- Table colors: `--tbl-green`, `--tbl-blue`, `--tbl-red`, `--tbl-yellow`, `--tbl-gray`

---

## État actuel des 3 parties à refondre

### 1. Catalogue des tables — `src/components/sidebar/catalog-panel.tsx`
- Liste searchable et filtrable des tables du graphe.
- Chaque ligne : couleur, statut PK/erreur, nb de colonnes, menu contextuel (dupliquer, couleur, supprimer).
- Section "Démarrage rapide" avec templates QUICK_STARTERS.
- Store : `useGraphStore` (tables, validationIssues, selectedNodeId, addTable, selectNode, duplicateTable, removeTable, setTableColor, applyQuickStarter).

### 2. Canvas et nœuds — `src/components/canvas/graph-canvas.tsx`, `table-node.tsx`, `relationship-edge.tsx`
- React Flow 12 avec `TableFlowNode`, `RelationshipEdge`.
- Contrôles (zoom), MiniMap, Background dots, HealthScoreBar, mode sélection/main, FocusExitPill, CollabCursors, SmartConnectModal, RelationPopover.
- Store : `useGraphStore` (nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode, selectEdge, selectedEdgeId).

### 3. Inspecteur — `src/components/sidebar/inspector-panel.tsx`, `constraints-section.tsx`
- Onglets : Colonnes, Index, Relations, Enums.
- Edition inline des champs, énumérations, commentaires de table.
- Lecture seule si rôle `viewer` ou verrou collab.
- Store : `useGraphStore` (selectedNodeId, table, enums, renameTable, removeTable, addField, updateField, removeField, addEnum, renameEnum, removeEnum, addEnumValue, updateEnumValue, removeEnumValue, updateTableComment, duplicateTable, addIndex, removeIndex, toggleIndexUnique) + `useCollabStore` (self.role, lock).

---

## Magasins Zustand à préserver (inchangés)

Tous les stores Zustand sont préservés tels quels — seules les couches vues (JSX + classes Tailwind) sont retravaillées :

- `@/store/graph-store` — source unique de vérité (tables, fields, relations, enums, edges, nodes, validation, historique undo/redo).
- `@/store/collab-store` — rôle self, verrous de table, présence.
- `@/store/focus-store` — `focusCanvasOnly` (masquage sidebars en mode Zen).
- Aucun nouveau store n'est créé. Aucun `any`, aucune régression.



---

## Étape 1 — Catalogue des tables (Sidebar gauche)

**Objectif :** Aligner le catalogue sur le design de la TopBar (translucidité, bordures `border-border/40`, fonds `bg-background/80`, typographie cohérente).

### Fichiers concernés
- `src/components/sidebar/catalog-panel.tsx` (refonte complète du JSX + classes)
- Aucune création de fichier. Aucun store touché.

### Ajustements visuels Tailwind v4
- Conteneur aside : conserver `glass-panel shrink-0 overflow-hidden border-r backdrop-blur-md`, ajouter `bg-background/80` + `border-r border-border/40`.
- En-tête du catalogue : `flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40 bg-background/60`.
- Champ de recherche : Input `border-border/60`, `bg-background/80`, focus `ring-ring/50`.
- Filtres (chips "Tous / Sans PK / En erreur") : `rounded-full border border-border/40 px-2 py-0.5 text-xs font-medium`, actif `bg-primary text-primary-foreground`.
- Ligne de table : `flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors`, sélectionnée `bg-primary/10 border-primary/30`.
- Indicateur de couleur : `size-2 shrink-0 rounded-full` + `ring-1 ring-slate-300`.
- Badge nb colonnes : `shrink-0 rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground`.
- Statut erreur / sans PK : `text-destructive` / `text-amber-600` avec fonds `bg-destructive/10` / `bg-amber-500/15`.
- Menu contextuel : `glass-panel min-w-40 rounded-lg p-1 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md` (conserver).
- Section Démarrage rapide : boutons `size-8` avec `border border-border/40`, hover `bg-muted`, actifs `bg-primary text-primary-foreground`.

### Types / stores à préserver
- `useGraphStore` : `tables`, `validationIssues`, `selectedNodeId`, `addTable`, `selectNode`, `duplicateTable`, `removeTable`, `setTableColor`, `applyQuickStarter`.
- Types : `Table`, `FieldType`, `TableColor`, `ValidationIssue`, `ValidationSeverity`.

### Critère d'acceptation Étape 1
- `pnpm exec tsc --noEmit` → 0 erreur.
- Visuellement : catalogue cohérent avec la TopBar (mêmes bordures, fonds, blur).


---

## Étape 2 — Canvas et Nœuds de tables (React Flow central)

**Objectif :** Aligner le canvas, les nœuds et les arêtes sur le design de la TopBar (fond papier, bordures douces, nœuds translucides, arêtes cohérentes).

### Fichiers concernés
- `src/components/canvas/graph-canvas.tsx` (conteneur React Flow, contrôles, minimap, arrière-plan, mode switcher)
- `src/components/canvas/table-node.tsx` (nœud table)
- `src/components/canvas/relationship-edge.tsx` (arête de relation)
- Aucun store touché.

### Ajustements visuels Tailwind v4

#### graph-canvas.tsx
- Conteneur outer : `relative h-full w-full` conservé, ajouter `bg-background`.
- Canvas React Flow : `colorMode="light"` conservé.
- Background dots : `gap={20} size={1}` conservé, couleur via CSS variable `--border`.
- Controls (zoom) : `!bg-card border border-border/40 shadow-lg ring-1 ring-foreground/10`.
- MiniMap : `!bg-card border border-border/40 shadow-lg`.
- Mode switcher (V/H) : homogénéiser avec `bg-background/80 border-border/40`.
- HealthScoreBar : conserver, vérifier cohérence `border-border/40`.
- FocusExitPill : `backdrop-blur-md border-border/40`.

#### table-node.tsx
- Conteneur nœud : `border border-border/40 rounded-xl shadow-sm ring-1 ring-foreground/10`, fond `bg-card/90 backdrop-blur-md`.
- Sélectionné : `ring-2 ring-primary`.
- En-tête : `flex items-center gap-2 px-3 py-2 border-b border-border/60`, nom `font-medium text-foreground`, accent via `getTableColorTheme`.
- Barre d'outils flottante : `backdrop-blur-md border-border/40`.
- Lignes de champs : `flex items-center gap-1.5 px-3 py-1.5 text-xs`, hover `hover:bg-muted/50`, erreur `bg-destructive/10`, warning `bg-amber-500/10`.
- Handles : `!bg-slate-400 !border-slate-500` conservé.
- Animations `node-enter` et `field-flash` conservées.

#### relationship-edge.tsx
- Couleur de trait : garder `stroke-indigo-400` (éviter régressions non demandées).
- Glow `drop-shadow` conservé.
- États selected / hovered : bordures `border-border/40`.

### Types / stores à préserver
- `useGraphStore` : `nodes`, `edges`, `onNodesChange`, `onEdgesChange`, `onConnect`, `selectNode`, `selectEdge`, `selectedEdgeId`.
- Types : `TableFlowNode`, `Table`, `Field`, `Relation`, `GRAPH_NODE_TYPE`, `GRAPH_EDGE_TYPE`.

### Critère d'acceptation Étape 2
- `pnpm exec tsc --noEmit` → 0 erreur.
- Visuellement : canvas, nœuds et arêtes cohérents avec la TopBar (bordures `border-border/40`, fonds translucides, blur).


---

## Étape 3 — Inspecteur de table et d'enums (Sidebar droite)

**Objectif :** Aligner l'inspecteur (colonnes, index, relations, énumérations) sur le design de la TopBar.

### Fichiers concernés
- `src/components/sidebar/inspector-panel.tsx` (conteneur + onglets + sections)
- `src/components/sidebar/constraints-section.tsx` (index + relations)
- Aucun store touché.

### Ajustements visuels Tailwind v4

#### inspector-panel.tsx
- Conteneur aside : `glass-panel shrink-0 overflow-hidden border-l backdrop-blur-md`, ajouter `bg-background/80` + `border-l border-border/40`.
- En-tête (table sélectionnée) : `flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-background/60`, nom `font-semibold text-foreground`, couleur via `getTableColorTheme`.
- Aucun sélectionné : état vide `p-6 text-center` avec `text-muted-foreground`, icône `Database` ou `Table2`.
- Onglets (Tabs) : `TabsList` `flex gap-1 border-b border-border/40`, `TabsTrigger` `text-xs font-medium text-muted-foreground hover:text-foreground`, actif `text-primary`.
- Section de champ : `flex items-center gap-2 px-3 py-2 border-b border-border/60`, nom `font-mono text-xs`, type `text-muted-foreground`.
- Boutons d'action : `size-7 shrink-0 text-muted-foreground hover:text-destructive`.
- Section Enums : `space-y-2`, carte énum `rounded-lg border border-border p-2 bg-card/50 backdrop-blur-md`.
- Inputs d'édition : `h-7 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50`.
- Mode lecture seule (viewer / lock) : `opacity-60 pointer-events-none` + badge "Verrouillé".

#### constraints-section.tsx
- Select de champ : `h-7 rounded-md border border-border/60 bg-transparent px-2 text-xs outline-none focus-visible:border-ring`.
- Bouton UQ unique : actif `bg-primary/10 text-primary border-primary`, inactif `border-border text-muted-foreground hover:bg-muted`.
- Liste index / relations : `rounded-md border border-border bg-muted/30 px-2 py-1.5 text-xs`.
- Badges relation : `rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[10px] text-indigo-600` (conserver).

### Types / stores à préserver
- `useGraphStore` : `selectedNodeId`, `table`, `enums`, `renameTable`, `removeTable`, `addField`, `updateField`, `removeField`, `addEnum`, `renameEnum`, `removeEnum`, `addEnumValue`, `updateEnumValue`, `removeEnumValue`, `updateTableComment`, `duplicateTable`, `addIndex`, `removeIndex`, `toggleIndexUnique`, `relations`, `tables`, `validationIssues`.
- `useCollabStore` : `self.role`, `useTableLock`.
- Types : `Table`, `Field`, `Relation`, `EnumDefinition`, `FieldType`, `TableColor`.

### Critère d'acceptation Étape 3
- `pnpm exec tsc --noEmit` → 0 erreur.
- Visuellement : inspecteur cohérent avec la TopBar (bordures, fonds, blur, typographie).

---

## Exécution et validation

Ordre : **Étape 1 → Étape 2 → Étape 3** (séquentiel).

Après chaque étape :
1. Lancer `pnpm exec tsc --noEmit`.
2. Si 0 erreur TypeScript → passer à l'étape suivante.
3. Si erreur → corriger et relancer `tsc --noEmit` jusqu'à 0 erreur.

À la fin de l'Étape 3 : relancer une dernière fois `pnpm exec tsc --noEmit` sur l'ensemble du projet pour confirmer la compilation sans erreur de la refonte globale du Studio.
