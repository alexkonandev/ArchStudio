import type { EnumDefinition, Field, SchemaAst, Table } from "@/types";
import { sanitizeIdentifier } from "../shared";
import type { CodeFile } from "./types";

/** Map a Prisma-scalar field to its Zod validator expression. */
const zodScalar = (field: Field, enums: EnumDefinition[]): string => {
  switch (field.type) {
    case "Int":
      return "z.number().int()";
    case "BigInt":
      return "z.number().int()";
    case "String":
      return "z.string()";
    case "Boolean":
      return "z.boolean()";
    case "Float":
      return "z.number()";
    case "Decimal":
      return "z.number()";
    case "DateTime":
      return "z.coerce.date()";
    case "Date":
      return "z.string()";
    case "Json":
      return "z.unknown()";
    case "Bytes":
      return "z.instanceof(Uint8Array)";
    case "UUID":
      return "z.string().uuid()";
    case "Enum": {
      const ref = (field.enumName ?? "").trim();
      const known = enums.some((e) => e.name === ref);
      if (known && ref !== "") {
        const values = enums.find((e) => e.name === ref)?.values ?? [];
        const quoted = values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(", ");
        return `z.enum([${quoted}])`;
      }
      return "z.string()";
    }
    default:
      return "z.unknown()";
  }
};

const zodField = (field: Field, enums: EnumDefinition[]): string => {
  const base = zodScalar(field, enums);
  const inner = field.isList ? `z.array(${base})` : base;
  // Nullable columns accept `null`; PKs and lists stay non-null.
  const nullable = field.isNullable && !field.isList && !field.isPrimaryKey;
  return nullable ? `${inner}.nullable()` : inner;
};

const formatZodSchema = (table: Table, enums: EnumDefinition[]): string[] => {
  const name = sanitizeIdentifier(table.name);
  const lines = [
    `export const ${name}Schema = z.object({`,
  ];
  if (table.comment?.trim()) {
    lines.unshift(`/** ${table.comment.trim()} */`);
  }
  for (const field of table.fields) {
    lines.push(`  ${sanitizeIdentifier(field.name)}: ${zodField(field, enums)},`);
  }
  lines.push("});");
  lines.push(`export type ${name} = z.infer<typeof ${name}Schema>;`);
  return lines;
};

/**
 * Compile the graph AST into Zod validation schemas with inferred types.
 * Ready to drop into a `zod.ts` module for API request validation.
 */
export function generateZod(ast: SchemaAst): string {
  const lines: string[] = [
    'import { z } from "zod";',
    "",
    "// GÉNÉRÉ AUTOMATIQUEMENT PAR ARCHSTUDIO — NE PAS MODIFIER MANUELLEMENT.",
    "// Schémas Zod dérivés du schéma visuel ; types inférés via z.infer.",
    "",
  ];

  for (const table of ast.tables) {
    lines.push(...formatZodSchema(table, ast.enums));
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

/** Build the `zod-schemas.ts` virtual file for the Code Studio tree. */
export function zodCodeFile(ast: SchemaAst): CodeFile {
  return {
    id: "zod",
    kind: "zod",
    filename: "zod-schemas.ts",
    label: "Zod",
    language: "typescript",
    content: generateZod(ast),
  };
}
