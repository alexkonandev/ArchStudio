# Project Overview — Modelizia

## Identity

| Field | Value |
|---|---|
| **Project name** | Modelizia |
| **Repo root** | `C:\Users\zoumanji\Desktop\Coding\ArchStudio` |
| **Package name** | `modelizia` (version `0.1.0`) |
| **Package manager** | `pnpm` (pinned `11.18.0`) |
| **Framework** | Next.js 16.3.8 (App Router, Turbopack) |
| **UI library** | React 19.2.8 + shadcn/ui |
| **Styling** | Tailwind CSS v4 + `tw-animate-css`, CSS-first tokens (OkLCH) |
| **State** | Zustand (persisted) |
| **Real-time sync** | PartyKit (WebSocket) `party/server.ts`, `BroadcastChannel` fallback |
| **Canvas** | `@xyflow/react` (React Flow 12) |
| **Code editor** | Monaco Editor (client-only, local bundle) |
| **Animations** | GSAP 3 (landing), Lenis (scroll) |

> **Monorepo note**: the `modelizia-landing/` folder is an alternate landing copy, not the main app.

---

## What the product is

Modelizia is a **visual database schema designer** with real-time collaboration:

1. **Draw** tables, columns (fields), relations (one-to-one / one-to-many / many-to-many), enums on an infinite canvas (`/studio`).
2. **Validate** the graph live (PK/FK coherence, orphan FKs, duplicate names, missing PKs, empty enums).
3. **Generate** four artifacts: `schema.prisma`, `schema.sql`, `types.ts`, `schemas.ts`.
4. **Collaborate** in rooms — each room has its own persistent canvas snapshot in PartyKit storage.

---

## High-level architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js App Router + React client tree                      │
│  ├─ /                  → marketing landing page              │
│  └─ /studio            → canvas workspace (GraphCanvas)      │
│       /studio/code     → full-screen Monaco IDE              │
└──────────────────────────────────────────────────────────────┘
          │  React state / flow control
┌──────────────────────────────────────────────────────────────┐
│  Zustand stores (client, localStorage-backed)                │
│  ├─ graph-store    → tables, fields, relations, enums, edges │
│  ├─ collab-store   → room, presence, locks, comments, feed   │
│  ├─ profile-store  → username + colour (localStorage)        │
│  └─ code-workspace-store → VFS (files/tabs/symbols/)         │
└──────────────────────────────────────────────────────────────┘
          │  Domain model (single source of truth)
┌──────────────────────────────────────────────────────────────┘
┌──────────────────────┐      ┌──────────────────────────────┐
│  src/types           │      │  src/lib/engine            │
│  ├─ database.ts      │◄────►│  ├─ parser.ts              │
│  ├─ ast.ts           │      │  ├─ prisma.ts              │
│  ├─ flow.ts          │      │  ├─ sql.ts                 │
│  ├─ collab.ts        │      │  ├─ validation.ts          │
│  └─ index.ts         │      │  ├─ normalize.ts           │
│                      │      │  ├─ smart-join.ts          │
│                      │      │  ├─ health-score.ts        │
│                      │      │  └─ …                      │
└──────────────────────┘      └──────────────────────────────┘
          │  JSON payloads over the wire
