# Modelizia — L'art de concevoir vos bases de données

**Modelizia** est une application web de modélisation visuelle de bases de données : dessinez vos tables et leurs relations sur un canvas type Figma, puis générez instantanément du code **Prisma**, **SQL**, **Zod** et **TypeScript** — sans compte, sans serveur, 100 % dans le navigateur.

## Fonctionnalités

- **Canvas visuel** (React Flow) : création de tables/champs, relations cliquables, auto-layout, guides d'alignement intelligents, minimap, mode Focus plein écran.
- **Studio de code** (`/studio/code`) : IDE inspiré de VS Code avec **Monaco**, explorateur de fichiers virtuel (VFS), onglets, formatage, diagnostics cliquables et Outline.
- **Génération multi-cibles** : schéma Prisma (datasource configurable) + SQL pour **PostgreSQL, MySQL, SQLite, CockroachDB et SQL Server** + schémas **Zod** + interfaces **TypeScript**.
- **Santé du schéma** : score de santé, contrôles d'intégrité, analyse de robustesse et suggestions directement navigables.
- **Collaboration temps réel** : présence multi-onglets **et multi-PC** (curseurs, commentaires, activité, schéma) via une couche de transport abstraite — `BroadcastChannel` en démo locale, **WebSocket réseau** dès que `NEXT_PUBLIC_COLLAB_WS_URL` est défini. Profils utilisateur persistants (pseudo + couleur, modifiables depuis la topbar).
- **Import / Export** : import Prisma, SQL ou JSON ; export PNG, SVG et projet complet en ZIP.
- **UX** : light mode intégral, palette de commandes (⌘K), raccourcis clavier + cheatsheet (`?`), templates de démarrage rapide, toasts, mode Zen.

## Stack technique

| Domaine | Technologie |
| --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack) — **React 19** |
| Langage | **TypeScript** (`strict`, 0 `any`) |
| Styling | **Tailwind CSS v4**, shadcn/ui (Base UI), lucide-react |
| Canvas | **React Flow** (`@xyflow/react`) |
| Éditeur | **Monaco Editor** (`@monaco-editor/react`, bundle local, aucun CDN) |
| État | **Zustand** (stores : graphe, workspace code, collaboration, focus) |
| Validation | **Zod** |
| Build / QA | `tsc --noEmit`, ESLint 9, `next build` |

## Démarrage

Prérequis : **Node.js 20+** et **pnpm 11+**.

```bash
pnpm install   # dépendances
pnpm dev       # serveur de développement → http://localhost:3000
```

### Autres commandes

```bash
pnpm build               # build de production (Turbopack)
pnpm start               # serveur de production
pnpm lint                # ESLint (0 erreur / 0 warning attendus)
pnpm exec tsc --noEmit   # vérification TypeScript
```

### Collaboration réseau (multi-PC)

Par défaut, la synchronisation temps réel tourne en **mode démo local**
(`BroadcastChannel` : plusieurs onglets du même navigateur). Pour synchroniser
**plusieurs PC**, définissez une variable d'environnement :

```bash
# .env.local — tout client se connecte à ${URL}?room=<salle> et y relaie les enveloppes
NEXT_PUBLIC_COLLAB_WS_URL=ws://localhost:8787
# ou wss://collab.votre-domaine.com
```

Contrat serveur (Node `ws`, Socket.io, PartyKit, relais Supabase/Edge… — le
serveur n'est pas fourni) : accepter `GET <WS_URL>?room=<roomId>`, parser chaque
enveloppe JSON `{ v, topic: "collab" | "graph" | "cursor", senderId, payload }`
et la re-diffuser à tous les *autres* clients de la même salle. Le choix du
transport est centralisé dans `src/lib/collab/transport.ts` — aucun store ni
composant n'a à changer pour basculer d'un mode à l'autre.

## Routes

| Route | Description |
| --- | --- |
| `/` | Landing page Modelizia (présentation) |
| `/studio` | Studio visuel : canvas de modélisation + catalogue + inspecteur |
| `/studio/code` | Code Studio : éditeur Monaco, VFS généré, Outline / Config / Diagnostics |

## Structure du projet

```
src/
├── app/            # Routes App Router (page, studio, studio/code)
├── components/     # landing, canvas, code-studio, toolbar, sidebar, ui…
├── lib/
│   ├── engine/     # Parseurs, codegen (Prisma/SQL/Zod/TS), validation, santé
│   ├── export/     # Export PNG / SVG / ZIP
│   ├── collab/     # Transport temps réel (BroadcastChannel local / WebSocket réseau)
│   └── templates/  # Schémas de démarrage rapide
├── store/          # Stores Zustand (graphe, workspace, collab, profil, focus)
└── types/          # Modèle de domaine partagé (AST, base de données, collab)
```

## Licence

Projet privé — tous droits réservés.