import type { EnumDefinition, Field, Relation, SchemaAst, Table } from "@/types";
import { lowerFirst, sanitizeIdentifier } from "../shared";
import type { CodeFile } from "./types";

const PRISMA_TYPE_MAP: Record<Exclude<Field["type"], "Enum">, string> = {
  Int: "Int",
  BigInt: "BigInt",
  String: "String",
  Boolean: "Boolean",
  Float: "Float",
  Decimal: "Decimal",
  DateTime: "DateTime",
  Date: "DateTime",
  Json: "Json",
  Bytes: "Bytes",
  UUID: "String",
};

/** Prisma-safe enum value: UPPER_SNAKE, fallback to sanitized identifier. */
const sanitizeEnumValue = (value: string): string => {
  const cleaned =
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "VALUE";
  return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned;
};

/** Normalize a raw default input into a Prisma `@default(...)` expression. */
const formatPrismaDefault = (raw: string): string | null => {
  const value = raw.trim();
  if (value === "") return null;
  if (/^[a-zA-Z_][a-zA-Z0-9_]*\(.*\)$/.test(value)) return `@default(${value})`;
  if (value === "autoincrement" || value === "now" || value === "uuid")
    return `@default(${value}())`;
  if (value === "cuid") return "@default(cuid())";
  if (/^(true|false|-?\d+(\.\d+)?)$/.test(value)) return `@default(${value})`;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  )
    return `@default(${value})`;
  return `@default("${value.replace(/"/g, '\\"')}")`;
};

const prismaFieldType = (field: Field, enums: EnumDefinition[]): string => {
  if (field.type === "Enum") {
    const ref = (field.enumName ?? "").trim();
    const known = enums.some((e) => e.name === ref);
    return known && ref !== "" ? sanitizeIdentifier(ref) : "String";
  }
  return PRISMA_TYPE_MAP[field.type];
};

const formatScalarField = (table: Table, field: Field, enums: EnumDefinition[]): string => {
  const base = prismaFieldType(field, enums);
  const listSuffix = field.isList ? "[]" : "";
  const optional = field.isNullable && !field.isList ? "?" : "";
  const modifiers: string[] = [];
  if (field.isPrimaryKey) modifiers.push("@id");
  const defaultDirective = formatPrismaDefault(field.defaultValue);
  if (defaultDirective) modifiers.push(defaultDirective);
  if (field.isUpdatedAt) modifiers.push("@updatedAt");
  if (field.isUnique && !field.isPrimaryKey) modifiers.push("@unique");
  const comment = field.comment?.trim();
  const doc = comment ? `  /// ${comment}\n` : "";
  return `${doc}  ${sanitizeIdentifier(field.name)} ${base}${listSuffix}${optional}${
    modifiers.length > 0 ? ` ${modifiers.join(" ")}` : ""
  }`;
};

interface InverseSide {
  fieldName: string;
  model: Table;
}

const collectInverseRelations = (ast: SchemaAst, tableId: string): InverseSide[] =>
  ast.relations
    .filter((rel) => rel.toTableId === tableId)
    .map((rel) => {
      const model = ast.tables.find((t) => t.id === rel.fromTableId);
      if (!model) return null;
      return { fieldName: lowerFirst(model.name), model };
    })
    .filter((side): side is InverseSide => side !== null);

const formatForwardRelation = (from: Table, to: Table, rel: Relation): string => {
  const fk =
    from.fields.find((f) => f.id === rel.fromFieldId)?.name ??
    `${lowerFirst(to.name)}Id`;
  const onDelete = rel.onDelete ? `, onDelete: ${rel.onDelete}` : "";
  const refField = to.fields.find((f) => f.isPrimaryKey)?.name ?? "id";
  return `${lowerFirst(to.name)} ${to.name} @relation(fields: [${fk}], references: [${refField}]${onDelete})`;
};

/** Emit `@@index` / `@@unique` block attributes for a table's composite indexes. */
const formatTableIndexes = (table: Table): string[] => {
  if (!table.indexes || table.indexes.length === 0) return [];
  const lines: string[] = [];
  for (const index of table.indexes) {
    const cols = index.fieldIds
      .map((id) => table.fields.find((f) => f.id === id))
      .filter((f): f is Field => f !== undefined)
      .map((f) => sanitizeIdentifier(f.name));
    if (cols.length === 0) continue;
    const attr = index.unique ? "@@unique" : "@@index";
    const name = index.name ? `(map: "${index.name}")` : "";
    lines.push(`  ${attr}([${cols.join(", ")}]${name})`);
  }
  return lines;
};

/**
 * Compile the graph AST into a formatted, production-ready `schema.prisma`
 * document. Includes datasource/generator blocks, models with scalar fields,
 * inverse + forward relations, enum blocks, table/field comments and composite
 * indexes. Pure function -> easy to unit-test.
 */
export function generatePrisma(ast: SchemaAst): string {
  const provider = ast.datasource?.provider ?? "postgresql";
  const urlEnv = ast.datasource?.urlEnv ?? "DATABASE_URL";
  const lines: string[] = [
    "datasource db {",
    `  provider = "${provider}"`,
    `  url      = env("${urlEnv}")`,
    "}",
    "",
    "generator client {",
    '  provider = "prisma-client-js"',
    "}",
    "",
  ];

  for (const table of ast.tables) {
    const tableComment = table.comment?.trim();
    if (tableComment) lines.push(`/// ${tableComment}`);
    lines.push(`model ${sanitizeIdentifier(table.name)} {`);
    for (const field of table.fields) {
      lines.push(formatScalarField(table, field, ast.enums));
    }
    for (const inverse of collectInverseRelations(ast, table.id)) {
      lines.push(`  ${inverse.fieldName} ${inverse.model.name}[]`);
    }
    for (const rel of ast.relations.filter((r) => r.fromTableId === table.id)) {
      const target = ast.tables.find((t) => t.id === rel.toTableId);
      if (target) lines.push(`  ${formatForwardRelation(table, target, rel)}`);
    }
    lines.push(...formatTableIndexes(table));
    lines.push("}");
    lines.push("");
  }

  for (const item of ast.enums) {
    lines.push(`enum ${sanitizeIdentifier(item.name)} {`);
    for (const value of item.values) {
      lines.push(`  ${sanitizeEnumValue(value)}`);
    }
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

/** Build the `schema.prisma` virtual file for the Code Studio tree. */
export function prismaCodeFile(ast: SchemaAst): CodeFile {
  return {
    id: "prisma",
    kind: "prisma",
    filename: "schema.prisma",
    label: "Prisma",
    language: "prisma",
    content: generatePrisma(ast),
  };
}

