import type { EnumDef, Relation, Table } from "./database";

export type SchemaAstVersion = 1;

export type DatabaseProvider = "postgresql" | "mysql" | "sqlite";

/**
 * Serializable snapshot of the whole graph — the input of the codegen
 * engines (Prisma schema and SQL DDL).
 */
export interface SchemaAst {
  version: SchemaAstVersion;
  datasource?: {
    provider: DatabaseProvider;
    /** Name of the env var holding the connection URL. */
    urlEnv?: string;
  };
  tables: Table[];
  relations: Relation[];
  enums: EnumDef[];
}

/** A generated artifact returned by an engine. */
export interface CompileResult {
  language: "prisma" | "sql";
  filename: string;
  content: string;
}