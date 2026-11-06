# Project Audit — Modelizia

> Last audited: 2026-10-22. Scope: static source tree (excluding `node_modules`, `.next`, `.git`).

---

## 1. Release & dependency inventory

| Category | Package / tool | Version | Role |
|---|---|---|---|
| Runtime | `react` | 19.2.8 | UI |
| Runtime | `react-dom` | 19.2.8 | UI |
| Framework | `next` | 16.3.8 | App router, SSR/SSG, Turbopack |
| Canvas | `@xyflow/react` | 12.12.0 | React Flow (nodes, edges, minimap, controls) |
| Editor | `@monaco-editor/react` | 4.7.0 | Monaco wrapper |
| Editor | `monaco-editor` | 0.57.0 | Local Monaco bundle (CSP-hardened) |
| State | `zustand` | 5.0.15 | Client stores |
| Schema | `zod` | 4.6.6 | Validation / parsing |
| Server | `partykit` | ^0.0.115 | Real-time server |
| Client–server | `partysocket` | ^1.3.0 | WebSocket client for PartyKit |
| UI primitives | `@base-ui/react` | 1.8.0 | Unstyled accessible primitives |
| UI utilities | `class-variance-authority` | ^0.7.1 | Button/component variants |
| UI utilities | `tailwind-merge` | ^3.7.0 | Merge Tailwind classes |
| UI utilities | `cn` | ^0.4.0 | Utility (rebased from clsx) |
| Animations | `framer-motion` | ^14.4.0 | Animation primitives |
| Animations | `gsap` | ^3.15.0 | Landing scroll/cursor animations |
| Animations | `lenis` | ^1.3.27 | Smooth scroll |
| Export | `html-to-image` | ^1.11.13 | Canvas / DOM → PNG |
| Export | `jszip` | ^3.10.2 | Multi-file download bundles |
| Analytics | `@vercel/analytics` | ^2.0.1 | Vercel analytics |
| Dev | `concurrently` | ^10.0.6 | `dev` script (Next + PartyKit) |
| Dev | `eslint` | ^9 | Linting |
| Dev | `typescript` | ^5 | TS |
| Dev | `tailwindcss` | ^4 | Tailwind v4 |
| Dev | `@tailwindcss/postcss` | ^4 | PostCSS for Tailwind v4 |


## Validation engine audit

### Rules implemented (`src/lib/engine/validation.ts`)

| # | Rule | Severity |
|---|---|---|
| 1 | Duplicate table names (exact match) | error |
| 2 | Table without primary key | warning |
| 3 | Duplicate field names | error |
| 4 | Orphan foreign key (FK column missing) | error |
| 5 | Enum field referencing unknown enum | error |
| 6 | PK/FK type coherence (strict scalar + enum ref) | error |
| 7 | Empty enum | warning |
| 8 | Duplicate enum names | error |

### Health scoring (`src/lib/engine/health-score.ts`)

- **Penalties**: 15 per error, 8 per warning.
- **Bonuses (only if error-free)**:
  - +2: every table has a primary key.
  - +2: at least one relation is modelled.
  - +4: every unique non-PK field is covered by a unique index.
- **Ranks**: Maître des BDD (≥90), Architecte Senior (≥75), Architecte Junior (≥50), Apprenti Modélisateur (<50).

### Gaps / recommendations

- **No many-to-many cycle detection**: A→B→C→A is not validated. Recommendation: add reachability/cycle check.
- **No reserved-name detection**: `type`, `id`, `table` are not flagged. Prisma reserves `type` for enums — could produce generator conflicts.
- **Locale consistency**: validation messages are in French (consistent with the UI). No i18n yet.

---

## Code generation audit

| File | Export | Output |
|---|---|---|
| `src/lib/engine/prisma.ts` | `compileToPrisma` | `schema.prisma` (datasource, models, enums) |
| `src/lib/engine/sql.ts` | `compileToSql` | PostgreSQL DDL |
| `src/lib/engine/codegen.ts` | `generateCodeFiles` | `types.ts`, `schemas.ts` (VFS) |

### Key behaviours

- **Prisma generation** (`prisma.ts`):
  - Default provider: `postgresql`; default env var: `DATABASE_URL`.
  - Scalar type map: `UUID → String`, `Json → Json`, etc.
  - Enums emitted only if `field.type === "Enum"` and the enum exists.
  - `@default(...)`, `@updatedAt`, `@unique` applied from flags.
- **SQL generation** (`sql.ts`):
  - Postgres-flavoured DDL with quoted identifiers.
  - `DEFAULT` mappings: `autoincrement()` → `GENERATED ALWAYS AS IDENTITY`, `now()` → `NOW()`.
  - FK constraints include `ON DELETE` if set.
