import type { EnumDefinition, Field, Relation, SchemaAst, Table } from "@/types";
import { lowerFirst, sanitizeIdentifier } from "./shared";

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
  // Already a function call: autoincrement(), uuid(), now(), cuid(), dbgenerated("...").
  if (/^[a-zA-Z_][a-zA-Z0-9_]*\(.*\)$/.test(value)) return `@default(${value})`;
  // Legacy bare keywords.
  if (value === "autoincrement" || value === "now" || value === "uuid")
    return `@default(${value}())`;
  if (value === "cuid") return "@default(cuid())";
  // Booleans / numbers stay bare.
  if (/^(true|false|-?\d+(\.\d+)?)$/.test(value))
    return `@default(${value})`;
  // Quoted literal stays as-is; bare literal becomes a quoted string.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  )
    return `@default(${value})`;
  return `@default("${value.replace(/"/g, '\\"')}")`;
};

interface InverseSide {
  fieldName: string;
  model: Table;
}

/**
 * Compile the graph AST into a formatted Prisma `schema.prisma` document.
 * Pure function -> easy to unit-test.
 */
export function compileToPrisma(ast: SchemaAst): string {
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
    const inverses = collectInverseRelations(ast, table.id);
    lines.push(`model ${sanitizeIdentifier(table.name)} {`);
    for (const field of table.fields) {
      lines.push(`  ${formatScalarField(table, field, ast.enums)}`);
    }
    for (const inverse of inverses) {
      lines.push(`  ${inverse.fieldName} ${inverse.model.name}[]`);
    }
    for (const rel of ast.relations.filter((r) => r.fromTableId === table.id)) {
      const target = ast.tables.find((t) => t.id === rel.toTableId);
      if (target) lines.push(`  ${formatForwardRelation(table, target, rel)}`);
    }
    lines.push("}");
    lines.push("");
  }

  for (const item of ast.enums) {
    lines.push(...formatEnumBlock(item));
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

const formatEnumBlock = (item: EnumDefinition): string[] => {
  const lines = [`enum ${sanitizeIdentifier(item.name)} {`];
  for (const value of item.values) {
    lines.push(`  ${sanitizeEnumValue(value)}`);
  }
  lines.push("}");
  return lines;
};

const prismaFieldType = (field: Field, enums: EnumDefinition[]): string => {
  if (field.type === "Enum") {
    const ref = (field.enumName ?? "").trim();
    const known = enums.some((e) => e.name === ref);
    return known && ref !== "" ? sanitizeIdentifier(ref) : "String";
  }
  return PRISMA_TYPE_MAP[field.type];
};

const formatScalarField = (table: Table, field: Field, enums: EnumDefinition[]) => {
  const base = prismaFieldType(field, enums);
  const listSuffix = field.isList ? "[]" : "";
  const optional = field.isNullable && !field.isList ? "?" : "";
  const modifiers: string[] = [];
  if (field.isPrimaryKey) modifiers.push("@id");
  const defaultDirective = formatPrismaDefault(field.defaultValue);
  if (defaultDirective) modifiers.push(defaultDirective);
  if (field.isUpdatedAt) modifiers.push("@updatedAt");
  if (field.isUnique && !field.isPrimaryKey) modifiers.push("@unique");
  return `${sanitizeIdentifier(field.name)} ${base}${listSuffix}${optional}${
    modifiers.length > 0 ? ` ${modifiers.join(" ")}` : ""
  }`;
};

const collectInverseRelations = (
  ast: SchemaAst,
  tableId: string,
): InverseSide[] =>
  ast.relations
    .filter((rel) => rel.toTableId === tableId)
    .map((rel) => {
      const model = ast.tables.find((t) => t.id === rel.fromTableId);
      if (!model) return null;
      return { fieldName: lowerFirst(model.name), model };
    })
    .filter((side): side is InverseSide => side !== null);

/**
 * Forward relation: `author User @relation(fields: [authorId], references: [id])`.
 * Falls back to `<target>Id` FK naming for MVP.
 */
const formatForwardRelation = (
  from: Table,
  to: Table,
  rel: Relation,
): string => {
  const fk =
    from.fields.find((f) => f.id === rel.fromFieldId)?.name ??
    `${lowerFirst(to.name)}Id`;
  const onDelete = rel.onDelete ? `, onDelete: ${rel.onDelete}` : "";
  const refField = to.fields.find((f) => f.isPrimaryKey)?.name ?? "id";
  return `${lowerFirst(to.name)} ${to.name} @relation(fields: [${fk}], references: [${refField}]${onDelete})`;
};
