import type { EnumDefinition, Field, SchemaAst } from "@/types";
import { sanitizeIdentifier } from "../shared";
import type { CodeFile, SqlDialect } from "./types";

/**
 * Per-dialect DDL generation. Each flavour differs in identifier quoting,
 * scalar types, identity/auto-increment, boolean & JSON handling, and how enums
 * are represented.
 */

interface DialectSpec {
  /** Wrap an identifier (table / column / type name). */
  quote: (name: string) => string;
  typeMap: Record<Exclude<Field["type"], "Enum">, string>;
  /** How a `autoincrement()` default is expressed. */
  identity: string;
  /** Boolean literal casing. */
  bool: (v: string) => string;
  /** Whether the dialect supports native ENUM types. */
  nativeEnum: boolean;
  /** Emit `CREATE TYPE ... AS ENUM` (Postgres) vs inline column type. */
  enumTypeName: (name: string) => string;
  /** Timestamp default for `now()`. */
  nowDefault: string;
  /** UUID default generator. */
  uuidDefault: string;
  /** Default ON DELETE for FK constraints. */
  trailingSemicolon: boolean;
}

const POSTGRES: DialectSpec = {
  quote: (n) => `"${n}"`,
  typeMap: {
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
  },
  identity: "GENERATED ALWAYS AS IDENTITY",
  bool: (v) => v.toUpperCase(),
  nativeEnum: true,
  enumTypeName: (n) => `"${n}"`,
  nowDefault: "NOW()",
  uuidDefault: "gen_random_uuid()",
  trailingSemicolon: true,
};

const MYSQL: DialectSpec = {
  quote: (n) => `\`${n}\``,
  typeMap: {
    Int: "INT",
    BigInt: "BIGINT",
    String: "VARCHAR(191)",
    Boolean: "TINYINT(1)",
    Float: "DOUBLE",
    Decimal: "DECIMAL(38,10)",
    DateTime: "DATETIME",
    Date: "DATE",
    Json: "JSON",
    Bytes: "BLOB",
    UUID: "CHAR(36)",
  },
  identity: "AUTO_INCREMENT",
  bool: (v) => (v.toLowerCase() === "true" ? "1" : "0"),
  nativeEnum: true,
  enumTypeName: (n) => `\`${n}\``,
  nowDefault: "CURRENT_TIMESTAMP",
  uuidDefault: "(UUID())",
  trailingSemicolon: true,
};

const SQLITE: DialectSpec = {
  quote: (n) => `"${n}"`,
  typeMap: {
    Int: "INTEGER",
    BigInt: "INTEGER",
    String: "TEXT",
    Boolean: "INTEGER",
    Float: "REAL",
    Decimal: "NUMERIC",
    DateTime: "TEXT",
    Date: "TEXT",
    Json: "TEXT",
    Bytes: "BLOB",
    UUID: "TEXT",
  },
  identity: "AUTOINCREMENT",
  bool: (v) => (v.toLowerCase() === "true" ? "1" : "0"),
  nativeEnum: false,
  enumTypeName: (n) => `"${n}"`,
  nowDefault: "CURRENT_TIMESTAMP",
  uuidDefault: "(lower(hex(randomblob(16))))",
  trailingSemicolon: true,
};

const DIALECTS: Record<SqlDialect, DialectSpec> = {
  postgresql: POSTGRES,
  mysql: MYSQL,
  sqlite: SQLITE,
};

export const SQL_DIALECTS: readonly SqlDialect[] = [
  "postgresql",
  "mysql",
  "sqlite",
];

const DEFAULT_MAP: Record<string, string> = {
  "autoincrement()": "IDENTITY",
  autoincrement: "IDENTITY",
  "now()": "NOW",
  now: "NOW",
  "uuid()": "UUID",
  uuid: "UUID",
  "cuid()": "UUID",
  cuid: "UUID",
};

const formatSqlDefault = (raw: string, spec: DialectSpec): string | null => {
  const value = raw.trim();
  if (value === "") return null;
  const mapped = DEFAULT_MAP[value];
  if (mapped === "IDENTITY") return `DEFAULT ${spec.identity}`;
  if (mapped === "NOW") return `DEFAULT ${spec.nowDefault}`;
  if (mapped === "UUID") return `DEFAULT ${spec.uuidDefault}`;
  if (/^(true|false)$/i.test(value)) return `DEFAULT ${spec.bool(value)}`;
  if (/^-?\d+(\.\d+)?$/.test(value)) return `DEFAULT ${value}`;
  if (value.startsWith("'") && value.endsWith("'")) return `DEFAULT ${value}`;
  if (value.startsWith('"') && value.endsWith('"'))
    return `DEFAULT '${value.slice(1, -1).replace(/'/g, "''")}'`;
  if (/^[a-zA-Z_][a-zA-Z0-9_]*\(.*\)$/.test(value)) return `DEFAULT ${value}`;
  return `DEFAULT '${value.replace(/'/g, "''")}'`;
};

