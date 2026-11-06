# Modelizia — ARCHITECTURE.md

Directives d'ingénierie pour le SaaS **Modelizia**.

## 1. Nom du SaaS

Modelizia — éditeur visuel de schémas de bases de données ("graph-first").

## 2. Source de Vérité Unique

Le fichier `src/types/database.ts` est la source de vérité unique du graphe de schéma. Il est agnostique du framework et consommé par le canvas React Flow ainsi que par les moteurs de codegen (Prisma / SQL DDL).

**Règle de synchronisation obligatoire** : les alias legacy `nullable` / `isNullable` et `unique` / `isUnique` doivent obligatoirement rester synchronisés lors de toute mutation d'un champ (`Field`). Toute modification de l'un doit être répercutée sur l'autre pour éviter toute divergence d'état.

## 3. Moteurs de génération

Pipeline de génération :

```
SchemaAst (src/types/ast.ts)  →  Moteurs Codegen (Prisma / SQL)  →  CompileResult
```

- `SchemaAst` : instantané sérialisable du graphe (version, datasource, tables, relations, enums).
- Moteurs Codegen : transforment l'AST en schéma Prisma ou DDL SQL.
- `CompileResult` : artefact généré (`language: "prisma" | "sql"`, `filename`, `content`).

## 4. Isolation UI

- **Landing Page** : totalement hermétique par rapport au Studio. Scopée sous la classe CSS `.mdz` dans `landing.css` (polices Geist / Instrument Serif). Aucune dépendance aux tokens Tailwind globaux.
- **Studio App** : développé sous Next.js 16, Tailwind CSS v4, Base UI, Shadcn UI, et React Flow (@xyflow/react).

Aucune fuite de styles ni de tokens entre la Landing Page (`.mdz` / `landing.css`) et le Studio.