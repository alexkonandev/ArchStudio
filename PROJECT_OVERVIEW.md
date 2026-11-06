# Modelizia — PROJECT_OVERVIEW.md

Ce document résume le contexte d'architecture de **Modelizia** (éditeur visuel de schémas de bases de données, "graph-first"). Il a été généré à partir des sources du projet (`src/types/`) et de la stack déclarée dans `package.json`.

## 1. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js (App Router) | 16.3.8 |
| UI | React | 19.2.8 |
| Typage | TypeScript | ^5 |
| CSS | Tailwind CSS | ^4 |
| Package manager | pnpm | 11.18.0 |
| Canvas de diagramme | @xyflow/react (React Flow) | ^12.12.0 |
| Éditeur de code | monaco-editor / @monaco-editor/react | ^0.57.0 / ^4.7.0 |
| Gestion d'état | zustand | ^5.0.15 |
| Validation / schéma | zod | ^4.6.6 |
| Animations | framer-motion, gsap | ^14.4.0, ^3.15.0 |
| Collaboration temps réel | PartyKit + partysocket | ^0.0.115 / ^1.3.0 |
| Analytics | @vercel/analytics | ^2.0.1 |
| Utilitaires | class-variance-authority, clsx, cn, tailwind-merge, tw-animate-css, lenis, lucide-react, shadcn, jszip, html-to-image | — |
| Lint / Build | eslint, eslint-config-next, concurrently | — |

Scripts principaux : `dev` (Next + PartyKit), `build` (next build), `start`, `lint`, `party:dev`.

## 2. Domaine métier — `src/types/database.ts`

Source de vérité du graphe de schéma, agnostique du framework, consommée par le canvas React Flow et les moteurs de codegen (Prisma / SQL DDL).

- **`Field`** : colonne d'une table (id, name, type, defaultValue, isUpdatedAt, isUnique, isNullable, isPrimaryKey, isList?, comment…). `FieldType` est un sous-ensemble des scalaires Prisma (`String`, `Int`, `BigInt`, `Float`, `Decimal`, `Boolean`, `DateTime`, `Date`, `Json`, `Bytes`, `UUID`, `Enum`).
- **`Table`** : node de canvas (id, name, fields[], indexes?, position {x, y}, comment?, color?).
- **`TableIndex`** : id, name?, fieldIds[], unique.
- **`Relation`** : relation dirigée entre deux tables (`one-to-one` / `one-to-many` / `many-to-many`), avec fromTableId/toTableId, fromFieldId?, onDelete/onUpdate (CASCADE, RESTRICT, SET_NULL, SET_DEFAULT, NO_ACTION).
- **`EnumDefinition`** / `EnumDef` : id, name, values[].
- **`ValidationIssue`** / `ValidationSeverity` : rapport d'intégrité déterministe du graphe (error | warning).
- Constantes : `FIELD_TYPES`, `TABLE_COLORS` (emerald, indigo, rose, amber, slate), `DEFAULT_TABLE_COLOR = "slate"`.

## 3. AST sérialisable — `src/types/ast.ts`

Instantané sérialisable du graphe — entrée des moteurs de codegen (schéma Prisma et DDL SQL).

- **`SchemaAst`** : version (1), datasource? (provider: DatabaseProvider, urlEnv?), tables[], relations[], enums[].
- **`DatabaseProvider`** : `postgresql` | `mysql` | `sqlite` | `cockroachdb` | `sqlserver`.
- **`CompileResult`** : artefact généré (`language: "prisma" | "sql"`, filename, content).

## 4. Intégration React Flow — `src/types/flow.ts`

- **`TableNodeData`** : `{ tableId: string }` — payload d'un node table sur le canvas.
- **`TableFlowNode`** : `Node<TableNodeData, "table">` — node React Flow typé.

## 5. Isolation UI & Design System

- **Landing Page** : Design system isolé ("Editorial Tech") scopé sous la classe CSS `.mdz` dans `landing.css` (polices Geist / Instrument Serif). Aucune dépendance aux tokens Tailwind globaux.
- **Studio App** : Développé sous Next.js 16, Tailwind CSS v4, Base UI, Shadcn UI, et React Flow (@xyflow/react).

## 6. Collaboration & gouvernance — `src/types/collab.ts`

Modèle partagé par le store de collaboration, l'adaptateur de transport (BroadcastChannel / WebSocket) et les composants UI collab-aware (via PartyKit).

- **`CollabRole`** : `owner` | `editor` | `viewer` (RBAC).
- **`ConnectionStatus`** : `connected` | `connecting` | `disconnected`.
- **`CollabUser`** : id, name, avatarColor (hex), role, lastActivity (epoch ms).
- **`TableLock`** : verrou d'édition doux sur une table (tableId, userId, userName, timestamp).
- **`Comment`** : commentaire filé ancré à une table (id, tableId, authorId, authorName, text, createdAt, resolved).
- **`ActivityEntry`** : entrée du fil d'activité live (kind: join | leave | create | delete | rename | field | normalize | comment | lock | role).
- **`CollabMessage`** : protocole wire publié sur le transport (presence, bye, lock, comment, resolve, activity, role, sync_request, sync_state).
- **`CursorSyncMessage`** : présence curseur (hello | cursor | bye), coordonnées viewport normalisées (0..1).
- Constantes : `AVATAR_COLORS` (pastels), `LOCK_TTL_MS = 20_000`, `PRESENCE_HEARTBEAT_MS = 2_500`, `PRESENCE_STALE_MS = 9_000`.

## 7. Point d'entrée des types — `src/types/index.ts`

Ré-export agrégé : `export *` de `./database`, `./ast`, `./flow`, `./collab`.

## 8. Fichiers de configuration inclus

- `package.json` : manifest du projet (dépendances, scripts, packageManager pnpm).
- `tsconfig.json` : compilation TypeScript (strict, ES2017, moduleResolution bundler, paths `@/*` → `./src/*`).
- `next.config.ts` : configuration Next.js (CSP, headers de sécurité, `poweredByHeader: false`, relais de collaboration PartyKit).

## 9. Contenu de l'archive `modelizia-context.zip`

```
package.json
tsconfig.json
next.config.ts
PROJECT_OVERVIEW.md
src/types/
  database.ts
  ast.ts
  flow.ts
  collab.ts
  index.ts
```

Exclusions strictes appliquées : `node_modules/`, `.next/`, `.git/`, dossiers de build, caches et assets médias (images/vidéos).

---

*Généré automatiquement à partir des types sources et de la stack du projet ArchStudio (Modelizia).*