- **`codegen.ts`**: VFS generation for Monaco; supports `provider`, `urlEnv`, `includeZod`, `includeTypeScript`, `autoFormatOnSave`. Dirty-file protection keeps manual edits.


## Parsing & import audit

| File | Export | Input |
|---|---|---|
| `src/lib/engine/parser.ts` | `parsePrismaSchema` | Prisma `schema.prisma` |
| `src/lib/engine/sql-parser.ts` | `parseSqlSchema` | PostgreSQL DDL |

### Prisma parser (`parser.ts`)

- Extracts `model` and `enum` blocks.
- Handles `@id`, `@unique`, `@updatedAt`, `@default(...)`, optional `?`, list `[]`, enum references.
- Auto-detects relations by scanning `model` references to other models.
- **Limitations**: does not parse `@@index`, `@@map`, or `@@ignore` directives.

### SQL parser (`sql-parser.ts`)

- Tokenises `CREATE TABLE` statements; handles quoted identifiers, PK/UNIQUE/NOT NULL/DEFAULT/REFERENCES.
- Auto-detects relations from `FOREIGN KEY` clauses.
- **Limitations**:
  - Supports only a subset of PostgreSQL DDL (no multi-column PK, no `CHECK`, no `GENERATED ... AS IDENTITY` expansion).
  - Does not parse `CREATE TYPE ... AS ENUM` for enum extraction.

### Recommendations

- Add unit tests for parser rules (round-trip parser → schema → generator).
- Add `@@map` / `@@unique` / `@@index` in Prisma parser.
- Add `CREATE TYPE ... AS ENUM` support in SQL parser.
- Add `parseAndValidateSchema` convenience (parser → validateGraph).

---

## Real-time collaboration audit

### Transport (`src/lib/collab/transport.ts`)

| Mode | Trigger | Wire |
|---|---|---|
| `broadcast` | Local dev (no env) | `BroadcastChannel` |
| `websocket` | `NEXT_PUBLIC_COLLAB_WS_URL` | `${WS_URL}?room=<roomId>` |
| `partykit` | `NEXT_PUBLIC_PARTYKIT_HOST` | PartySocket → `wss(s)://<host>/parties/main/<roomId>` |
| `offline` | SSR / no wire | No-op |

### Protocol

- Envelope: `{ v: 1, topic: "collab" | "graph" | "cursor", senderId: string, payload: unknown }`.
- `graph` topic: `GRAPH_MUTATION` (`tables`, `relations`, `enums`).
- `collab` topic: `presence`, `sync_request`, `sync_state`, `comment`, `resolve`, `activity`, `lock`, `role`, `bye`.

### PartyKit server (`party/server.ts`)

- One room per `roomId` (`/parties/main/<roomId>`).
- Responsibilities: relay, persist latest snapshot per room, catch-up for newcomers.
- **Observations**: serialise persist queue; failed writes preserve previous snapshot; no server-side reconnection logic.

### Sync adapter (`src/lib/collab/sync.ts`)

- `startCollabSync` wires the store's outbound hook, presence heartbeat, staleness pruning, late-joiner catch-up.
- Retries `sync_request` at 700ms and 2000ms.


## Performance & bundle audit

| Chunk | Size (estimated) | Contents |
|---|---|---|
| Next.js app router | ~150–250 KB | Pages, layouts, server components (treeshaken) |
| `monaco-editor` | ~1–2 MB | Langs, utils (main thread) |
| `@xyflow/react` | ~300–500 KB | Flow renderer + styles |
| `react`, `react-dom` | ~100–150 KB | Core React |
| `zustand` | ~10 KB | State |
| `gsap` | ~300 KB | Landing animations |
| `framer-motion` | ~350 KB | Indirect (shadcn) |
| `html-to-image` + `jszip` | ~200 KB | Export |
| `monaco-editor` workers | ~100 KB | Disabled (main-thread fallback) |

> **Note**: Exact sizes depend on the npm cache and build output. The audit is qualitative.

### Observations

- **Optimization**: `next/font` is not configured (CSS-only font stack). A review could add it.
- **Unused**: none detected.
- **CSS**: `globals.css` uses `@theme inline` (Tailwind v4), avoiding the config file. `landing.css` scoped under `.landing`.
- **`node_modules`**: large (~50–80 MB). `pnpm` hoisting keeps disk usage reasonable.

---

## Accessibility & UX audit

