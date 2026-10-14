import type { EnumDefinition, Relation, Table, ValidationIssue } from "@/types";

/**
 * Deterministic integrity engine for the ArchStudio graph.
 * Pure function: same inputs -> same issues in the same order.
 *
 * Checks:
 * 1. PK/FK scalar type mismatch -> error
 * 2. Table without primary key -> warning
 * 3. Duplicate table / field names -> error
 * 4. Orphan foreign key (FK field missing) -> error
 * 5. Enum reference integrity (unknown enum, empty enum) -> error/warning
 */
export function validateGraph(
  tables: Table[],
  relations: Relation[],
  enums: EnumDefinition[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const tableById = new Map(tables.map((t) => [t.id, t]));
  const enumByName = new Map(enums.map((e) => [e.name, e]));

  // 3a. Duplicate table names (exact match, deterministic).
  const tableNameGroups = new Map<string, Table[]>();
  for (const table of tables) {
    const group = tableNameGroups.get(table.name) ?? [];
    group.push(table);
    tableNameGroups.set(table.name, group);
  }
  const sortedTableNames = [...tableNameGroups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  for (const [name, group] of sortedTableNames) {
    if (group.length > 1) {
      const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
      for (const dup of sorted.slice(1)) {
        issues.push({
          id: `duplicate-table:${dup.id}`,
          severity: "error",
          message: `Le nom de table « ${name} » est utilisé ${group.length} fois. Les noms doivent être uniques.`,
          target: { tableId: dup.id },
        });
      }
    }
  }

  for (const table of tables) {
    // 2. Missing primary key.
    if (!table.fields.some((f) => f.isPrimaryKey)) {
      issues.push({
        id: `missing-pk:${table.id}`,
        severity: "warning",
        message: `La table « ${table.name} » n'a pas de clé primaire.`,
        target: { tableId: table.id },
      });
    }

    // 3b. Duplicate field names within the same table.
    const fieldGroups = new Map<string, typeof table.fields>();
    for (const field of table.fields) {
      const group = fieldGroups.get(field.name) ?? [];
      group.push(field);
      fieldGroups.set(field.name, group);
    }
    const sortedFieldNames = [...fieldGroups.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [name, group] of sortedFieldNames) {
      if (group.length > 1) {
        const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
        for (const dup of sorted.slice(1)) {
          issues.push({
            id: `duplicate-field:${table.id}:${dup.id}`,
            severity: "error",
            message: `Le champ « ${name} » est déclaré ${group.length} fois dans la table « ${table.name} ».`,
            target: { tableId: table.id, fieldId: dup.id },
          });
        }
      }
    }

    // 5a. Enum field referencing an unknown enum.
    for (const field of table.fields) {
      if (field.type !== "Enum") continue;
      const ref = (field.enumName ?? "").trim();
      if (!ref) {
        issues.push({
          id: `enum-missing-ref:${table.id}:${field.id}`,
          severity: "error",
          message: `Le champ « ${table.name}.${field.name} » utilise le type Enum sans sélectionner d'énum.`,
          target: { tableId: table.id, fieldId: field.id },
        });
      } else if (!enumByName.has(ref)) {
        issues.push({
          id: `enum-unknown:${table.id}:${field.id}`,
          severity: "error",
          message: `Le champ « ${table.name}.${field.name} » référence un énum inconnu « ${ref} ».`,
          target: { tableId: table.id, fieldId: field.id },
        });
      }
    }
  }

  // 5b. Duplicate enum names + empty enums.
  const enumGroups = new Map<string, EnumDefinition[]>();
  for (const item of enums) {
    const group = enumGroups.get(item.name) ?? [];
    group.push(item);
    enumGroups.set(item.name, group);
  }
  const sortedEnumNames = [...enumGroups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  for (const [name, group] of sortedEnumNames) {
    if (name.trim() !== "" && group.length > 1) {
      const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
      for (const dup of sorted.slice(1)) {
        issues.push({
          id: `duplicate-enum:${dup.id}`,
          severity: "error",
          message: `Le nom d'énum « ${name} » est déclaré ${group.length} fois.`,
          target: { tableId: tables[0]?.id ?? "" },
        });
      }
    }
  }
  const sortedEnums = [...enums].sort((a, b) => a.id.localeCompare(b.id));
  for (const item of sortedEnums) {
    if (item.values.length === 0) {
      issues.push({
        id: `empty-enum:${item.id}`,
        severity: "warning",
        message: `L'énum « ${item.name || item.id} » n'a aucune valeur.`,
        target: { tableId: tables[0]?.id ?? "" },
      });
    }
  }

  // 1 & 4. Relations: orphan FK + PK/FK type coherence.
  const sortedRelations = [...relations].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  for (const rel of sortedRelations) {
    const fromTable = tableById.get(rel.fromTableId);
    const toTable = tableById.get(rel.toTableId);
    if (!fromTable || !toTable) continue;

    const fkField = rel.fromFieldId
      ? fromTable.fields.find((f) => f.id === rel.fromFieldId)
      : undefined;

    // 4. Orphan FK: explicit relation whose FK column no longer exists.
    if (!fkField) {
      const label = rel.name ?? `${fromTable.name} -> ${toTable.name}`;
      issues.push({
        id: `orphan-fk:${rel.id}`,
        severity: "error",
        message: `La relation « ${label} » pointe vers un champ de clé étrangère manquant dans « ${fromTable.name} ».`,
        target: {
          tableId: rel.fromTableId,
          fieldId: rel.fromFieldId,
          edgeId: rel.id,
        },
      });
      continue;
    }

    // 1. PK/FK scalar type coherence (strict equality on the scalar).
    const pkField =
      toTable.fields.find((f) => f.isPrimaryKey) ??
      toTable.fields.find((f) => f.name === "id");
    if (!pkField) continue;
    const sameScalar = fkField.type === pkField.type;
    const sameEnumRef =
      fkField.type !== "Enum" ||
      (fkField.enumName ?? "") === (pkField.enumName ?? "");
    if (!sameScalar || !sameEnumRef) {
      const detail =
        fkField.type === "Enum" || pkField.type === "Enum"
          ? `${fkField.type}(${fkField.enumName ?? "?"}) vs ${pkField.type}(${pkField.enumName ?? "?"})`
          : `${fkField.type} vs ${pkField.type}`;
      issues.push({
        id: `type-mismatch:${rel.id}`,
        severity: "error",
        message: `Incohérence de type sur la relation « ${fromTable.name}.${fkField.name} » -> « ${toTable.name}.${pkField.name} » : ${detail}. Les types scalaires de la clé étrangère et de la clé primaire doivent être identiques.`,
        target: {
          tableId: rel.fromTableId,
          fieldId: fkField.id,
          edgeId: rel.id,
        },
      });
    }
  }

  // Deterministic output order.
  issues.sort((a, b) => a.id.localeCompare(b.id));
  return issues;
}
