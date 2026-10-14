import type { SchemaAst, Table } from "@/types";
import { sanitizeIdentifier } from "../shared";
import { analyzeRobustness } from "./lint";
import type { CodeFile } from "./types";

const pkOf = (table: Table): string =>
  table.fields.find((f) => f.isPrimaryKey)?.name ?? "—";

/** Compile a human-readable migration report in Markdown. */
export function generateReport(ast: SchemaAst): string {
  const lines: string[] = [
    "# Rapport de migration du schéma",
    "",
    "_Généré automatiquement par ArchStudio. À vérifier avant exécution sur une base de données._",
    "",
    "## Vue d'ensemble",
    "",
    `- **Tables :** ${ast.tables.length}`,
    `- **Relations :** ${ast.relations.length}`,
    `- **Énums :** ${ast.enums.length}`,
    "",
  ];

  if (ast.enums.length > 0) {
    lines.push("## Énums", "");
    for (const item of ast.enums) {
      lines.push(`### ${sanitizeIdentifier(item.name)}`, "");
      lines.push(item.values.map((v) => `- \`${v}\``).join("\n"));
      lines.push("");
    }
  }

  lines.push("## Tables", "");
  for (const table of ast.tables) {
    lines.push(`### ${sanitizeIdentifier(table.name)}`, "");
    if (table.comment?.trim()) {
      lines.push(`> ${table.comment.trim()}`, "");
    }
    lines.push("| Colonne | Type | Nullable | Clé | Défaut |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const field of table.fields) {
      const type = field.type === "Enum" ? field.enumName ?? "Enum" : field.type;
      const key = field.isPrimaryKey ? "PK" : field.isUnique ? "UNIQUE" : "";
      const nullable = field.isNullable ? "oui" : "non";
      const def = field.defaultValue ? `\`${field.defaultValue}\`` : "";
      lines.push(
        `| ${sanitizeIdentifier(field.name)} | ${type}${field.isList ? "[]" : ""} | ${nullable} | ${key} | ${def} |`,
      );
    }
    lines.push("");
    lines.push(`_Clé primaire :_ \`${pkOf(table)}\``);
    lines.push("");
  }

  const alerts = analyzeRobustness(ast);
  lines.push("## Robustesse", "");
  if (alerts.length === 0) {
    lines.push("Aucun problème de robustesse détecté. 🎉");
  } else {
    for (const alert of alerts) {
      const icon =
        alert.severity === "error" ? "🔴" : alert.severity === "warning" ? "🟠" : "🔵";
      lines.push(`- ${icon} **${alert.title}** — ${alert.message}`);
    }
  }
  lines.push("");

  return lines.join("\n").trimEnd() + "\n";
}

/** Build the `migration-report.md` virtual file for the Code Studio tree. */
export function reportCodeFile(ast: SchemaAst): CodeFile {
  return {
    id: "report",
    kind: "report",
    filename: "migration-report.md",
    label: "Rapport",
    language: "markdown",
    content: generateReport(ast),
  };
}
