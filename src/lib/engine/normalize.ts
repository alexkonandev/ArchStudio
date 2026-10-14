import type { Relation, Table } from "@/types";

/**
 * One-click schema normalisation (pure & deterministic).
 *
 * Fixes the mechanical issues the validation engine reports, without touching
 * anything ambiguous (e.g. duplicate names or orphan relations, which need a
 * human decision). Returns a new graph plus a human summary of every change so
 * the caller can show a preview / toast.
 *
 * Rules applied, in order:
 *  1. Add a primary key (`id`, `@default(autoincrement())`) to every table
 *     that has none — UNLESS an existing field is already named `id` (then it
 *     is promoted to PK in place, avoiding a duplicate column).
 *  2. Align every relation FK scalar type with its referenced PK type, and
 *     keep enum references in sync, fixing the PK/FK mismatch class of errors.
 *  3. Add a unique index covering each unique, non-PK field that is not yet
 *     covered — this is what earns the normalisation bonus in the health score.
 *
 * Idempotent: normalising an already-clean schema is a no-op that reports 0
 * changes.
 */

export interface NormalizationSummary {
  /** Tables that received a brand-new primary-key column. */
  addedPk: string[];
  /** Existing `id` fields promoted to primary key. */
  promotedPk: string[];
  /** Foreign-key fields whose scalar type was corrected. */
  fixedFkTypes: string[];
  /** Unique indexes added (described for the toast). */
  addedIndexes: string[];
  /** True when nothing needed fixing. */
  noop: boolean;
}

export interface NormalizationResult {
  tables: Table[];
  relations: Relation[];
  summary: NormalizationSummary;
}

/** The canonical primary-key column injected into tables that lack one. */
const injectedPrimaryKey = (table: Table): Table => ({
  ...table,
  fields: [
    {
      id: `field_${table.id}_pk`,
      name: "id",
      type: "Int",
      defaultValue: "autoincrement()",
      isUpdatedAt: false,
      isUnique: false,
      isNullable: false,
      nullable: false,
      unique: false,
      isPrimaryKey: true,
      isList: false,
    },
    ...table.fields,
  ],
});

/** Set of field ids already covered by a unique index. */
const uniqueIndexedIds = (table: Table): Set<string> =>
  new Set(
    (table.indexes ?? [])
      .filter((index) => index.unique)
      .flatMap((index) => index.fieldIds),
  );

export function normalizeGraph(
  tables: Table[],
  relations: Relation[],
): NormalizationResult {
  const summary: NormalizationSummary = {
    addedPk: [],
    promotedPk: [],
    fixedFkTypes: [],
    addedIndexes: [],
    noop: true,
  };

  // Rule 1 — ensure every table has a primary key.
  let nextTables = tables.map((table) => {
    if (table.fields.some((f) => f.isPrimaryKey)) return table;

    const existingId = table.fields.find((f) => f.name === "id");
    if (existingId) {
      // Promote the existing `id` column instead of adding a duplicate.
      summary.promotedPk.push(table.name);
      summary.noop = false;
      return {
        ...table,
        fields: table.fields.map((f) =>
          f.id === existingId.id ? { ...f, isPrimaryKey: true } : f,
        ),
      };
    }

    summary.addedPk.push(table.name);
    summary.noop = false;
    return injectedPrimaryKey(table);
  });

  const tableById = new Map(nextTables.map((t) => [t.id, t]));

  // Rule 2 — align FK scalar / enum types with the referenced PK.
  const nextRelations = relations.map((relation) => {
    const from = tableById.get(relation.fromTableId);
    const to = tableById.get(relation.toTableId);
    if (!from || !to || !relation.fromFieldId) return relation;

    const pk =
      to.fields.find((f) => f.isPrimaryKey) ??
      to.fields.find((f) => f.name === "id");
    if (!pk) return relation;

    const fk = from.fields.find((f) => f.id === relation.fromFieldId);
    if (!fk) return relation;

    const scalarOk = fk.type === pk.type;
    const enumOk = fk.type !== "Enum" || (fk.enumName ?? "") === (pk.enumName ?? "");
    if (scalarOk && enumOk) return relation;

    summary.fixedFkTypes.push(`${from.name}.${fk.name} → ${pk.type}`);
    summary.noop = false;

    const patch =
      fk.type === "Enum" || pk.type === "Enum"
        ? { type: pk.type, enumName: pk.enumName, isList: false }
        : { type: pk.type, enumName: undefined, isList: false };

    nextTables = nextTables.map((t) =>
      t.id === from.id
        ? {
            ...t,
            fields: t.fields.map((f) =>
              f.id === fk.id
                ? {
                    ...f,
                    ...patch,
                    isNullable: true,
                    nullable: true,
                  }
                : f,
            ),
          }
        : t,
    );
    return relation;
  });

  // Rule 3 — cover each unique, non-PK field with a unique index.
  nextTables = nextTables.map((table) => {
    const indexed = uniqueIndexedIds(table);
    const missing = table.fields.filter(
      (f) => f.isUnique && !f.isPrimaryKey && !indexed.has(f.id),
    );
    if (missing.length === 0) return table;

    const base = table.indexes ?? [];
    const nextIndexes = [
      ...base,
      ...missing.map((f) => ({
        id: `index_${table.id}_${f.id}_unique`,
        name: `${table.name}_${f.name}_key`,
        fieldIds: [f.id],
        unique: true,
      })),
    ];
    for (const f of missing) {
      summary.addedIndexes.push(`${table.name}.${f.name}`);
      summary.noop = false;
    }
    return { ...table, indexes: nextIndexes };
  });

  return { tables: nextTables, relations: nextRelations, summary };
}

/** Total number of discrete fixes in a summary. */
export function countNormalizations(summary: NormalizationSummary): number {
  return (
    summary.addedPk.length +
    summary.promotedPk.length +
    summary.fixedFkTypes.length +
    summary.addedIndexes.length
  );
}
