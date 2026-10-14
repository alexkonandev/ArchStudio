import type { Field, Relation, Table } from "@/types";
import { lowerFirst } from "./shared";

/**
 * Smart-join inference engine (pure & deterministic).
 *
 * Given a directed candidate join (`source` owns the FK / is the "many" side,
 * `target` is the referenced / "one" side), it:
 *  - detects whether a compatible foreign-key column already exists on `source`
 *    by standard naming convention (`userId`, `user_id`, `userTableId`, …) and
 *    scalar compatibility with the referenced target primary key;
 *  - proposes an intelligent FK column name when none exists, honouring the
 *    naming style already used by the source table (camelCase vs snake_case);
 *  - infers the cardinality (`1:1` when the FK column is unique, else `1:N`).
 *
 * It also powers the global "auto-detect relations" action by scanning the whole
 * schema for orphan tables that already carry a conventionally-named FK column
 * but have no relation wired yet.
 */

/** Naming convention detected for a table's columns. */
export type FkNamingStyle = "camelCase" | "snake_case";

/** Inferred cardinality of a join (subset relevant to FK wiring). */
export type JoinCardinality = "1:1" | "1:N";

export interface JoinAnalysis {
  /** A compatible FK column already exists on the source table. */
  hasForeignKey: boolean;
  /** The matched existing FK column, when {@link hasForeignKey}. */
  existingField?: Field;
  /** Type-compatible columns on the source usable as a FK (for the picker). */
  candidates: Field[];
  /** Suggested FK column name in the detected naming style (e.g. `userId`). */
  suggestedFieldName: string;
  /** Suggested FK column name in the alternative style (e.g. `user_id`). */
  suggestedFieldNameAlt: string;
  /** Naming style inferred from the source table's existing columns. */
  namingStyle: FkNamingStyle;
  /** Inferred cardinality (`1:1` if the FK is unique, else `1:N`). */
  cardinality: JoinCardinality;
  /** The referenced primary-key column of the target (drives the FK type). */
  referencedKey?: Field;
}

export interface JoinProposal {
  sourceId: string;
  targetId: string;
  /** Existing FK column id on the source that wires this join. */
  fieldId: string;
  cardinality: JoinCardinality;
  /** Human label, e.g. `Post.authorId → User`. */
  label: string;
}

export interface SmartJoinSummary {
  /** Number of relations created. */
  created: number;
  /** Human labels of every created join. */
  links: string[];
}

/** Resolve the referenced primary-key (scalar) column of a table. */
function referencedKeyOf(target: Table): Field | undefined {
  return (
    target.fields.find((field) => field.isPrimaryKey) ??
    target.fields.find((field) => field.name === "id")
  );
}

/** Split an identifier into snake_case (`UserProfile` -> `user_profile`). */
function snakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s\-.]+/g, "_")
    .toLowerCase();
}

/** All accepted FK name variants for a referenced target table. */
function fkNameVariants(target: Table): string[] {
  const base = target.name;
  const camel = `${lowerFirst(base)}Id`;
  return [
    camel,
    `${lowerFirst(base)}TableId`,
    `${snakeCase(base)}_id`,
    `${snakeCase(base)}_table_id`,
  ];
}

/** Infer the naming style used by a table's columns. */
function detectNamingStyle(source: Table): FkNamingStyle {
  const named = source.fields.map((f) => f.name);
  if (named.length === 0) return "camelCase";
  return named.some((name) => name.includes("_"))
    ? "snake_case"
    : "camelCase";
}

/** True when two scalar fields are type-compatible (enum-aware). */
function scalarCompatible(a?: Field, b?: Field): boolean {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  return a.type !== "Enum" || (a.enumName ?? "") === (b.enumName ?? "");
}

/** True when a column is a usable FK scalar (non-PK, non-list). */
function isForeignKeyCandidate(field: Field): boolean {
  return !field.isPrimaryKey && !field.isList;
}

/**
 * Analyse a directed candidate join and return everything the UI needs to
 * decide whether to wire it directly or prompt for a FK column.
 */
export function analyzeJoin(source: Table, target: Table): JoinAnalysis {
  const referencedKey = referencedKeyOf(target);
  const variants = new Set(fkNameVariants(target).map((n) => n.toLowerCase()));

  // 1. Existing FK by naming convention + scalar compatibility.
  const existingField = source.fields.find(
    (field) =>
      isForeignKeyCandidate(field) &&
      variants.has(field.name.toLowerCase()) &&
      scalarCompatible(field, referencedKey),
  );

  // 2. All type-compatible candidate columns (for the "pick existing" UI).
  const candidates = source.fields.filter(
    (field) =>
      isForeignKeyCandidate(field) && scalarCompatible(field, referencedKey),
  );

  const namingStyle = detectNamingStyle(source);
  const camelName = `${lowerFirst(target.name)}Id`;
  const snakeName = `${snakeCase(target.name)}_id`;
  const suggestedFieldName =
    namingStyle === "snake_case" ? snakeName : camelName;
  const suggestedFieldNameAlt =
    namingStyle === "snake_case" ? camelName : snakeName;

  const cardinality: JoinCardinality = existingField?.isUnique ? "1:1" : "1:N";

  return {
    hasForeignKey: Boolean(existingField),
    existingField,
    candidates,
    suggestedFieldName,
    suggestedFieldNameAlt,
    namingStyle,
    cardinality,
    referencedKey,
  };
}

/** Unordered key for a table pair (used to de-duplicate scans). */
const pairKey = (a: string, b: string): string => [a, b].sort().join("::");

/**
 * Scan the whole schema for orphan joins: pairs where the source already owns a
 * conventionally-named, type-compatible FK column but no relation is wired yet.
 *
 * Deterministic (stable iteration over input order) and side-effect free; the
 * caller applies the proposals as a single undoable batch.
 */
export function scanOrphanJoins(
  tables: Table[],
  relations: Relation[],
): JoinProposal[] {
  const linkedPairs = new Set<string>();
  for (const relation of relations) {
    linkedPairs.add(pairKey(relation.fromTableId, relation.toTableId));
  }

  const proposals: JoinProposal[] = [];
  const takenPairs = new Set<string>();

  for (const source of tables) {
    for (const target of tables) {
      if (source.id === target.id) continue;
      const key = pairKey(source.id, target.id);
      // Skip already-linked pairs and pairs we just proposed (avoid A↔B dupes).
      if (linkedPairs.has(key) || takenPairs.has(key)) continue;

      const analysis = analyzeJoin(source, target);
      if (!analysis.hasForeignKey || !analysis.existingField) continue;

      takenPairs.add(key);
      proposals.push({
        sourceId: source.id,
        targetId: target.id,
        fieldId: analysis.existingField.id,
        cardinality: analysis.cardinality,
        label: `${source.name}.${analysis.existingField.name} → ${target.name}`,
      });
    }
  }

  return proposals;
}

