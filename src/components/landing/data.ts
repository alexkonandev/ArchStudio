/** Données statiques de la landing (aucun import React ici). */

export type Column = { name: string; type: string; key?: "PK" | "FK" };
export type TableDef = { id: string; x: number; y: number; color: string; cols: Column[] };

export const TABLE_W = 210;
export const HEAD_H = 34;
export const ROW_H = 26;

export const TABLES: TableDef[] = [
  { id: "users", x: 30, y: 40, color: "#26241d", cols: [{ name: "id", type: "uuid", key: "PK" }, { name: "email", type: "text" }, { name: "name", type: "text" }, { name: "created_at", type: "timestamp" }] },
  { id: "posts", x: 305, y: 70, color: "#ff4a1c", cols: [{ name: "id", type: "uuid", key: "PK" }, { name: "author_id", type: "uuid", key: "FK" }, { name: "title", type: "text" }, { name: "published", type: "boolean" }] },
  { id: "comments", x: 580, y: 30, color: "#3b5bff", cols: [{ name: "id", type: "uuid", key: "PK" }, { name: "post_id", type: "uuid", key: "FK" }, { name: "user_id", type: "uuid", key: "FK" }, { name: "body", type: "text" }] },
  { id: "profiles", x: 30, y: 290, color: "#7c4dff", cols: [{ name: "id", type: "uuid", key: "PK" }, { name: "user_id", type: "uuid", key: "FK" }, { name: "bio", type: "text" }] },
  { id: "post_tags", x: 305, y: 290, color: "#c98a1b", cols: [{ name: "post_id", type: "uuid", key: "FK" }, { name: "tag_id", type: "uuid", key: "FK" }] },
  { id: "tags", x: 580, y: 290, color: "#12a36b", cols: [{ name: "id", type: "uuid", key: "PK" }, { name: "label", type: "text" }] },
];

/** `from` porte la clé étrangère (FK), `to` la clé primaire (PK). */
export const RELATIONS = [
  { id: "posts-users", from: "posts", to: "users", d: "M305 143 C272 143 272 87 240 87", fk: [305, 143], pk: [240, 87] },
  { id: "comments-posts", from: "comments", to: "posts", d: "M580 103 C548 103 548 117 515 117", fk: [580, 103], pk: [515, 117] },
  { id: "post_tags-posts", from: "post_tags", to: "posts", d: "M410 290 L410 208", fk: [410, 290], pk: [410, 208] },
  { id: "profiles-users", from: "profiles", to: "users", d: "M135 290 L135 178", fk: [135, 290], pk: [135, 178] },
  { id: "post_tags-tags", from: "post_tags", to: "tags", d: "M515 363 C548 363 548 337 580 337", fk: [515, 363], pk: [580, 337] },
] as const;

export type Format = { id: string; label: string; file: string; code: string };

export const FORMATS: Format[] = [
  {
    id: "sql", label: "SQL", file: "schema.sql",
    code: `CREATE TABLE users (
  id         UUID PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id        UUID PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users (id),
  title     TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false
);`,
  },
  {
    id: "prisma", label: "Prisma", file: "schema.prisma",
    code: `model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        String  @id @default(uuid())
  author    User    @relation(fields: [authorId], references: [id])
  authorId  String
  title     String
  published Boolean @default(false)
}`,
  },
  {
    id: "ts", label: "TypeScript", file: "types.ts",
    code: `export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  published: boolean;
}`,
  },
  {
    id: "zod", label: "Zod", file: "schemas.ts",
    code: `import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.date(),
});

export const postSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string(),
  published: z.boolean(),
});`,
  },
];

export const PEOPLE = [
  { id: "amina", name: "Amina", color: "#ff4a1c", start: [14, 24], path: [[40, 30], [46, 58], [20, 66], [14, 24]] },
  { id: "koffi", name: "Koffi", color: "#3b5bff", start: [70, 22], path: [[58, 40], [76, 62], [84, 38], [70, 22]] },
  { id: "lea", name: "Léa", color: "#12a36b", start: [48, 78], path: [[30, 52], [52, 30], [66, 70], [48, 78]] },
] as const;

export const COLLAB_CARDS = [
  { name: "users", color: "#26241d", left: "6%", top: "12%", rows: ["id", "email", "name"] },
  { name: "posts", color: "#ff4a1c", left: "40%", top: "34%", rows: ["id", "author_id", "title"] },
  { name: "comments", color: "#3b5bff", left: "66%", top: "8%", rows: ["id", "post_id", "body"] },
];

export const ACTIVITY = [
  "Amina édite posts.title",
  "Koffi ajoute la colonne comments.body",
  "Léa relie post_tags → tags",
  "Amina renomme users.name",
];

export const POINTS = [
  { title: "Présence en direct", text: "Voyez qui est sur le schéma et ce qu'il est en train de faire." },
  { title: "Salons séparés", text: "Chaque schéma vit dans son propre salon, sans mélange entre les projets." },
  { title: "Profils", text: "Chacun est identifié sur le canvas grâce à son profil." },
];

export const NAV_LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#code", label: "Code" },
  { href: "#collaboration", label: "Collaboration" },
  { href: "#stack", label: "Stack" },
];

export const STACK_GROUPS = [
  { label: "Formats générés", items: ["SQL", "Prisma", "TypeScript", "Zod"] },
  { label: "Moteur", items: ["Parser SQL", "Générateur de code", "Validation du schéma"] },
  { label: "Éditeur & temps réel", items: ["Monaco Editor", "PartyKit"] },
  { label: "Fondations", items: ["Next.js 16", "TypeScript strict", "Tailwind CSS v4", "Zustand"] },
];

export const FACTS = [
  { value: 4, label: "formats de code générés à partir d'un seul schéma" },
  { value: 1, label: "canvas infini, partagé en temps réel" },
  { value: 2, label: "studios complémentaires : visuel sur le canvas, ou directement dans le code" },
];

export const MARQUEE_ITEMS = ["PostgreSQL", "Prisma", "TypeScript", "Zod", "Next.js", "Monaco", "PartyKit", "Zustand", "Tailwind"];
