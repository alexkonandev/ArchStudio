import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import type {
  EnumDefinition,
  Field,
  Relation,
  SchemaAst,
  Table,
  TableFlowNode,
  ValidationIssue,
} from "@/types";
import { lowerFirst } from "@/lib/engine/shared";
import { validateGraph } from "@/lib/engine/validation";
import type { ParsedSchema } from "@/lib/engine/parser";

export const GRAPH_NODE_TYPE = "table" as const;
export const STORAGE_KEY = "archstudio_schema_v1";

/** Coalesce burst writes (e.g. dragging a node) into one localStorage write. */
const PERSIST_DEBOUNCE_MS = 300;

/** Client-side id factory (prefix + random uuid). */
export const createId = (prefix: string) =>
  `${prefix}_${globalThis.crypto.randomUUID()}`;

/** Normalize a partial field input into a fully canonical stored Field. */
export const toStoredField = (
  input: Partial<Field> & { name: string; type: Field["type"] },
  id?: string,
): Field => {
  const isNullable = input.isNullable ?? input.nullable ?? true;
  const isUnique = input.isUnique ?? input.unique ?? false;
  return {
    id: id ?? input.id ?? createId("field"),
    name: input.name,
    type: input.type,
    enumName: input.enumName,
    defaultValue: input.defaultValue ?? "",
    isUpdatedAt: input.isUpdatedAt ?? false,
    isUnique,
    isNullable,
    nullable: isNullable,
    unique: isUnique,
    isPrimaryKey: input.isPrimaryKey ?? false,
    isList: input.isList ?? false,
    comment: input.comment,
  };
};

const defaultPrimaryKey = (defaultValue = "autoincrement()"): Field =>
  toStoredField({
    name: "id",
    type: "Int",
    isNullable: false,
    isUnique: false,
    isPrimaryKey: true,
    defaultValue,
  });

/** Recompute validation issues for the next graph snapshot. */
const withValidation = (next: {
  tables: Table[];
  relations: Relation[];
  enums: EnumDefinition[];
}): { validationIssues: ValidationIssue[] } => ({
  validationIssues: validateGraph(next.tables, next.relations, next.enums),
});

/** Cascading position for freshly added tables (MVP). */
const nextPosition = (count: number): XYPosition => ({
  x: 80 * ((count + 1) % 6),
  y: 60 * Math.floor((count + 1) / 3),
});

const tableToNode = (table: Table): TableFlowNode => ({
  id: table.id,
  type: GRAPH_NODE_TYPE,
  position: { ...table.position },
  data: { tableId: table.id },
});

/** Deterministic seed so server prerender and client hydration match. */
const seedTables = (): Table[] => [
  {
    id: "table-user",
    name: "User",
    position: { x: 0, y: 40 },
    fields: [
      toStoredField(
        {
          name: "id",
          type: "Int",
          isNullable: false,
          isUnique: false,
          isPrimaryKey: true,
          defaultValue: "autoincrement()",
        },
        "field-user-id",
      ),
      toStoredField(
        {
          name: "email",
          type: "String",
          isNullable: false,
          isUnique: true,
          isPrimaryKey: false,
          defaultValue: "",
        },
        "field-user-email",
      ),
      toStoredField(
        {
          name: "createdAt",
          type: "DateTime",
          isNullable: false,
          isUnique: false,
          isPrimaryKey: false,
          defaultValue: "now()",
        },
        "field-user-created",
      ),
    ],
  },
  {
    id: "table-post",
    name: "Post",
    position: { x: 380, y: 0 },
    fields: [
      toStoredField(
        {
          name: "id",
          type: "Int",
          isNullable: false,
          isUnique: false,
          isPrimaryKey: true,
          defaultValue: "autoincrement()",
        },
        "field-post-id",
      ),
      toStoredField(
        {
          name: "title",
          type: "String",
          isNullable: false,
          isUnique: false,
          isPrimaryKey: false,
          defaultValue: "",
        },
        "field-post-title",
      ),
      toStoredField(
        {
          name: "authorId",
          type: "Int",
          isNullable: true,
          isUnique: false,
          isPrimaryKey: false,
          defaultValue: "",
        },
        "field-post-userid",
      ),
    ],
  },
  {
    id: "table-comment",
    name: "Comment",
    position: { x: 190, y: 320 },
    fields: [
      toStoredField(
        {
          name: "id",
          type: "Int",
          isNullable: false,
          isUnique: false,
          isPrimaryKey: true,
          defaultValue: "autoincrement()",
        },
        "field-comment-id",
      ),
      toStoredField(
        {
          name: "body",
          type: "String",
          isNullable: false,
          isUnique: false,
          isPrimaryKey: false,
          defaultValue: "",
        },
        "field-comment-body",
      ),
      toStoredField(
        {
          name: "postId",
          type: "Int",
          isNullable: true,
          isUnique: false,
          isPrimaryKey: false,
          defaultValue: "",
        },
        "field-comment-postid",
      ),
    ],
  },
];

