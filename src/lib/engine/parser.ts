import type { EnumDefinition, Field, FieldType, Relation, Table } from "@/types";
import { FIELD_TYPES } from "@/types";

export interface ParsedSchema {
  tables: Table[];
  relations: Relation[];
  enums: EnumDefinition[];
}

const SCALAR_SET = new Set<string>(FIELD_TYPES.filter((t) => t !== "Enum"));

export const createParseId = (prefix: string): string => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return `${prefix}_${c.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
};

export const gridPosition = (index: number): { x: number; y: number } => ({
  x: (index % 3) * 380,
  y: Math.floor(index / 3) * 360,
});

const toStoredField = (input: Omit<Field, "id"> & { id?: string }): Field => ({
  id: input.id ?? createParseId("field"),
  name: input.name,
  type: input.type,
  enumName: input.enumName,
  defaultValue: input.defaultValue ?? "",
  isUpdatedAt: input.isUpdatedAt ?? false,
  isUnique: input.isUnique,
  isNullable: input.isNullable,
  nullable: input.isNullable,
  unique: input.isUnique,
  isPrimaryKey: input.isPrimaryKey ?? false,
  isList: input.isList ?? false,
  comment: input.comment,
});

const stripPrismaComments = (code: string): string => {
  const noBlock = code.replace(/\/\*[\s\S]*?\*\//g, "");
  return noBlock
    .split("\n")
    .map((line) => {
      let s = false;
      let d = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === "'" && !d) s = !s;
        if (ch === '"' && !s) d = !d;
        if (!s && !d && ch === "/" && line[i + 1] === "/") return line.slice(0, i);
      }
      return line;
    })
    .join("\n");
};

interface Block {
  kind: "model" | "enum";
  name: string;
  body: string;
}

const extractBlocks = (code: string): Block[] => {
  const blocks: Block[] = [];
  const header = /(model|enum)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = header.exec(code)) !== null) {
    const kind = m[1] as "model" | "enum";
    const name = m[2];
    let depth = 1;
    let i = header.lastIndex;
    let s = false;
    let d = false;
    while (i < code.length && depth > 0) {
      const ch = code[i];
      if (ch === "'" && !d) s = !s;
      if (ch === '"' && !s) d = !d;
      if (!s && !d) {
        if (ch === "{") depth += 1;
        if (ch === "}") depth -= 1;
      }
      i += 1;
    }
    blocks.push({ kind, name, body: code.slice(header.lastIndex, i - 1) });
    header.lastIndex = i;
  }
  return blocks;
};
const extractDefaultInner = (rest: string): string => {
  const at = rest.indexOf("@default");
  if (at === -1) return "";
  const open = rest.indexOf("(", at);
  if (open === -1) return "";
  let depth = 0;
  let s = false;
  let d = false;
  for (let i = open; i < rest.length; i += 1) {
    const ch = rest[i];
    if (ch === "'" && !d) s = !s;
    if (ch === '"' && !s) d = !d;
    if (s || d) continue;
    if (ch === "(") depth += 1;
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) return rest.slice(open + 1, i).trim();
    }
  }
  return "";
};

const extractRelationArgs = (
  rest: string,
): { fields: string[]; name?: string; onDelete?: string; onUpdate?: string } | null => {
  const at = rest.indexOf("@relation");
  if (at === -1) return null;
  const open = rest.indexOf("(", at);
  if (open === -1) return { fields: [] };
  let depth = 0;
  let end = -1;
  for (let i = open; i < rest.length; i += 1) {
    if (rest[i] === "(") depth += 1;
    if (rest[i] === ")") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return { fields: [] };
  const inner = rest.slice(open + 1, end);
  const ff = /fields\s*:\s*\[([^\]]*)\]/.exec(inner);
  const fields = ff
    ? ff[1].split(",").map((x) => x.trim().replace(/^"|"$/g, "")).filter(Boolean)
    : [];
  const strOf = (key: string): string | undefined => {
    const q = new RegExp(`${key}\\s*:\\s*"([^"]+)"`).exec(inner);
    if (q) return q[1];
    const b = new RegExp(`${key}\\s*:\\s*([A-Za-z_][A-Za-z0-9_]*)`).exec(inner);
    return b ? b[1] : undefined;
  };
  return { fields, name: strOf("name"), onDelete: strOf("onDelete"), onUpdate: strOf("onUpdate") };
};

const mapOnAction = (raw?: string): Relation["onDelete"] | undefined => {
  if (!raw) return undefined;
  const v = raw.toUpperCase().replace(/[^A-Z_]/g, "_");
  if (v === "CASCADE" || v === "RESTRICT") return v;
  if (v === "SET_NULL" || v === "SETNULL") return "SET_NULL";
  if (v === "SET_DEFAULT" || v === "SETDEFAULT") return "SET_DEFAULT";
  if (v === "NO_ACTION" || v === "NOACTION") return "NO_ACTION";
  return undefined;
};

interface PendingRel {
  fromModel: string;
  toModel: string;
  fkNames: string[];
  name?: string;
  onDelete?: Relation["onDelete"];
  onUpdate?: Relation["onUpdate"];
}


