import { lowerFirst } from "./shared";
import type { Relation, Table } from "@/types";

/**
 * Smart defaults for a freshly wired relation.
 *
 * Pure & deterministic: given the FK-owner table (`from`, child/many side) and
 * the referenced table (`to`, parent/one side), it picks the most probable FK
 * column and returns a complete `Relation` payload (minus `id`, assigned by the
 * store via `createId`).
 *
 * FK resolution order:
 * 1. `<referenced>Id` by naming convention (e.g. `userId` -> User), when the
 *    field exists and its scalar matches the referenced PK scalar.
 * 2. First non-PK scalar field whose type matches the referenced PK scalar.
 * 3. Otherwise `undefined` — the caller surfaces an orphan-FK validation error
 *    and the relation popover invites the user to pick/create the column.
 */

export type NewRelationDefaults = Omit<Relation, "id">;

/** Resolve the referenced primary-key (scalar) column of a table. */
function referencedKey(to: Table): Table["fields"][number] | undefined {
  return (
    to.fields.find((field) => field.isPrimaryKey) ??
    to.fields.find((field) => field.name === "id")
  );
}

/**
 * Guess the FK column on `from` referencing `to`.
 * Returns `undefined` when no type-compatible candidate exists.
 */
export function guessForeignKeyField(
  from: Table,
  to: Table,
): Table["fields"][number] | undefined {
  const pk = referencedKey(to);
  if (!pk) return undefined;

  // 1. Naming convention: `<referenced>Id` (case-insensitive).
  const conventional = `${lowerFirst(to.name)}Id`.toLowerCase();
  const byName = from.fields.find(
    (field) =>
      !field.isPrimaryKey &&
      field.name.toLowerCase() === conventional &&
      field.type === pk.type,
  );
  if (byName) return byName;

  // 2. First type-compatible non-PK scalar column.
  return from.fields.find(
    (field) =>
      !field.isPrimaryKey &&
      !field.isList &&
      field.type === pk.type &&
      (field.type !== "Enum" || (field.enumName ?? "") === (pk.enumName ?? "")),
  );
}

/** Default `onDelete` for a fresh relation (Prisma/SQL-friendly). */
export const DEFAULT_ON_DELETE: NonNullable<Relation["onDelete"]> = "CASCADE";

/** Build the default relation payload for a new canvas connection. */
export function defaultRelation(from: Table, to: Table): NewRelationDefaults {
  const fk = guessForeignKeyField(from, to);
  return {
    name: `${from.name}${to.name}`,
    type: "one-to-many",
    fromTableId: from.id,
    toTableId: to.id,
    fromFieldId: fk?.id,
    onDelete: DEFAULT_ON_DELETE,
  };
}

/** Human summary for the relation popover preview. */
export function describeRelation(
  from: Table,
  to: Table,
  relation: Pick<Relation, "type" | "onDelete">,
): string {
  const cardinality =
    relation.type === "one-to-one"
      ? "1—1"
      : relation.type === "many-to-many"
        ? "N—M"
        : "1—N";
  const cascade = relation.onDelete ? ` · onDelete ${relation.onDelete}` : "";
  return `${from.name} ${cardinality} ${to.name}${cascade}`;
}