| Area | Findings |
|---|---|
| Keyboard | Modal dialogs, menus, and inputs are `tabindex`-aware; focus-visible rings applied. |
| Screen readers | ARIA labels on buttons, `aria-pressed`, `aria-expanded`, `aria-disabled`, `role="progressbar"`, `aria-valuenow` on health bar. |
| Focus management | Modal dialogs toggle `open`/`onOpenChange`; focus trap handled by shadcn `Sheet`/`Dialog`. |
| Reduced motion | `prefers-reduced-motion: reduce` disables all keyframe animations (landing and canvas). |
| Colour contrast | Pastel colours pass for badge/panel backgrounds; dark mode uses `oklch` tokens. |
| Responsive | Landing nav collapses to mobile menu; canvas panels hide in `focusCanvasOnly` mode. |
| **Gap** | No `lang` attribute on `<html>`; this is a missing metadata item. |

---

## Security & hardening audit

### CSP (`next.config.ts`)

| Directive | Value | Notes |
|---|---|---|
| `default-src` | `'self'` | Fallback (Tailwind may need this) |
| `script-src` | `'self' 'unsafe-inline' [IS_DEV ? 'unsafe-eval' : ''] + `https://va.vercel-scripts.com` | Next.js bootstrap requires inline; Vercel analytics |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind runtime inline styles |
| `img-src` | `'self' blob: data:` | PNG export |
| `font-src` | `'self' data:` | System fonts |
| `connect-src` | `'self' [IS_DEV ? `ws:` : ``] + collabOrigin + partykitOrigin | WebSocket/PartyKit |
| `worker-src` | `'self' blob:` | Monaco main-thread fallback |
| `object-src` | `'none'` | Blocks `<object>` |
| `frame-ancestors` | `'none'` | Clickjacking |
| `X-Frame-Options` | `DENY` | Explicit header |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HSTS |

### Findings

- **No secrets in repo**: `.env.local` contains only `NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999`.

### Refactoring candidates

- **Deprecate legacy aliases**: rename `nullable` → `isNullable`, `unique` → `isUnique` across `graph-store.ts`, `normalize.ts`, `prisma.ts`, `sql.ts`, `codegen.ts`, `parser.ts`, `sql-parser.ts`. Mechanical search/replace + tests.
- **Add many-to-many cycle detection**: graph reachability check would improve robustness.
- **Add test suite**: `pnpm test` (jest/vitest for unit + Playwright for integration).
- **Add `next/font`**: replace the CSS-only font stack with `next/font` (system fonts are fine, but a review is warranted).

---

## Summary

| Dimension | Verdict |
|---|---|
| Architecture | ✅ Clear separation: App Router + Zustand + React Flow + generators + transport |
| Maintainability | ⚠️ No tests; legacy aliases in domain model; high churn risk |
| Performance | ✅ Debounced persistence, memoised selectors, CSP-hardened |
| Security | ✅ CSP, HSTS, no secrets, validation guards |
| Accessibility | ⚠️ Good basics (aria labels, focus rings); missing `lang` attribute |
| Code quality | ✅ Pure functions, deterministic, well-structured |
| Test coverage | ❌ **Zero** — largest gap |

**Primary recommendation**: add a test suite (unit + integration) before any major feature work. The pure engines (`validation`, `normalization`, `generators`, `parsers`) are the cheapest to test and would immediately pay off.

---

*Audit generated: 2026-10-22. Source coverage: static tree (excluding `node_modules`, `.next`, `.git`). All file paths are absolute from `C:\Users\zoumanji\Desktop\Coding\ArchStudio`.*

- `.gitignore` excludes `.env*`, `.next`, `.partykit`, `build`, `node_modules`.
- **Potential improvements**:
  - `script-src` includes `'unsafe-eval'` in dev — standard for Next.js dev, never for production.
  - `connect-src` dynamically includes `collabOrigin` — safe for a connect-src, but the server must validate room ids (it does).
  - Data validation is handled client-side only for graph payloads; `isGraphMutationPayload` guard applied before state updates.

### Recommendations

- Add `Content-Security-Policy-Report-Only` during dev/staging to detect violations before enforcing.
- Consider tightening `X-DNS-Prefetch-Control` to `on` (harmless).

---

## Test coverage audit

| Area | Tests found? |
|---|---|
| `src/lib/engine/*` (validation, normalization, generators, parsers) | **No test files** |
| `src/store/*` | **No test files** |
| UI components | **No test files** |
| `party/server.ts` | **No test files** |
| `next build` | **Passed** |

> **Conclusion**: the project relies on manual testing and `next build` success. Zero unit/integration tests are present. This is the single largest technical-debt item.

---

## Code quality & architecture review

### Strengths

- **Domain-driven design**: `src/types/database.ts` is the source of truth; generators and parsers consume/produce it.
- **Transport abstraction**: `transport.ts` + `sync.ts` decouple the store from the wire.
- **Pure functions**: `validateGraph`, `computeHealthScore`, `normalizeGraph`, `compileToPrisma`, `compileToSql` are pure and unit-testable.
- **Debounced persistence**: burst writes (dragging) collapse into one localStorage write.
- **Deterministic outputs**: validation issues sorted by id; generators produce stable output.
- **Security**: CSP, HSTS, X-Frame-Options, no secrets in repo.
- **Accessibility**: ARIA labels, focus-visible, reduced-motion support.

### Weaknesses / technical debt

| ID | Issue | Severity | Effort |
|---|---|---|---|
| T1 | No test suite (0 tests) | High | Medium |
| T2 | `Field.nullable`/`unique` legacy aliases | Medium | Low |
| T3 | PascalCase `FieldType` union (camelCase idiomatic) | Low | Low |
| T4 | Parser limitations (no `@@map`, no `CREATE TYPE AS ENUM`) | Medium | Medium |
| T5 | No reserved-keyword validation in generators | Low | Low |
| T6 | ~~`Modelizia` / `ArchStudio` branding inconsistency~~ — **résolu** (renommage appliqué) | Low | Low |
| T7 | `parts.json` in `components.json` unnecessary | Low | Low |
| T8 | No lazy loading for landing images | Low | Low |
| T9 | `monaco-editor` 0.57.0 is old (2023) | Low | Low |

- **Observations**: `joinRoom` also triggers `sync_request`; the retry logic avoids double-request.

### Collab store (`src/store/collab-store.ts`)

- Persisted via `setCollabOutbound` (register by `sync.ts`).
- Supports: room join/leave, presence, role (owner/editor/viewer), table soft-locks, comments (with resolution), activity feed (ring buffer 60).
- **Observations**: `guestUsername(n)` is deterministic; auto-name collision resolution gives the higher UUID the lower `Invité #N` slot.

---

## Code studio (Monaco IDE) audit

| File | Role |
|---|---|
| `src/components/code-studio/code-studio.tsx` | Full-screen IDE over graph AST |
| `src/components/code-studio/monaco-code-editor.tsx` | Dynamic-loaded Monaco, SSR-off |
| `src/components/code-studio/file-tree.tsx` + `right-sidebar.tsx` | VFS, outline, diagnostics |
| `src/store/code-workspace-store.ts` | VFS state (files, tabs, dirty) |

### Key behaviours

- **Dirty file protection**: manually edited files are not overwritten on regeneration.
- **Outline**: `parseOutline` extracts symbols (Prisma/SQL/TypeScript/Markdown).
- **Diagnostics**: health score + validation issues in the right sidebar.
- **Config**: provider, urlEnv, includeZod, includeTypeScript, autoFormatOnSave.

### Observations

- `next/dynamic({ ssr: false })` for Monaco is correct.
- `installMonacoEnvironment` forces main-thread workers (Turbopack cannot bundle workers).
- CSP hardening (`next.config.ts`) blocks CDN Monaco — the local bundle is mandatory.


### Observations

- `sanitizeIdentifier` trims and keeps `[A-Za-z0-9_]`, prefixes digits — **not** a full reserved-word validator. Users can produce identifiers that collide with Prisma SQL/Prisma reserved words.
- `prisma.ts` and `sql.ts` both map `UUID` consistently (Prisma→String, SQL→UUID). No conflict.


> **Tooling note**: `packageManager: "pnpm@11.18.0"` is pinned in `package.json`. `concurrently` runs Next.js and PartyKit together.

---

## 2. Data model audit

| File | Primary exports |
|---|---|
| `src/types/database.ts` | `Table`, `Field`, `Relation`, `EnumDefinition`, `ValidationIssue` |
| `src/types/ast.ts` | `SchemaAst`, `CompileResult`, `DatabaseProvider` |
| `src/types/flow.ts` | `TableFlowNode` (React Flow `Node` typed) |
| `src/types/collab.ts` | `CollabUser`, `CollabRole`, `Comment`, `ActivityEntry`, etc. |

**Observations:**
- The domain model is **framework-agnostic**: consumed by React Flow, Prisma/SQL generators, and validation. This is the correct single-source-of-truth pattern.
- `Field` carries **five** inter-related boolean flags: `isUnique`, `isNullable`, `nullable`, `unique`, `isPrimaryKey`. The `nullable`/`unique` aliases are legacy and must stay in sync — a **code-smell** that invites drift.
- `Relation` models a **directed** edge (`fromTableId` → `toTableId`) with optional `fromFieldId`. The `many-to-many` type is **not** materialized (logically a join table) — correct but should be documented.
