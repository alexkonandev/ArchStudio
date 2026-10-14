import type { SchemaAst } from "@/types";
import { prismaCodeFile } from "./prisma";
import { sqlCodeFiles } from "./sql";
import { typescriptCodeFile } from "./typescript";
import { zodCodeFile } from "./zod";
import { reportCodeFile } from "./report";
import type { CodeFile, SchemaStats } from "./types";

export type { CodeFile, CodeFileKind, RobustnessAlert, RobustnessSeverity, SchemaStats, SqlDialect } from "./types";
export { generatePrisma } from "./prisma";
export { generateSql, SQL_DIALECTS } from "./sql";
export { generateTypeScript } from "./typescript";
export { generateZod } from "./zod";
export { generateReport } from "./report";
export { analyzeRobustness } from "./lint";

/**
 * Generate the complete set of virtual files for the Code Studio file tree:
 * Prisma schema, one SQL file per dialect, TypeScript interfaces, Zod schemas
 * and a migration report. Order is stable so the tree renders deterministically.
 */
export function generateCodeFiles(ast: SchemaAst): CodeFile[] {
  return [
    prismaCodeFile(ast),
    ...sqlCodeFiles(ast),
    typescriptCodeFile(ast),
    zodCodeFile(ast),
    reportCodeFile(ast),
  ];
}

/** Aggregate counts for the diagnostics panel header. */
export function computeStats(ast: SchemaAst): SchemaStats {
  return {
    tables: ast.tables.length,
    fields: ast.tables.reduce((sum, t) => sum + t.fields.length, 0),
    relations: ast.relations.length,
    enums: ast.enums.length,
  };
}