const seedRelations = (): Relation[] => [
  {
    id: "rel-user-posts",
    name: "UserPosts",
    type: "one-to-many",
    fromTableId: "table-post",
    toTableId: "table-user",
    fromFieldId: "field-post-userid",
    onDelete: "CASCADE",
  },
  {
    id: "rel-post-comments",
    name: "PostComments",
    type: "one-to-many",
    fromTableId: "table-comment",
    toTableId: "table-post",
    fromFieldId: "field-comment-postid",
    onDelete: "CASCADE",
  },
];

const initialTables = seedTables();
const initialRelations = seedRelations();
const seedEnums = (): EnumDefinition[] => [
  {
    id: "enum-role",
    name: "Role",
    values: ["ADMIN", "USER"],
  },
];

const initialEnums = seedEnums();

const AUTO_LAYOUT = {
  columns: 3,
  cardWidth: 260,
  gapX: 120,
  gapY: 120,
  originX: 0,
  originY: 0,
} as const;

export interface GraphStore {
  tables: Table[];
  relations: Relation[];
  enums: EnumDefinition[];
  validationIssues: ValidationIssue[];
  nodes: TableFlowNode[];
  edges: Edge[];
  selectedNodeId: string | null;

  selectNode: (id: string | null) => void;
  onNodesChange: (changes: NodeChange<TableFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addTable: (name: string) => void;
  removeTable: (tableId: string) => void;
  renameTable: (tableId: string, name: string) => void;
  addField: (tableId: string, field: Omit<Field, "id">) => void;
  updateField: (tableId: string, fieldId: string, patch: Partial<Field>) => void;
  removeField: (tableId: string, fieldId: string) => void;

  addRelation: (relation: Omit<Relation, "id">) => void;
  removeRelation: (relationId: string) => void;

  addEnum: (name: string) => void;
  renameEnum: (enumId: string, name: string) => void;
  removeEnum: (enumId: string) => void;
  addEnumValue: (enumId: string, value: string) => void;
  updateEnumValue: (enumId: string, index: number, value: string) => void;
  removeEnumValue: (enumId: string, index: number) => void;

  applyAutoLayout: () => void;

  getSchemaAst: () => SchemaAst;
  loadSchema: (schema: ParsedSchema) => void;
  resetGraph: (mode?: "empty" | "seed") => void;
  hydrateFromStorage: () => void;
}

const relationToEdge = (relation: Relation): Edge => ({
  id: relation.id,
  source: relation.fromTableId,
  target: relation.toTableId,
  type: "smoothstep",
});

const buildGraphState = (tables: Table[], relations: Relation[], enums: EnumDefinition[]) => ({
  tables,
  relations,
  enums,
  nodes: tables.map(tableToNode),
  edges: relations.map(relationToEdge),
  validationIssues: validateGraph(tables, relations, enums),
  selectedNodeId: null as string | null,
});

const persistState = (tables: Table[], relations: Relation[], enums: EnumDefinition[]): void => {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tables, relations, enums }));
  } catch {
    // Storage full / unavailable: edits still work in memory.
  }
};

