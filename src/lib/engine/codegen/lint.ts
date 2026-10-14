import type { Relation, SchemaAst, Table } from "@/types";
import type { RobustnessAlert } from "./types";

/**
 * Static, deterministic robustness analysis over the schema graph.
 *
 * Detects the checks most likely to bite in production:
 * - tables without a primary key,
 * - orphan foreign keys (relation whose FK field no longer exists),
 * - PK/FK scalar type mismatches,
 * - many-to-many relations without an explicit join table,
 * - empty tables and empty enums.
 *
 * Pure function: same input -> same alerts in the same order.
 */
export function analyzeRobustness(ast: SchemaAst): RobustnessAlert[] {
  const alerts: RobustnessAlert[] = [];
  const tableById = new Map(ast.tables.map((t) => [t.id, t]));

  for (const table of ast.tables) {
    // Table without a primary key.
    if (!table.fields.some((f) => f.isPrimaryKey)) {
      alerts.push({
        id: `no-pk:${table.id}`,
        severity: "warning",
        title: "Table sans clé primaire",
        message: `La table « ${table.name} » n'a pas de clé primaire. Ajoutez-en une pour garantir une identité de ligne fiable et des relations robustes.`,
        tableId: table.id,
      });
    }

    // Empty table (no columns at all).
    if (table.fields.length === 0) {
      alerts.push({
        id: `no-fields:${table.id}`,
        severity: "warning",
        title: "Table sans colonnes",
        message: `La table « ${table.name} » n'a aucune colonne. Elle ne générera pas de corps DDL exploitable.`,
        tableId: table.id,
      });
    }
  }

  for (const item of ast.enums) {
    if (item.values.length === 0) {
      alerts.push({
        id: `empty-enum:${item.id}`,
        severity: "warning",
        title: "Énum vide",
        message: `L'énum « ${item.name} » n'a aucune valeur.`,
      });
    }
  }

  for (const rel of [...ast.relations].sort((a, b) => a.id.localeCompare(b.id))) {
    const from = tableById.get(rel.fromTableId);
    const to = tableById.get(rel.toTableId);
    if (!from || !to) continue;

    const fk = rel.fromFieldId
      ? from.fields.find((f) => f.id === rel.fromFieldId)
      : undefined;

    // Orphan foreign key.
    if (!fk) {
      alerts.push({
        id: `orphan-fk:${rel.id}`,
        severity: "error",
        title: "Clé étrangère orpheline",
        message: `La relation ${from.name} → ${to.name} pointe vers un champ de clé étrangère manquant dans « ${from.name} ».`,
        tableId: rel.fromTableId,
      });
      continue;
    }

    // PK/FK scalar coherence.
    const pk = to.fields.find((f) => f.isPrimaryKey) ?? to.fields.find((f) => f.name === "id");
    if (pk) {
      const sameScalar = fk.type === pk.type;
      const sameEnum = fk.type !== "Enum" || (fk.enumName ?? "") === (pk.enumName ?? "");
      if (!sameScalar || !sameEnum) {
        alerts.push({
          id: `type-mismatch:${rel.id}`,
          severity: "error",
          title: "Incohérence de type PK/FK",
          message: `${from.name}.${fk.name} (${fk.type}) → ${to.name}.${pk.name} (${pk.type}). Les types scalaires de la clé étrangère et de la clé primaire doivent correspondre.`,
          tableId: rel.fromTableId,
        });
      }
    }

    // Relation without an explicit ON DELETE behavior (falls back to the
    // database / Prisma default, which can silently orphan or block rows).
    if (!rel.onDelete) {
      alerts.push({
        id: `no-ondelete:${rel.id}`,
        severity: "info",
        title: "Relation sans contrainte ON DELETE",
        message: `La relation ${from.name} → ${to.name} n'a pas de comportement ON DELETE explicite. Prisma appliquera la valeur par défaut de la base ; précisez-la pour éviter les suppressions orphelines ou bloquantes.`,
        tableId: rel.fromTableId,
      });
    }

    // Many-to-many without an explicit join table.
    if (rel.type === "many-to-many" && !hasJoinTable(ast, from, to)) {
      alerts.push({
        id: `m2m-no-join:${rel.id}`,
        severity: "warning",
        title: "Relation n:m sans table de jonction",
        message: `La relation ${from.name} ⇄ ${to.name} est de type plusieurs-à-plusieurs mais aucune table de jonction explicite ne les relie. Ajoutez une table d'association pour une génération SQL fiable.`,
        tableId: rel.fromTableId,
      });
    }
  }

  alerts.sort((a, b) => a.id.localeCompare(b.id));
  return alerts;
}

/**
 * Heuristic join-table detection: a join table references both endpoints and has
 * at most a couple of columns (the two foreign keys, plus an optional PK).
 */
const hasJoinTable = (ast: SchemaAst, from: Table, to: Table): boolean => {
  for (const candidate of ast.tables) {
    if (candidate.id === from.id || candidate.id === to.id) continue;
    if (candidate.fields.length > 3) continue;
    const targets = new Set(
      ast.relations
        .filter((r: Relation) => r.fromTableId === candidate.id)
        .map((r) => r.toTableId),
    );
    if (targets.has(from.id) && targets.has(to.id)) return true;
  }
  return false;
};