const sqlColumnType = (field: Field, enums: EnumDefinition[], spec: DialectSpec): string => {
  if (field.type === "Enum") {
    const ref = (field.enumName ?? "").trim();
    const known = enums.some((e) => e.name === ref);
    if (known && ref !== "" && spec.nativeEnum) return spec.enumTypeName(sanitizeIdentifier(ref));
    return spec.typeMap.String;
  }
  return spec.typeMap[field.type];
};

/** Compile the graph AST into dialect-specific DDL. Pure function. */
export function generateSql(ast: SchemaAst, dialect: SqlDialect): string {
  const spec = DIALECTS[dialect];
  const statements: string[] = [];
  const q = spec.quote;

  // Enums: Postgres & MySQL expose named enum types; SQLite inlines CHECKs.
  if (spec.nativeEnum) {
    for (const item of ast.enums) {
      const values = item.values.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
      if (values.length === 0) continue;
      if (dialect === "postgresql") {
        statements.push(
          `CREATE TYPE ${q(sanitizeIdentifier(item.name))} AS ENUM (${values});`,
        );
      } else {
        // MySQL: emit the enum values as a documented column type helper via a
        // comment block (MySQL supports inline ENUM(...) only per-column).
        statements.push(
          `-- enum ${sanitizeIdentifier(item.name)}: ENUM(${values})`,
        );
      }
    }
    if (statements.length > 0) statements.push("");
  }

  for (const table of ast.tables) {
    const columns: string[] = [];
    for (const field of table.fields) {
      const parts = [`  ${q(sanitizeIdentifier(field.name))}`, sqlColumnType(field, ast.enums, spec)];
      if (field.isPrimaryKey) parts.push("PRIMARY KEY");
      if (!field.isNullable && !field.isPrimaryKey) parts.push("NOT NULL");
      if (field.isUnique && !field.isPrimaryKey) parts.push("UNIQUE");
      const defaultClause = formatSqlDefault(field.defaultValue, spec);
      if (defaultClause) parts.push(defaultClause);
      // SQLite: native enums unsupported -> CHECK (col IN (...)).
      if (!spec.nativeEnum && field.type === "Enum") {
        const ref = (field.enumName ?? "").trim();
        const item = ast.enums.find((e) => e.name === ref);
        if (item && item.values.length > 0) {
          const values = item.values.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
          parts.push(`CHECK (${q(sanitizeIdentifier(field.name))} IN (${values}))`);
        }
      }
      columns.push(parts.join(" "));
    }

    for (const rel of ast.relations.filter((r) => r.fromTableId === table.id)) {
      const fk = table.fields.find((f) => f.id === rel.fromFieldId);
      const target = ast.tables.find((t) => t.id === rel.toTableId);
      const targetPk = target?.fields.find((f) => f.isPrimaryKey)?.name ?? "id";
      if (fk && target) {
        const onDelete = rel.onDelete ? ` ON DELETE ${rel.onDelete}` : "";
        columns.push(
          `  FOREIGN KEY (${q(sanitizeIdentifier(fk.name))}) REFERENCES ${q(
            sanitizeIdentifier(target.name),
          )} (${q(sanitizeIdentifier(targetPk))})${onDelete}`,
        );
      }
    }

    statements.push(
      `CREATE TABLE ${q(sanitizeIdentifier(table.name))} (\n${columns.join(",\n")}\n)${
        spec.trailingSemicolon ? ";" : ""
      }`,
    );
  }

  return statements.join("\n\n") + (statements.length > 0 ? "\n" : "");
}

const DIALECT_META: Record<SqlDialect, { label: string; filename: string }> = {
  postgresql: { label: "PostgreSQL", filename: "schema.postgres.sql" },
  mysql: { label: "MySQL", filename: "schema.mysql.sql" },
  sqlite: { label: "SQLite", filename: "schema.sqlite.sql" },
};

/** Build the SQL virtual files (one per dialect) for the Code Studio tree. */
export function sqlCodeFiles(ast: SchemaAst): CodeFile[] {
  return SQL_DIALECTS.map((dialect) => ({
    id: `sql-${dialect}`,
    kind: "sql" as const,
    dialect,
    filename: DIALECT_META[dialect].filename,
    label: DIALECT_META[dialect].label,
    language: "sql" as const,
    content: generateSql(ast, dialect),
  }));
}

