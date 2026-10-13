import type { EnumDefinition, Field, SchemaAst } from "@/types";
import { sanitizeIdentifier } from "./shared";

const SQL_TYPE_MAP: Record<Exclude<Field["type"], "Enum">, string> = {
  Int: "INTEGER",
  BigInt: "BIGINT",
  String: "TEXT",
  Boolean: "BOOLEAN",
  Float: "DOUBLE PRECISION",
  Decimal: "NUMERIC",
  DateTime: "TIMESTAMP",
  Date: "DATE",
  Json: "JSONB",
  Bytes: "BYTEA",
  UUID: "UUID",
};

const DEFAULT_MAP: Record<string, string> = {
  "autoincrement()": "GENERATED ALWAYS AS IDENTITY",
  autoincrement: "GENERATED ALWAYS AS IDENTITY",
  "now()": "NOW()",
  now: "NOW()",
  "uuid()": "gen_random_uuid()",
  uuid: "gen_random_uuid()",
  "cuid()": "gen_random_uuid()",
  cuid: "gen_random_uuid()",
};

/** Normalize a raw default input into a Postgres `DEFAULT ...` clause. */
const formatSqlDefault = (raw: string): string | null => {
  const value = raw.trim();
  if (value === "") return null;
  const mapped = DEFAULT_MAP[value];
  if (mapped) return `DEFAULT ${mapped}`;
  if (/^(true|false)$/i.test(value)) return `DEFAULT ${value.toUpperCase()}`;
  if (/^-?\d+(\.\d+)?$/.test(value)) return `DEFAULT ${value}`;
  if (value.startsWith("'") && value.endsWith("'")) return `DEFAULT ${value}`;
  if (value.startsWith('"') && value.endsWith('"'))
    return `DEFAULT '${value.slice(1, -1).replace(/'/g, "''")}'`;
  if (/^[a-zA-Z_][a-zA-Z0-9_]*\(.*\)$/.test(value)) return `DEFAULT ${value}`;
  return `DEFAULT '${value.replace(/'/g, "''")}'`;
};

const sqlColumnType = (field: Field, enums: EnumDefinition[]): string => {
  if (field.type === "Enum") {
    const ref = (field.enumName ?? "").trim();
    const known = enums.some((e) => e.name === ref);
    return known && ref !== "" ? `"${sanitizeIdentifier(ref)}"` : "TEXT";
  }
  return SQL_TYPE_MAP[field.type];
};

/** Compile the graph AST into Postgres-flavoured DDL (CREATE TYPE + TABLE). */
export function compileToSql(ast: SchemaAst): string {
  const statements: string[] = [];

  for (const item of ast.enums) {
    const values = item.values
      .map((v) => `'${v.replace(/'/g, "''")}'`)
      .join(", ");
    if (values.length > 0) {
      statements.push(
        `CREATE TYPE "${sanitizeIdentifier(item.name)}" AS ENUM (${values});`,
      );
    }
  }

  for (const table of ast.tables) {
    const columns = table.fields.map((field) => {
      const parts = [
        `  "${sanitizeIdentifier(field.name)}"`,
        sqlColumnType(field, ast.enums),
      ];
      if (field.isPrimaryKey) parts.push("PRIMARY KEY");
      if (!field.isNullable && !field.isPrimaryKey) parts.push("NOT NULL");
      if (field.isUnique && !field.isPrimaryKey) parts.push("UNIQUE");
      const defaultClause = formatSqlDefault(field.defaultValue);
      if (defaultClause) parts.push(defaultClause);
      return parts.join(" ");
    });

    for (const rel of ast.relations.filter((r) => r.fromTableId === table.id)) {
      const fk = table.fields.find((f) => f.id === rel.fromFieldId);
      const target = ast.tables.find((t) => t.id === rel.toTableId);
      const targetPk =
        target?.fields.find((f) => f.isPrimaryKey)?.name ?? "id";
      if (fk && target) {
        const onDelete = rel.onDelete ? ` ON DELETE ${rel.onDelete}` : "";
        columns.push(
          `  FOREIGN KEY ("${sanitizeIdentifier(fk.name)}") REFERENCES "${sanitizeIdentifier(target.name)}" ("${sanitizeIdentifier(targetPk)}")${onDelete}`,
        );
      }
    }

    statements.push(
      `CREATE TABLE "${sanitizeIdentifier(table.name)}" (\n${columns.join(",\n")}\n);`,
    );
  }

  return statements.join("\n\n") + (statements.length > 0 ? "\n" : "");
}
