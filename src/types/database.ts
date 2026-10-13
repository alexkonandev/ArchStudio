/**
 * Domain model for the ArchStudio graph (database schema level).
 * Framework-agnostic: it is the single source of truth consumed by both
 * the React Flow canvas and the Prisma / SQL codegen engines.
 */

/** Supported column types (Prisma-scalar superset). */
export const FIELD_TYPES = [
  "String",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "Boolean",
  "DateTime",
  "Date",
  "Json",
  "Bytes",
  "UUID",
  "Enum",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** A column / attribute of a table. */
export interface Field {
  /** Stable client-side id (uuid). */
  id: string;
  /** Column / attribute name. */
  name: string;
  type: FieldType;
  /** Explicit enum name when `type === "Enum"`. */
  enumName?: string;
  /**
   * Raw default value, e.g. `"autoincrement()"`, `"uuid()"`, `"now()"`,
   * `"cuid()"`, `""` (none) or any literal (`"hello"`, `"0"`, `"true"`).
   * Empty string means "no default".
   */
  defaultValue: string;
  /** Prisma `@updatedAt` — auto-update timestamp on write. */
  isUpdatedAt: boolean;
  /** Whether the column is unique (canonical Sprint 2 flag). */
  isUnique: boolean;
  /** Whether the column can be null (canonical Sprint 2 flag). */
  isNullable: boolean;
  /** Legacy alias of `isNullable` (kept in sync, do not diverge). */
  nullable: boolean;
  /** Legacy alias of `isUnique` (kept in sync, do not diverge). */
  unique: boolean;
  isPrimaryKey: boolean;
  /** Whether the field is a list/array column (Prisma `Type[]`). */
  isList?: boolean;
  /** Optional column comment (MVP). */
  comment?: string;
}

/** A table node on the canvas. */
export interface Table {
  id: string;
  name: string;
  /** Column order is preserved. */
  fields: Field[];
  indexes?: TableIndex[];
  position: { x: number; y: number };
  comment?: string;
}

export interface TableIndex {
  id: string;
  name?: string;
  fieldIds: string[];
  unique: boolean;
}

export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

export type RelationCascade =
  | "CASCADE"
  | "RESTRICT"
  | "SET_NULL"
  | "SET_DEFAULT"
  | "NO_ACTION";

/**
 * A directed relation between two tables.
 *
 * - `fromTableId` owns the foreign-key column (the "child"/"many" side).
 * - `toTableId` is the referenced side (the "parent"/"one" side).
 * - For `many-to-many`, the FK is materialized through a join table.
 */
export interface Relation {
  id: string;
  /** Optional explicit name for the Prisma `@relation("...")`. */
  name?: string;
  type: RelationType;
  fromTableId: string;
  toTableId: string;
  /** FK column on `fromTableId` when it must be explicit. */
  fromFieldId?: string;
  onDelete?: RelationCascade;
  onUpdate?: RelationCascade;
}

/** An enum type usable by `Enum` fields. */
export interface EnumDefinition {
  /** Stable client-side id (uuid). */
  id: string;
  name: string;
  values: string[];
}

/** Legacy alias — prefer {@link EnumDefinition}. */
export type EnumDef = EnumDefinition;

/** Severity of a graph integrity issue. */
export type ValidationSeverity = "error" | "warning";

/** A deterministic integrity report entry for the graph. */
export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  target: {
    tableId: string;
    fieldId?: string;
    edgeId?: string;
  };
}