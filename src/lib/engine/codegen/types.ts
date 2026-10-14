/**
 * Codegen domain types shared by the Code Studio UI and the generation engines.
 * Framework-agnostic: pure data in, pure strings out.
 */

/** SQL flavours supported by the multi-dialect DDL generator. */
export type SqlDialect = "postgresql" | "mysql" | "sqlite";

/** The kind of artifact a {@link CodeFile} represents. */
export type CodeFileKind =
  | "prisma"
  | "sql"
  | "typescript"
  | "zod"
  | "report";

/**
 * A single virtual file rendered in the Code Studio file tree / editor.
 * `id` is stable so the UI can keep selection across regenerations.
 */
export interface CodeFile {
  id: string;
  kind: CodeFileKind;
  /** Dialect for `kind === "sql"`, otherwise undefined. */
  dialect?: SqlDialect;
  /** File name shown in the tree and used when downloading. */
  filename: string;
  /** Short label for format tabs. */
  label: string;
  /** Human language hint (drives the editor icon only). */
  language: "prisma" | "sql" | "typescript" | "markdown";
  content: string;
}

/** Severity of a robustness alert. */
export type RobustnessSeverity = "error" | "warning" | "info";

/** A single static-analysis finding for the robustness panel. */
export interface RobustnessAlert {
  id: string;
  severity: RobustnessSeverity;
  /** Short headline, e.g. "Table without primary key". */
  title: string;
  /** Detailed, actionable message. */
  message: string;
  /** Optional table this alert is about (enables "go to" navigation). */
  tableId?: string;
}

/** Aggregate counts shown at the top of the diagnostics panel. */
export interface SchemaStats {
  tables: number;
  fields: number;
  relations: number;
  enums: number;
}