export function parsePrismaSchema(code: string): ParsedSchema {
  const blocks = extractBlocks(stripPrismaComments(code));
  const enumBlocks = blocks.filter((b) => b.kind === "enum");
  const modelBlocks = blocks.filter((b) => b.kind === "model");
  if (blocks.length === 0) {
    throw new Error("No `model` or `enum` block found. Paste Prisma like `model User { ... }`.");
  }
  const enums: EnumDefinition[] = enumBlocks.map((b) => ({
    id: createParseId("enum"),
    name: b.name,
    values: b.body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("@@"))
      .map((l) => l.split(/\s+/)[0].replace(/,$/, ""))
      .filter(Boolean),
  }));
  const enumNames = new Set(enums.map((e) => e.name));
  const modelNames = new Set(modelBlocks.map((b) => b.name));
  const mapScalar = (base: string): FieldType | null => {
    if (SCALAR_SET.has(base)) return base as FieldType;
    if (base === "Uuid") return "UUID";
    return null;
  };
  const tables: Table[] = [];
  const pending: PendingRel[] = [];
  modelBlocks.forEach((block, ti) => {
    const fields: Field[] = [];
    for (const raw of block.body.split("\n")) {
      const line = raw.trim().replace(/,$/, "");
      if (!line || line.startsWith("@@")) continue;
      const mm = /^([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*(?:\[\])?\??)\s*(.*)$/.exec(line);
      if (!mm) continue;
      const fname = mm[1];
      const token = mm[2];
      const rest = mm[3] ?? "";
      const isList = token.includes("[]");
      const opt = token.endsWith("?");
      const base = token.replace(/\[\]/g, "").replace(/\?/g, "");
      if (!base) continue;
      if (modelNames.has(base)) {
        const args = extractRelationArgs(rest);
        if (args && args.fields.length > 0) {
          pending.push({ fromModel: block.name, toModel: base, fkNames: args.fields, name: args.name, onDelete: mapOnAction(args.onDelete), onUpdate: mapOnAction(args.onUpdate) });
        } else if (!isList) {
          pending.push({ fromModel: block.name, toModel: base, fkNames: [] });
        }
        continue;
      }
      const scalar = mapScalar(base);
      const looksEnum = !scalar && (enumNames.has(base) || /^[A-Z]/.test(base));
      const coerced: FieldType = scalar ?? (looksEnum ? "Enum" : "String");
      const isPk = /(^|\s)@id(\s|$)/.test(rest);
      fields.push(
        toStoredField({
          name: fname,
          type: coerced,
          enumName: coerced === "Enum" ? base : undefined,
          defaultValue: extractDefaultInner(rest),
          isUpdatedAt: rest.includes("@updatedAt"),
          isUnique: rest.includes("@unique"),
          isNullable: isPk ? false : isList ? true : opt,
          nullable: isPk ? false : isList ? true : opt,
          unique: rest.includes("@unique"),
          isPrimaryKey: isPk,
          isList,
          comment: !scalar && !looksEnum ? `unknown type "${base}" coerced to String` : undefined,
        }),
      );
    }
    tables.push({ id: createParseId("table"), name: block.name, position: gridPosition(ti), fields });
  });
  if (tables.length === 0) throw new Error("No `model` block with fields found.");
  const relations: Relation[] = [];
  const byName = new Map(tables.map((t) => [t.name, t]));
  const seen = new Set<string>();
  const push = (from: Table, to: Table, fkName: string | undefined, ex: Partial<Relation> = {}): void => {
    const fk = fkName ? from.fields.find((f) => f.name === fkName) : undefined;
    const key = `${from.id}->${to.id}:${fk?.id ?? fkName ?? "implicit"}`;
    if (seen.has(key)) return;
    seen.add(key);
    relations.push({
      id: createParseId("rel"),
      type: fk?.isUnique ? "one-to-one" : "one-to-many",
      fromTableId: from.id,
      toTableId: to.id,
      fromFieldId: fk?.id,
      onDelete: ex.onDelete ?? "CASCADE",
      onUpdate: ex.onUpdate,
      name: ex.name ?? `${from.name}${to.name}`,
    });
  };
  for (const p of pending) {
    const from = byName.get(p.fromModel);
    const to = byName.get(p.toModel);
    if (!from || !to || from.id === to.id) continue;
    if (p.fkNames.length === 0) {
      const guess = `${to.name.charAt(0).toLowerCase()}${to.name.slice(1)}Id`;
      const found = from.fields.find((f) => f.name === guess || f.name.toLowerCase() === guess.toLowerCase());
      if (found) push(from, to, found.name, { name: p.name, onDelete: p.onDelete, onUpdate: p.onUpdate });
      continue;
    }
    for (const fk of p.fkNames) push(from, to, fk, { name: p.name, onDelete: p.onDelete, onUpdate: p.onUpdate });
  }
  for (const from of tables) {
    for (const f of from.fields) {
      const mm = /^(.*)Id$/.exec(f.name);
      if (!mm || f.isPrimaryKey) continue;
      const target = tables.find((t) => t.name.toLowerCase() === mm[1].toLowerCase());
      if (!target || target.id === from.id) continue;
      push(from, target, f.name);
    }
  }
  return { tables, relations, enums };
}

export { parseSqlSchema } from "./sql-parser";