const readStoredSchema = (): ParsedSchema | null => {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ParsedSchema> | null;
    if (!parsed || !Array.isArray(parsed.tables) || !Array.isArray(parsed.relations) || !Array.isArray(parsed.enums)) return null;
    return { tables: parsed.tables, relations: parsed.relations, enums: parsed.enums };
  } catch {
    return null;
  }
};

export const useGraphStore = create<GraphStore>()((set, get) => ({
  tables: initialTables,
  relations: initialRelations,
  enums: initialEnums,
  validationIssues: validateGraph(
    initialTables,
    initialRelations,
    initialEnums,
  ),
  nodes: initialTables.map(tableToNode),
  edges: initialRelations.map((relation) => ({
    id: relation.id,
    source: relation.fromTableId,
    target: relation.toTableId,
    type: "smoothstep",
  })),
  selectedNodeId: null,

  selectNode: (id) => set({ selectedNodeId: id }),

  onNodesChange: (changes) => {
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes);
      const tables: Table[] = state.tables.map((table) => ({ ...table }));
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          const index = tables.findIndex((table) => table.id === change.id);
          if (index !== -1) {
            tables[index] = {
              ...tables[index],
              position: { x: change.position.x, y: change.position.y },
            };
          }
        }
      }
      return { nodes, tables };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const edges = applyEdgeChanges(changes, state.edges);
      let relations = state.relations;
      if (changes.some((change) => change.type === "remove")) {
        const removedIds = new Set(
          changes
            .filter((change) => change.type === "remove")
            .map((change) => change.id),
        );
        relations = relations.filter((rel) => !removedIds.has(rel.id));
      }
      return {
        edges,
        relations,
        ...withValidation({
          tables: state.tables,
          relations,
          enums: state.enums,
        }),
      };
    });
  },

  onConnect: (connection) => {
    const { tables, relations } = get();
    const from = tables.find((table) => table.id === connection.source);
    const to = tables.find((table) => table.id === connection.target);
    if (!from || !to || from.id === to.id) return;
    const duplicate = relations.some(
      (rel) => rel.fromTableId === from.id && rel.toTableId === to.id,
    );
    if (duplicate) return;

    let fromTable = from;
    const fkName = `${lowerFirst(to.name)}Id`;
    let fkField = from.fields.find((f) => f.name === fkName);
    if (!fkField) {
      const parentPk = to.fields.find((f) => f.isPrimaryKey);
      fkField = toStoredField({
        name: fkName,
        type: parentPk?.type ?? "Int",
        enumName: parentPk?.enumName,
        isNullable: true,
        isUnique: false,
        isPrimaryKey: false,
        defaultValue: "",
      });
      fromTable = { ...from, fields: [...from.fields, fkField] };
    }
    const relation: Relation = {
      id: createId("rel"),
      name: `${from.name}${to.name}`,
      type: "one-to-many",
      fromTableId: from.id,
      toTableId: to.id,
      fromFieldId: fkField.id,
      onDelete: "CASCADE",
    };
    set((state) => {
      const nextTables = state.tables.map((t) =>
        t.id === fromTable.id ? fromTable : t,
      );
      const nextRelations = [...state.relations, relation];
      return {
        tables: nextTables,
        relations: nextRelations,
        edges: addEdge(
          {
            id: relation.id,
            source: relation.fromTableId,
            target: relation.toTableId,
            type: "smoothstep",
          },
          state.edges,
        ),
        ...withValidation({
          tables: nextTables,
          relations: nextRelations,
          enums: state.enums,
        }),
      };
    });
  },

  addTable: (name) => {
    const table: Table = {
      id: createId("table"),
      name: name.trim() || "Untitled",
      fields: [defaultPrimaryKey()],
      position: nextPosition(get().tables.length),
    };
    set((state) => {
      const tables = [...state.tables, table];
      return {
        tables,
        nodes: [...state.nodes, tableToNode(table)],
        ...withValidation({
          tables,
          relations: state.relations,
          enums: state.enums,
        }),
      };
    });
  },

  removeTable: (tableId) => {
    set((state) => {
      const tables = state.tables.filter((t) => t.id !== tableId);
      const relations = state.relations.filter(
        (r) => r.fromTableId !== tableId && r.toTableId !== tableId,
      );
      return {
        tables,
        nodes: state.nodes.filter((n) => n.id !== tableId),
        relations,
        edges: state.edges.filter(
          (e) => e.source !== tableId && e.target !== tableId,
        ),
        selectedNodeId:
          state.selectedNodeId === tableId ? null : state.selectedNodeId,
        ...withValidation({ tables, relations, enums: state.enums }),
      };
    });
  },

  renameTable: (tableId, name) => {
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === tableId ? { ...t, name } : t,
      );
      return {
        tables,
        ...withValidation({
          tables,
          relations: state.relations,
          enums: state.enums,
        }),
      };
    });
  },
  addField: (tableId, field) => {
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === tableId
          ? { ...t, fields: [...t.fields, toStoredField(field)] }
          : t,
      );
      return {
        tables,
        ...withValidation({
          tables,
          relations: state.relations,
          enums: state.enums,
        }),
      };
    });
  },

  updateField: (tableId, fieldId, patch) => {
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id !== tableId
          ? t
          : {
              ...t,
              fields: t.fields.map((f) => {
                if (f.id !== fieldId) return f;
                const next = { ...f, ...patch };
                if (patch.isNullable !== undefined)
                  next.nullable = patch.isNullable;
                if (patch.nullable !== undefined)
                  next.isNullable = patch.nullable;
                if (patch.isUnique !== undefined) next.unique = patch.isUnique;
                if (patch.unique !== undefined) next.isUnique = patch.unique;
                return next;
              }),
            },
      );
      return {
        tables,
        ...withValidation({
          tables,
          relations: state.relations,
          enums: state.enums,
        }),
      };
    });
  },

  removeField: (tableId, fieldId) => {
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === tableId
          ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
          : t,
      );
      const relations = state.relations.map((r) =>
        r.fromFieldId === fieldId ? { ...r, fromFieldId: undefined } : r,
      );
      return {
        tables,
        relations,
        ...withValidation({ tables, relations, enums: state.enums }),
      };
    });
  },
  addRelation: (relation) => {
    const full: Relation = { ...relation, id: createId("rel") };
    set((state) => {
      const relations = [...state.relations, full];
      return {
        relations,
        edges: [
          ...state.edges,
          {
            id: full.id,
            source: full.fromTableId,
            target: full.toTableId,
            type: "smoothstep",
          },
        ],
        ...withValidation({
          tables: state.tables,
          relations,
          enums: state.enums,
        }),
      };
    });
  },

  removeRelation: (relationId) => {
    set((state) => {
      const relations = state.relations.filter((r) => r.id !== relationId);
      return {
        relations,
        edges: state.edges.filter((e) => e.id !== relationId),
        ...withValidation({
          tables: state.tables,
          relations,
          enums: state.enums,
        }),
      };
    });
  },

  addEnum: (name) => {
    const trimmed = name.trim() || `Enum${get().enums.length + 1}`;
    const item: EnumDefinition = {
      id: createId("enum"),
      name: trimmed,
      values: ["VALUE_1"],
    };
    set((state) => {
      const enums = [...state.enums, item];
      return {
        enums,
        ...withValidation({
          tables: state.tables,
          relations: state.relations,
          enums,
        }),
      };
    });
  },

  renameEnum: (enumId, name) => {
    set((state) => {
      const prev = state.enums.find((e) => e.id === enumId);
      const enums = state.enums.map((e) =>
        e.id === enumId ? { ...e, name } : e,
      );
      const tables =
        prev && prev.name !== name
          ? state.tables.map((t) => ({
              ...t,
              fields: t.fields.map((f) =>
                f.type === "Enum" && f.enumName === prev.name
                  ? { ...f, enumName: name }
                  : f,
              ),
            }))
          : state.tables;
      return {
        enums,
        tables,
        ...withValidation({ tables, relations: state.relations, enums }),
      };
    });
  },

  removeEnum: (enumId) => {
    set((state) => {
      const enums = state.enums.filter((e) => e.id !== enumId);
      return {
        enums,
        ...withValidation({
          tables: state.tables,
          relations: state.relations,
          enums,
        }),
      };
    });
  },

  addEnumValue: (enumId, value) => {
    set((state) => {
      const enums = state.enums.map((e) =>
        e.id === enumId
          ? {
              ...e,
              values: [
                ...e.values,
                value.trim() || `VALUE_${e.values.length + 1}`,
              ],
            }
          : e,
      );
      return {
        enums,
        ...withValidation({
          tables: state.tables,
          relations: state.relations,
          enums,
        }),
      };
    });
  },

  updateEnumValue: (enumId, index, value) => {
    set((state) => {
      const enums = state.enums.map((e) =>
        e.id === enumId
          ? { ...e, values: e.values.map((v, i) => (i === index ? value : v)) }
          : e,
      );
      return {
        enums,
        ...withValidation({
          tables: state.tables,
          relations: state.relations,
          enums,
        }),
      };
    });
  },

  removeEnumValue: (enumId, index) => {
    set((state) => {
      const enums = state.enums.map((e) =>
        e.id === enumId
          ? { ...e, values: e.values.filter((_, i) => i !== index) }
          : e,
      );
      return {
        enums,
        ...withValidation({
          tables: state.tables,
          relations: state.relations,
          enums,
        }),
      };
    });
  },

  applyAutoLayout: () => {
    set((state) => {
      const stepX = AUTO_LAYOUT.cardWidth + AUTO_LAYOUT.gapX;
      const tables = state.tables.map((table, index) => {
        const col = index % AUTO_LAYOUT.columns;
        const row = Math.floor(index / AUTO_LAYOUT.columns);
        const estimatedHeight = 90 + table.fields.length * 30;
        const stepY = estimatedHeight + AUTO_LAYOUT.gapY;
        return {
          ...table,
          position: {
            x: AUTO_LAYOUT.originX + col * stepX,
            y: AUTO_LAYOUT.originY + row * stepY,
          },
        };
      });
      return {
        tables,
        nodes: tables.map((table) => ({
          id: table.id,
          type: GRAPH_NODE_TYPE,
          position: { ...table.position },
          data: { tableId: table.id },
        })),
      };
    });
  },

  getSchemaAst: () => {
    const { tables, relations, enums } = get();
    return {
      version: 1,
      datasource: { provider: "postgresql", urlEnv: "DATABASE_URL" },
      tables,
      relations,
      enums,
    };
  },

  loadSchema: (schema) => {
    const next = buildGraphState(schema.tables, schema.relations, schema.enums);
    set(next);
    persistState(schema.tables, schema.relations, schema.enums);
  },

  resetGraph: (mode = "seed") => {
    const tables = mode === "seed" ? seedTables() : [];
    const relations = mode === "seed" ? seedRelations() : [];
    const enums = mode === "seed" ? seedEnums() : [];
    set(buildGraphState(tables, relations, enums));
    persistState(tables, relations, enums);
  },

  hydrateFromStorage: () => {
    const stored = readStoredSchema();
    if (!stored) return;
    set(buildGraphState(stored.tables, stored.relations, stored.enums));
  },
}));

if (typeof window !== "undefined") {
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  const schedulePersist = (state: GraphStore): void => {
    if (persistTimer !== null) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persistState(state.tables, state.relations, state.enums);
    }, PERSIST_DEBOUNCE_MS);
  };

  // Debounced persistence: a node drag fires onNodesChange many times per
  // second, which would otherwise hammer localStorage synchronously. Coalesce
  // those into a single write once the graph settles.
  useGraphStore.subscribe(schedulePersist);

  // Flush the pending write before the page goes away so the last edit survives.
  window.addEventListener("pagehide", () => {
    if (persistTimer === null) return;
    clearTimeout(persistTimer);
    persistTimer = null;
    const { tables, relations, enums } = useGraphStore.getState();
    persistState(tables, relations, enums);
  });
}