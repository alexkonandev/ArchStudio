import { z } from "zod";
import { FIELD_TYPES, TABLE_COLORS } from "@/types";
import { createParseId } from "./parser";

/**
 * Runtime validation for data read back from `localStorage` (and for imported
 * `.json` schema exports).
 *
 * Strategy: leaf values are repaired with `.catch()` so a slightly-off field
 * (wrong type, missing flag…) is coerced to a safe default instead of throwing.
 * The *structure* stays strict — `tables`/`relations`/`enums` must be arrays of
 * well-shaped objects — so genuinely corrupt payloads fail `safeParse` and the
 * caller can fall back to the default schema rather than crash the app.
 */

const relationTypeSchema = z.enum([
  "one-to-one",
  "one-to-many",
  "many-to-many",
]);
const cascadeSchema = z.enum([
  "CASCADE",
  "RESTRICT",
  "SET_NULL",
  "SET_DEFAULT",
  "NO_ACTION",
]);

const positionSchema = z
  .object({
    x: z.number().catch(0),
    y: z.number().catch(0),
  })
  .catch({ x: 0, y: 0 });

const fieldSchema = z.object({
  id: z.string().catch(() => createParseId("field")),
  name: z.string().catch("field"),
  type: z.enum(FIELD_TYPES).catch("String"),
  enumName: z.string().optional(),
  defaultValue: z.string().catch(""),
  isUpdatedAt: z.boolean().catch(false),
  isUnique: z.boolean().catch(false),
  isNullable: z.boolean().catch(true),
  nullable: z.boolean().catch(true),
  unique: z.boolean().catch(false),
  isPrimaryKey: z.boolean().catch(false),
  isList: z.boolean().catch(false),
  comment: z.string().optional(),
});

const tableIndexSchema = z.object({
  id: z.string().catch(() => createParseId("index")),
  name: z.string().optional(),
  fieldIds: z.array(z.string()).catch([]),
  unique: z.boolean().catch(false),
});

const tableSchema = z.object({
  id: z.string().catch(() => createParseId("table")),
  name: z.string().catch("Table"),
  position: positionSchema,
  fields: z.array(fieldSchema).catch([]),
  indexes: z.array(tableIndexSchema).optional(),
  comment: z.string().optional(),
  color: z.enum(TABLE_COLORS).optional(),
});

const relationSchema = z.object({
  id: z.string().catch(() => createParseId("rel")),
  name: z.string().optional(),
  type: relationTypeSchema.catch("one-to-many"),
  fromTableId: z.string().catch(""),
  toTableId: z.string().catch(""),
  fromFieldId: z.string().optional(),
  onDelete: cascadeSchema.optional(),
  onUpdate: cascadeSchema.optional(),
});

const enumSchema = z.object({
  id: z.string().catch(() => createParseId("enum")),
  name: z.string().catch("Enum"),
  values: z.array(z.string()).catch([]),
});

/** Schema for a persisted / imported graph snapshot. */
export const storedSchemaSchema = z.object({
  version: z.number().optional(),
  datasource: z
    .object({
      provider: z
        .enum(["postgresql", "mysql", "sqlite"])
        .catch("postgresql"),
      urlEnv: z.string().optional(),
    })
    .optional(),
  tables: z.array(tableSchema),
  relations: z.array(relationSchema),
  enums: z.array(enumSchema),
});

export type StoredSchema = z.infer<typeof storedSchemaSchema>;

/**
 * Validate an unknown value (parsed JSON) against the stored-schema shape.
 * Returns the cleaned snapshot, or `null` when the payload is structurally
 * corrupt so callers can fall back to a default schema.
 */
export const validateStoredSchema = (
  input: unknown,
): StoredSchema | null => {
  const result = storedSchemaSchema.safeParse(input);
  return result.success ? result.data : null;
};
