import type { EnumDefinition, Field, SchemaAst, Table } from "@/types";
import { sanitizeIdentifier } from "../shared";
import type { CodeFile } from "./types";

/** Map a Prisma-scalar field to its TypeScript type. */
const TS_TYPE_MAP: Record<Exclude<Field["type"], "Enum">, string> = {
  Int: "number",
  BigInt: "number",
  String: "string",
  Boolean: "boolean",
  Float: "number",
  Decimal: "number",
  DateTime: "Date",
  Date: "string",
  Json: "unknown",
  Bytes: "Uint8Array",
  UUID: "string",
};

const tsFieldType = (field: Field, enums: EnumDefinition[]): string => {
  if (field.type === "Enum") {
    const ref = (field.enumName ?? "").trim();
    const known = enums.some((e) => e.name === ref);
    return known && ref !== "" ? sanitizeIdentifier(ref) : "string";
  }
  return TS_TYPE_MAP[field.type];
};

/** Escape a raw enum value into a TS string-literal union member. */
const unionMember = (value: string): string =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** Compile enum definitions into `export type X = "A" | "B";` blocks. */
const formatEnumUnion = (item: EnumDefinition): string[] => {
  const name = sanitizeIdentifier(item.name);
  if (item.values.length === 0) return [`export type ${name} = never;`];
  const members = item.values.map(unionMember).join(" | ");
  return [`export type ${name} = ${members};`];
};

const formatInterface = (table: Table, enums: EnumDefinition[]): string[] => {
  const lines = [`export interface ${sanitizeIdentifier(table.name)} {`];
  if (table.comment?.trim()) {
    lines.unshift(`/** ${table.comment.trim()} */`);
  }
  for (const field of table.fields) {
    const base = tsFieldType(field, enums);
    const optional = field.isNullable && !field.isList ? "?" : "";
    const type = field.isList ? `${base}[]` : base;
    lines.push(`  ${sanitizeIdentifier(field.name)}${optional}: ${type};`);
  }
  lines.push("}");
  return lines;
};

/**
 * Compile the graph AST into TypeScript interfaces plus string-literal enum
 * unions. Suitable as a hand-off artifact for typed API boundaries.
 */
export function generateTypeScript(ast: SchemaAst): string {
  const lines: string[] = [
    "// GÉNÉRÉ AUTOMATIQUEMENT PAR MODELIZIA — NE PAS MODIFIER MANUELLEMENT.",
    "// Interfaces TypeScript dérivées du schéma visuel.",
    "",
  ];

  for (const item of ast.enums) {
    lines.push(...formatEnumUnion(item));
    lines.push("");
  }

  for (const table of ast.tables) {
    lines.push(...formatInterface(table, ast.enums));
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

/** Build the `types.ts` virtual file for the Code Studio tree. */
export function typescriptCodeFile(ast: SchemaAst): CodeFile {
  return {
    id: "typescript",
    kind: "typescript",
    filename: "types.ts",
    label: "TypeScript",
    language: "typescript",
    content: generateTypeScript(ast),
  };
}