┌──────────────────────────────────────────────────────────────┐
│  src/lib/collab          → transport abstraction             │
│  ├─ transport.ts         → BroadcastChannel / WebSocket /   │
│  │                       │  PartyKit / Offline factories    │
│  ├─ sync.ts              → startCollabSync, presence      │
│  ├─ graph-sync.ts        → emitGraphMutation, onGraph…      │
│  └─ party/server.ts      → PartyKit room relay + persist   │
└──────────────────────────────────────────────────────────────┘
```

**Data flow**: canvas → `graph-store` → `validateGraph` (issues) → `computeHealthScore` → generators (`compileToPrisma` / `compileToSql` / `generateCodeFiles`) → Monaco VFS → download.
## Directory structure (relevant)

| Path | Purpose |
|---|---|
| src/app/page.tsx | Landing page |
| src/app/studio/page.tsx | Canvas workspace shell |
| src/app/studio/code/page.tsx | Full-screen Monaco IDE |
| src/components/landing/* | Marketing sections |
| src/components/canvas/* | GraphCanvas, TableNode, RelationshipEdge, HealthScoreBar, AlignmentLayer, SmartConnectModal… |
| src/components/code-studio/* | Monaco editor, file tree, right sidebar |
| src/components/collab/* | Share modal, profile modal, activity feed, comment drawer, collab toolbar |
| src/components/layout/* | WorkspaceShell, WorkspacePanels |
| src/components/toolbar/* | StudioHeader (undo/redo, normalize, export, import, templates) |
| src/components/sidebar/* | CatalogPanel, InspectorPanel |
| src/components/ui/* | shadcn-style primitives |
| src/store/* | graph-store, collab-store, profile-store, code-workspace-store, focus-store |
| src/lib/engine/* | Parsers, generators, validation, normalization, health score, smart-join |
| src/lib/collab/* | Transport + sync adapter |
| src/lib/templates/* | QUICK_STARTERS (SaaS, E-commerce, Blog) |
| src/lib/monaco/* | Monaco environment (no workers) |
| party/server.ts | PartyKit room relay + persistent snapshot |
| docs/ | Documentation (this folder) |

---


## Domain model consumers

| Consumer | Role |
|---|---|
| GraphCanvas + TableNode + RelationshipEdge | Visual rendering |
| graph-store | Client state + persistence |
| src/lib/engine/prisma.ts (compileToPrisma) | Prisma schema generation |
| src/lib/engine/sql.ts (compileToSql) | PostgreSQL DDL generation |
| src/lib/engine/codegen.ts (generateCodeFiles) | types.ts + schemas.ts (VFS) |
| src/lib/engine/validation.ts (validateGraph) | Issue detection |
| src/lib/engine/health-score.ts (computeHealthScore) | 0–100 score + rank badge |
| src/lib/collab/* | Sync, presence, locks, comments, activity feed |
| party/server.ts | PartyKit room relay + durable snapshot |

---

## Validation rules (src/lib/engine/validation.ts)

| # | Rule | Severity |
|---|---|---|
| 1 | Duplicate table names | error |
| 2 | Missing primary key | warning |
| 3 | Duplicate field names | error |
| 4 | Orphan FK (FK column missing) | error |
| 5 | Enum field referencing unknown enum | error |
| 6 | PK/FK type mismatch (strict scalar equality) | error |
| 7 | Empty enum | warning |
| 8 | Duplicate enum names | error |

---

## Health score (src/lib/engine/health-score.ts)

| Rank | Label | Score |
|---|---|---|
| maitre | Maître des BDD | ≥ 90 |
| senior | Architecte Senior | ≥ 75 |
| junior | Architecte Junior | ≥ 50 |
| apprenti | Apprenti Modélisateur | < 50 |

Scoring: start at 100, subtract 15 per error, subtract 8 per warning, add up to 8 bonus for a well-structured schema (all PKs, has relations, unique fields indexed). Result clamped to [0, 100].


## Key design decisions

| Decision | Why / note |
|---|---|
| Root / is the landing page | Studio moved to /studio |
| One domain model (Table, Field, Relation, EnumDefinition in database.ts) | Single source of truth for canvas + generators |
| Transport abstraction (transport.ts) | Swap BroadcastChannel ↔ WebSocket ↔ PartyKit via env vars |
| Persistent PartyKit storage per room | Newcomers get the latest snapshot without a peer |
| Debounced localStorage persistence | Burst writes collapse into one write |
| Validation is pure & deterministic | Same graph → same issues, order-sorted |
| Health score gamified (0–100, ranks: Apprenti → Maître) | Motivates schema quality |
| Monaco loaded client-only & local | CSP blocks CDN; Turbopack cannot bundle workers |
| No tailwind.config.ts | Tailwind v4 @theme inline + CSS variables in globals.css |
| import "@/…" path alias | tsconfig.json paths maps @ to src |
| useCollabStore outbound hook | Decouples store from transport, SSR-safe |

---

## Tech stack summary

```json
{
  "react": "19.2.8",
  "next": "16.3.8",
  "@xyflow/react": "12.12.0",
  "@monaco-editor/react": "4.7.0",
  "monaco-editor": "0.57.0",
  "zustand": "5.0.15",
  "zod": "4.6.6",
  "partykit": "^0.0.115",
  "partysocket": "^1.3.0",
  "@base-ui/react": "1.8.0",
  "tailwind-merge": "3.7.0",
  "clsx": "2.1.1",
  "class-variance-authority": "0.7.1",
  "framer-motion": "14.4.0",
  "gsap": "3.15.0",
  "lenis": "1.3.27",
  "html-to-image": "1.11.13",
  "jszip": "3.10.2",
  "@vercel/analytics": "2.0.1"
}
```

---

## Core domain types (src/types/database.ts)

```ts
export interface Table {
  id: string;
  name: string;
  fields: Field[];
  indexes?: TableIndex[];
  position: { x: number; y: number };
  comment?: string;
  color?: TableColor;
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  enumName?: string;
  defaultValue: string;
  isUpdatedAt: boolean;
  isUnique: boolean;
  isNullable: boolean;
  nullable: boolean;
  unique: boolean;
  isPrimaryKey: boolean;
  isList?: boolean;
  comment?: string;
}

export interface Relation {
  id: string;
  name?: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  fromTableId: string;
  toTableId: string;
  fromFieldId?: string;
  onDelete?: RelationCascade;
  onUpdate?: RelationCascade;
}

export interface EnumDefinition {
  id: string;
  name: string;
  values: string[];
}
```

