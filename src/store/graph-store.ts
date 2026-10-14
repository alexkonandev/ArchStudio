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
  TableColor,
  TableFlowNode,
  ValidationIssue,
} from "@/types";
import { validateGraph } from "@/lib/engine/validation";
import {
  normalizeGraph,
  type NormalizationSummary,
} from "@/lib/engine/normalize";
import { validateStoredSchema } from "@/lib/engine/schema";
import { DEFAULT_ON_DELETE } from "@/lib/engine/relation-defaults";
import {
  analyzeJoin,
  scanOrphanJoins,
  type JoinCardinality,
  type SmartJoinSummary,
} from "@/lib/engine/smart-join";
import {
  emptyHistory,
  pushHistory,
  redoHistory,
  takeSnapshot,
  undoHistory,
  type HistoryState,
} from "@/lib/history";
import { pushToast } from "@/components/ui/toast";
import type { ParsedSchema } from "@/lib/engine/parser";
import { emitGraphMutation, onGraphMutation } from "@/lib/collab/graph-sync";

export const GRAPH_NODE_TYPE = "table" as const;
/** Custom edge renderer (glowing relation cable). */
export const GRAPH_EDGE_TYPE = "relationship" as const;
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

/** Position offset applied to a duplicated table so it doesn't stack. */
const DUPLICATE_OFFSET = { x: 48, y: 48 } as const;

/**
 * Bounded undo/redo history (module scope, never persisted to localStorage).
 * Each entry is a pre-mutation snapshot of `{ tables, relations, enums }`.
 * Derived/transient state (nodes, edges, validationIssues, selection) is
 * rebuilt on restore via `buildGraphState` + `withValidation`.
 */
let historyState: HistoryState = emptyHistory();

/** Reactive bump counter mirroring history mutations (see `historyVersion`). */
let historyVersion = 0;

/** Notify `historyVersion` subscribers after a push/undo/redo/clear. */
function bumpHistoryVersion(): void {
  historyVersion += 1;
  useGraphStore.setState({ historyVersion });
}

/** True between a node-drag start and its stop: frames must not pollute history. */
let dragTransactionOpen = false;

/**
 * True while we apply a snapshot that must NOT be re-broadcast (remote tab
 * update, storage hydration). Read by the outbound `subscribe` below so a
 * tab that just converged never echoes the state back (ping-pong) and never
 * appears to "reload" its peers when it regains focus.
 */
let suspendGraphBroadcast = false;

/** Deep-equality on the persisted graph slice (cheap: schemas are small). */
function samePersistedSlice(
  a: { tables: unknown; relations: unknown; enums: unknown },
  b: { tables: unknown; relations: unknown; enums: unknown },
): boolean {
  try {
    return (
      JSON.stringify(a.tables) === JSON.stringify(b.tables) &&
      JSON.stringify(a.relations) === JSON.stringify(b.relations) &&
      JSON.stringify(a.enums) === JSON.stringify(b.enums)
    );
  } catch {
    return false;
  }
}

/**
 * Record the current state before a discrete mutation.
 * No-op while a drag transaction is open (see `beginDragTransaction`).
 */
function checkpoint(state: {
  tables: Table[];
  relations: Relation[];
  enums: EnumDefinition[];
}): void {
  if (dragTransactionOpen) return;
  historyState = pushHistory(historyState, takeSnapshot(state));
  bumpHistoryVersion();
}

/**
 * Open a coalescing transaction for a node drag: captures a single checkpoint
 * for the whole gesture so one Ctrl+Z reverts the entire move.
 */
export function beginDragTransaction(): void {
  if (dragTransactionOpen) return;
  dragTransactionOpen = true;
  const { tables, relations, enums } = useGraphStore.getState();
  historyState = pushHistory(
    historyState,
    takeSnapshot({ tables, relations, enums }),
  );
  bumpHistoryVersion();
}

/** Close the drag transaction opened by {@link beginDragTransaction}. */
export function endDragTransaction(): void {
  dragTransactionOpen = false;
}

/** Drop all undo/redo steps (fresh load, reset, hydration). */
function clearHistory(): void {
  historyState = emptyHistory();
  dragTransactionOpen = false;
  bumpHistoryVersion();
}

/** Rebuild the full store slice from a restored history snapshot. */
const restoreSnapshot = (snapshot: {
  tables: Table[];
  relations: Relation[];
  enums: EnumDefinition[];
}) => ({
  ...buildGraphState(snapshot.tables, snapshot.relations, snapshot.enums),
  selectedNodeId: null as string | null,
  selectedEdgeId: null as string | null,
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

/**
 * A canvas connection awaiting a foreign-key decision.
 * Set by `onConnect` when no compatible FK column is detected; the smart
 * connect modal resolves it (create a field, or pick an existing one).
 */
export interface PendingJoin {
  sourceId: string;
  targetId: string;
}

export interface GraphStore {
  tables: Table[];
  relations: Relation[];
  enums: EnumDefinition[];
  validationIssues: ValidationIssue[];
  nodes: TableFlowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  /** Transient event fired after a new relation is wired (toast + edge pulse). */
  lastRelationEvent: { at: number; from: string; to: string } | null;
  /** Transient set of table ids to animate with a birth transition. */
  freshTableIds: string[];
  /** Transient set of field ids to flash once in their table node. */
  freshFieldIds: string[];
  /** Consume one-shot animation markers after their CSS animation has played. */
  consumeFreshIds: (tableIds?: string[], fieldIds?: string[]) => void;
  /** Currently selected edge (relation cable), if any. */
  selectedEdgeId: string | null;
  /**
   * Pending smart-join awaiting a FK decision (see {@link PendingJoin}).
   * `null` when no modal is open.
   */
  pendingJoin: PendingJoin | null;
  selectNode: (id: string | null) => void;
  /** Select an edge; clears any node selection and vice-versa. */
  selectEdge: (id: string | null) => void;
  onNodesChange: (changes: NodeChange<TableFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  /**
   * Resolve a pending smart-join by wiring the relation through `fromFieldId`.
   * When `createField` is set, the inferred FK column is created on the source
   * table first. Runs as a single undoable checkpoint.
   */
  resolveSmartJoin: (choice: {
    fromFieldId?: string;
    createField?: boolean;
  }) => void;
  /** Dismiss the pending smart-join without creating anything. */
  cancelSmartJoin: () => void;
  /**
   * Scan the whole schema and wire every orphan join detected by naming
   * convention, in a single undoable checkpoint. Returns a summary.
   */
  autoDetectRelations: () => SmartJoinSummary;

  addTable: (name: string) => void;
  removeTable: (tableId: string) => void;
  renameTable: (tableId: string, name: string) => void;
  /** Update a table's doc comment (rendered as a `///` in Prisma). */
  updateTableComment: (tableId: string, comment: string) => void;
  duplicateTable: (tableId: string) => void;
  setTableColor: (tableId: string, color: TableColor) => void;
  addField: (tableId: string, field: Omit<Field, "id">) => void;
  updateField: (tableId: string, fieldId: string, patch: Partial<Field>) => void;
  removeField: (tableId: string, fieldId: string) => void;

  addRelation: (relation: Omit<Relation, "id">) => void;
  updateRelation: (relationId: string, patch: Partial<Relation>) => void;
  removeRelation: (relationId: string) => void;

  /** Global undo/redo over discrete graph mutations (Ctrl+Z / Ctrl+Shift+Z). */
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /**
   * Bumps on every history mutation (push/undo/redo/clear) so toolbar buttons
   * can subscribe reactively. The history itself stays module-scoped.
   */
  historyVersion: number;

  addEnum: (name: string) => void;
  renameEnum: (enumId: string, name: string) => void;
  removeEnum: (enumId: string) => void;
  addEnumValue: (enumId: string, value: string) => void;
  updateEnumValue: (enumId: string, index: number, value: string) => void;
  removeEnumValue: (enumId: string, index: number) => void;

  applyAutoLayout: () => void;

  /**
   * One-click gamified normalisation: adds missing primary keys, aligns FK
   * scalar types with their referenced PK, and covers unique non-PK fields with
   * a unique index. Runs as a single undoable checkpoint. Returns a summary of
   * every change so the UI can report it.
   */
  normalizeSchema: () => NormalizationSummary;

  // --- Index management (Inspector → Contraintes tab) ---------------------

  /** Add an index covering the given fields on a table. */
  addIndex: (tableId: string, fieldIds: string[], unique: boolean) => void;
  /** Remove an index by id. */
  removeIndex: (tableId: string, indexId: string) => void;
  /** Toggle the unique flag of an existing index. */
  toggleIndexUnique: (tableId: string, indexId: string) => void;

  getSchemaAst: () => SchemaAst;
  /**
   * Load a quick-start template into the canvas.
   * Replaces the current graph in ONE undoable checkpoint: a single Ctrl+Z
   * restores the previous schema (unlike `loadSchema` which clears history).
   * Ids are re-minted via `createId` so loading the same starter twice never
   * collides, then positions are re-gridded.
   */
  applyQuickStarter: (schema: ParsedSchema) => void;
  loadSchema: (schema: ParsedSchema) => void;
  resetGraph: (mode?: "empty" | "seed") => void;
  hydrateFromStorage: () => void;
}

const relationToEdge = (relation: Relation): Edge => ({
  id: relation.id,
  source: relation.fromTableId,
  target: relation.toTableId,
  type: GRAPH_EDGE_TYPE,
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

/**
 * Build a `one-to-one` / `one-to-many` relation wiring `source` → `target`
 * through an (existing or freshly created) FK column on `source`.
 * Pure: the caller decides whether to persist it inside a checkpoint.
 */
const buildJoinRelation = (
  source: Table,
  target: Table,
  fkField: Field,
  cardinality: JoinCardinality,
): Relation => ({
  id: createId("rel"),
  name: `${source.name}${target.name}`,
  type: cardinality === "1:1" ? "one-to-one" : "one-to-many",
  fromTableId: source.id,
  toTableId: target.id,
  fromFieldId: fkField.id,
  onDelete: DEFAULT_ON_DELETE,
});

/** Append a freshly created FK column to its source table. */
const withFkField = (source: Table, fkField: Field): Table => ({
  ...source,
  fields: [...source.fields, fkField],
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
    const parsed: unknown = JSON.parse(raw);
    // Runtime validation with Zod: repairs minor corruption via per-field
    // `.catch()` defaults, and rejects structurally invalid payloads (returns
    // null) so the caller keeps the default seed schema instead of crashing.
    const validated = validateStoredSchema(parsed);
    if (!validated) return null;
    return { tables: validated.tables, relations: validated.relations, enums: validated.enums };
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
    type: GRAPH_EDGE_TYPE,
  })),
  selectedNodeId: null,

  selectedEdgeId: null,

  lastRelationEvent: null,
  pendingJoin: null,
  freshTableIds: [],
  freshFieldIds: [],

  historyVersion: 0,

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),

  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  consumeFreshIds: (tableIds = [], fieldIds = []) =>
    set((state) => {
      if (tableIds.length === 0 && fieldIds.length === 0) return state;
      const tables = new Set(tableIds);
      const fields = new Set(fieldIds);
      return {
        freshTableIds: state.freshTableIds.filter((id) => !tables.has(id)),
        freshFieldIds: state.freshFieldIds.filter((id) => !fields.has(id)),
      };
    }),

  undo: () => {
    const state = get();
    const result = undoHistory(historyState, takeSnapshot(state));
    if (!result) return;
    historyState = result.state;
    set(restoreSnapshot(result.snapshot));
    bumpHistoryVersion();
  },

  redo: () => {
    const state = get();
    const result = redoHistory(historyState, takeSnapshot(state));
    if (!result) return;
    historyState = result.state;
    set(restoreSnapshot(result.snapshot));
    bumpHistoryVersion();
  },

  canUndo: () => historyState.past.length > 0,
  canRedo: () => historyState.future.length > 0,

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

    const analysis = analyzeJoin(from, to);

    // A compatible FK column already exists — wire the relation immediately.
    if (analysis.hasForeignKey && analysis.existingField) {
      const relation = buildJoinRelation(
        from,
        to,
        analysis.existingField,
        analysis.cardinality,
      );
      const nextRelations = [...relations, relation];
      checkpoint(get());
      set((state) => ({
        relations: nextRelations,
        edges: addEdge(
          {
            id: relation.id,
            source: relation.fromTableId,
            target: relation.toTableId,
            type: GRAPH_EDGE_TYPE,
            // Trigger the one-shot glow/pulse along the freshly wired cable.
            data: { pulse: true },
          },
          state.edges,
        ),
        selectedNodeId: null,
        selectedEdgeId: relation.id,
        pendingJoin: null,
        lastRelationEvent: {
          at: Date.now(),
          from: from.name,
          to: to.name,
        },
        ...withValidation({
          tables: state.tables,
          relations: nextRelations,
          enums: state.enums,
        }),
      }));
      pushToast(`Relation ${from.name} → ${to.name} créée`, {
        type: "success",
        description: `Champ « ${analysis.existingField.name} » · annulable via Ctrl+Z.`,
      });
      return;
    }

    // No FK column detected: defer the decision to the smart-connect modal.
    // Nothing is committed yet — the user picks "create field" or an existing
    // column, then `resolveSmartJoin` records a single undoable step.
    set({
      pendingJoin: { sourceId: from.id, targetId: to.id },
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  resolveSmartJoin: ({ fromFieldId, createField }) => {
    const state = get();
    const pending = state.pendingJoin;
    if (!pending) return;
    const source = state.tables.find((t) => t.id === pending.sourceId);
    const target = state.tables.find((t) => t.id === pending.targetId);
    if (!source || !target) {
      set({ pendingJoin: null });
      return;
    }

    const analysis = analyzeJoin(source, target);
    let fkField: Field | undefined;
    let nextSource = source;

    if (fromFieldId) {
      // Reuse an existing, type-compatible column chosen by the user.
      fkField = source.fields.find((f) => f.id === fromFieldId);
    } else if (createField) {
      // 1-click: create the inferred FK column (name + referenced PK scalar).
      const pk = analysis.referencedKey;
      fkField = toStoredField({
        name: analysis.suggestedFieldName,
        type: pk?.type ?? "Int",
        enumName: pk?.enumName,
        isNullable: true,
        isUnique: false,
        isPrimaryKey: false,
        defaultValue: "",
      });
      nextSource = withFkField(source, fkField);
    }

    if (!fkField) {
      set({ pendingJoin: null });
      return;
    }

    const cardinality: JoinCardinality = fkField.isUnique ? "1:1" : "1:N";
    const relation = buildJoinRelation(source, target, fkField, cardinality);
    const createdField = nextSource !== source;

    checkpoint(state);
    set((s) => {
      const tables = createdField
        ? s.tables.map((t) => (t.id === nextSource.id ? nextSource : t))
        : s.tables;
      const relations = [...s.relations, relation];
      return {
        tables,
        relations,
        edges: addEdge(
          {
            id: relation.id,
            source: relation.fromTableId,
            target: relation.toTableId,
            type: GRAPH_EDGE_TYPE,
            data: { pulse: true },
          },
          s.edges,
        ),
        pendingJoin: null,
        selectedNodeId: null,
        selectedEdgeId: relation.id,
        freshFieldIds: createdField
          ? [...s.freshFieldIds, fkField.id]
          : s.freshFieldIds,
        lastRelationEvent: {
          at: Date.now(),
          from: source.name,
          to: target.name,
        },
        ...withValidation({ tables, relations, enums: s.enums }),
      };
    });
    pushToast(`Relation ${source.name} → ${target.name} créée`, {
      type: "success",
      description: createdField
        ? `Champ « ${fkField.name} » créé · annulable via Ctrl+Z.`
        : `Champ « ${fkField.name} » · annulable via Ctrl+Z.`,
    });
  },

  cancelSmartJoin: () => set({ pendingJoin: null }),

  autoDetectRelations: () => {
    const state = get();
    const proposals = scanOrphanJoins(state.tables, state.relations);
    if (proposals.length === 0) return { created: 0, links: [] };

    // Resolve every proposal against the current tables, then commit the whole
    // batch in ONE checkpoint so a single Ctrl+Z reverts it entirely.
    const tableById = new Map(state.tables.map((t) => [t.id, t]));
    const newRelations: Relation[] = [];
    const newEdges: Edge[] = [];
    const links: string[] = [];

    for (const proposal of proposals) {
      const source = tableById.get(proposal.sourceId);
      const target = tableById.get(proposal.targetId);
      if (!source || !target) continue;
      const fkField = source.fields.find((f) => f.id === proposal.fieldId);
      if (!fkField) continue;
      const relation = buildJoinRelation(
        source,
        target,
        fkField,
        proposal.cardinality,
      );
      newRelations.push(relation);
      newEdges.push({
        id: relation.id,
        source: relation.fromTableId,
        target: relation.toTableId,
        type: GRAPH_EDGE_TYPE,
        data: { pulse: true },
      });
      links.push(proposal.label);
    }

    if (newRelations.length === 0) return { created: 0, links: [] };

    checkpoint(state);
    set((s) => {
      const relations = [...s.relations, ...newRelations];
      return {
        relations,
        edges: [...s.edges, ...newEdges],
        ...withValidation({ tables: s.tables, relations, enums: s.enums }),
      };
    });
    return { created: newRelations.length, links };
  },

  addTable: (name) => {
    checkpoint(get());
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
        // One-shot birth animation: TableNode marks this id, then asks to clear it.
        freshTableIds: [...state.freshTableIds, table.id],
        ...withValidation({
          tables,
          relations: state.relations,
          enums: state.enums,
        }),
      };
    });
  },

  removeTable: (tableId) => {
    checkpoint(get());
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
        selectedEdgeId: null,
        ...withValidation({ tables, relations, enums: state.enums }),
      };
    });
  },

  duplicateTable: (tableId) => {
    const source = get().tables.find((t) => t.id === tableId);
    if (!source) return;
    checkpoint(get());
    // Deep-clone fields with fresh ids so the copy is fully independent.
    const newTableId = createId("table");
    const fields: Field[] = source.fields.map((field) => ({
      ...field,
      id: createId("field"),
    }));
    const duplicate: Table = {
      ...source,
      id: newTableId,
      name: `${source.name}Copy`,
      fields,
      // Offset so the copy doesn't land exactly on top of the original.
      position: {
        x: source.position.x + DUPLICATE_OFFSET.x,
        y: source.position.y + DUPLICATE_OFFSET.y,
      },
    };
    set((state) => {
      const tables = [...state.tables, duplicate];
      return {
        tables,
        nodes: [...state.nodes, tableToNode(duplicate)],
        selectedNodeId: newTableId,
        freshTableIds: [...state.freshTableIds, newTableId],
        ...withValidation({
          tables,
          relations: state.relations,
          enums: state.enums,
        }),
      };
    });
  },

  setTableColor: (tableId, color) => {
    // Color is purely cosmetic: no validation recompute required.
    checkpoint(get());
    set((state) => ({
      tables: state.tables.map((t) => (t.id === tableId ? { ...t, color } : t)),
    }));
  },

  renameTable: (tableId, name) => {
    checkpoint(get());
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
  updateTableComment: (tableId, comment) => {
    checkpoint(get());
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === tableId ? { ...t, comment: comment || undefined } : t,
      );
      return { tables };
    });
  },
  addField: (tableId, field) => {
    checkpoint(get());
    const fresh = toStoredField(field);
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === tableId
          ? { ...t, fields: [...t.fields, fresh] }
          : t,
      );
      return {
        tables,
        // One-shot row flash: TableNode marks this id, then asks to clear it.
        freshFieldIds: [...state.freshFieldIds, fresh.id],
        ...withValidation({
          tables,
          relations: state.relations,
          enums: state.enums,
        }),
      };
    });
  },

  updateField: (tableId, fieldId, patch) => {
    checkpoint(get());
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
    checkpoint(get());
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
    checkpoint(get());
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
            type: GRAPH_EDGE_TYPE,
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

  updateRelation: (relationId, patch) => {
    const current = get().relations.find((r) => r.id === relationId);
    if (!current) return;
    checkpoint(get());
    set((state) => {
      const relations = state.relations.map((r) =>
        r.id === relationId ? { ...r, ...patch, id: r.id } : r,
      );
      return {
        relations,
        edges: state.edges.map((e) =>
          e.id === relationId ? { ...e, type: GRAPH_EDGE_TYPE } : e,
        ),
        ...withValidation({
          tables: state.tables,
          relations,
          enums: state.enums,
        }),
      };
    });
  },

  removeRelation: (relationId) => {
    checkpoint(get());
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
    checkpoint(get());
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
    checkpoint(get());
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
    checkpoint(get());
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
    const trimmed = value.trim();
    // Reject empty values so an enum never holds an invalid blank entry.
    if (!trimmed) return;
    checkpoint(get());
    set((state) => {
      const enums = state.enums.map((e) =>
        e.id === enumId
          ? {
              ...e,
              values: [
                ...e.values,
                trimmed || `VALUE_${e.values.length + 1}`,
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
    checkpoint(get());
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
    checkpoint(get());
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
    checkpoint(get());
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

  normalizeSchema: () => {
    const state = get();
    const { tables, relations, summary } = normalizeGraph(
      state.tables,
      state.relations,
    );
    if (summary.noop) return summary;
    // One checkpoint for the whole batch: a single Ctrl+Z reverts everything.
    checkpoint(state);
    set({
      tables,
      relations,
      nodes: tables.map((table) => ({
        id: table.id,
        type: GRAPH_NODE_TYPE,
        position: { ...table.position },
        data: { tableId: table.id },
      })),
      edges: relations.map((rel) => ({
        id: rel.id,
        source: rel.fromTableId,
        target: rel.toTableId,
        type: GRAPH_EDGE_TYPE,
      })),
      ...withValidation({ tables, relations, enums: state.enums }),
    });
    return summary;
  },

  addIndex: (tableId, fieldIds, unique) => {
    if (fieldIds.length === 0) return;
    checkpoint(get());
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              indexes: [
                ...(t.indexes ?? []),
                { id: createId("index"), fieldIds, unique },
              ],
            }
          : t,
      );
      return {
        tables,
        ...withValidation({ tables, relations: state.relations, enums: state.enums }),
      };
    });
  },

  removeIndex: (tableId, indexId) => {
    checkpoint(get());
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === tableId
          ? { ...t, indexes: (t.indexes ?? []).filter((i) => i.id !== indexId) }
          : t,
      );
      return {
        tables,
        ...withValidation({ tables, relations: state.relations, enums: state.enums }),
      };
    });
  },

  toggleIndexUnique: (tableId, indexId) => {
    checkpoint(get());
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              indexes: (t.indexes ?? []).map((i) =>
                i.id === indexId ? { ...i, unique: !i.unique } : i,
              ),
            }
          : t,
      );
      return {
        tables,
        ...withValidation({ tables, relations: state.relations, enums: state.enums }),
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

  applyQuickStarter: (schema) => {
    checkpoint(get());
    const tableIdMap = new Map<string, string>();
    const tables: Table[] = schema.tables.map((t, index) => {
      const nextId = createId("table");
      tableIdMap.set(t.id, nextId);
      // Preserve authored positions (presets) when present, otherwise grid.
      const fallback = { x: (index % 2) * 400, y: Math.floor(index / 2) * 360 };
      const position =
        Number.isFinite(t.position?.x) && Number.isFinite(t.position?.y)
          ? { ...t.position }
          : fallback;
      return {
        ...t,
        id: nextId,
        position,
        color: t.color,
        comment: t.comment,
        indexes: t.indexes ? structuredClone(t.indexes) : undefined,
        fields: t.fields.map((fld) => toStoredField(fld, createId("field"))),
      };
    });
    const relations: Relation[] = [];
    for (const r of schema.relations) {
      const fromTableId = tableIdMap.get(r.fromTableId);
      const toTableId = tableIdMap.get(r.toTableId);
      if (!fromTableId || !toTableId) continue;
      // FK ids are re-minted: resolve through the original field name.
      const originalFrom = schema.tables.find((t) => t.id === r.fromTableId);
      const originalFk = originalFrom?.fields.find(
        (fld) => fld.id === r.fromFieldId,
      );
      const fromTable = tables.find((t) => t.id === fromTableId);
      const resolvedFk = originalFk
        ? fromTable?.fields.find((fld) => fld.name === originalFk.name)
        : undefined;
      relations.push({
        ...r,
        id: createId("rel"),
        fromTableId,
        toTableId,
        fromFieldId: resolvedFk?.id,
      });
    }
    const enums: EnumDefinition[] = schema.enums.map((e) => ({
      ...e,
      id: createId("enum"),
      values: [...e.values],
    }));
    const next = buildGraphState(tables, relations, enums);
    set(next);
    persistState(tables, relations, enums);
  },

  loadSchema: (schema) => {
    const next = buildGraphState(schema.tables, schema.relations, schema.enums);
    clearHistory();
    set(next);
    persistState(schema.tables, schema.relations, schema.enums);
  },

  resetGraph: (mode = "seed") => {
    const tables = mode === "seed" ? seedTables() : [];
    const relations = mode === "seed" ? seedRelations() : [];
    const enums = mode === "seed" ? seedEnums() : [];
    clearHistory();
    set(buildGraphState(tables, relations, enums));
    persistState(tables, relations, enums);
  },

  hydrateFromStorage: () => {
    const stored = readStoredSchema();
    if (!stored) return;
    const current = get();
    // Idempotent hydration: StrictMode double-mount, remount after a tab
    // switch, or two pages hydrating the same singleton must be no-ops when
    // storage already matches memory. Otherwise every focus return would
    // rebuild `nodes`/`edges` from scratch (remount + fitView replay = the
    // perceived "auto-reload") and wipe the undo history for nothing.
    if (
      samePersistedSlice(
        { tables: current.tables, relations: current.relations, enums: current.enums },
        stored,
      )
    ) {
      return;
    }
    suspendGraphBroadcast = true;
    try {
      clearHistory();
      set({
        ...buildGraphState(stored.tables, stored.relations, stored.enums),
        // Hydration restores persisted data, never the transient UI state.
        selectedNodeId: current.selectedNodeId,
        selectedEdgeId: current.selectedEdgeId,
      });
    } finally {
      suspendGraphBroadcast = false;
    }
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

  // --- Real-time inter-tab sync (BroadcastChannel) -------------------------
  // Guard against back-propagation loops: while we apply a snapshot received
  // from another tab we must NOT re-broadcast it, or two tabs would ping-pong
  // the same state forever. `suspendGraphBroadcast` flips the outbound
  // subscription off for the duration of the inbound `set`. It is also set by
  // `hydrateFromStorage` so a tab regaining focus never echoes stale state.
  // NOTE: no `visibilitychange` / `focus` / `location.reload` / `router.refresh`
  // listener exists anywhere on purpose — tab focus must never reset the store.

  // Reference of the last broadcast graph slice. `set` produces fresh arrays
  // only for the slices a mutation touched, so a reference change is a cheap
  // and precise signal to broadcast - selection / transient edits are ignored.
  let lastEmitted: {
    tables: Table[];
    relations: Relation[];
    enums: EnumDefinition[];
  } | null = null;

  useGraphStore.subscribe((state) => {
    if (suspendGraphBroadcast) return;
    if (
      lastEmitted &&
      lastEmitted.tables === state.tables &&
      lastEmitted.relations === state.relations &&
      lastEmitted.enums === state.enums
    ) {
      return;
    }
    lastEmitted = {
      tables: state.tables,
      relations: state.relations,
      enums: state.enums,
    };
    emitGraphMutation({
      tables: state.tables,
      relations: state.relations,
      enums: state.enums,
    });
  });

  // Apply mutations broadcast by other tabs in silent mode: the
  // `suspendGraphBroadcast` guard keeps the subscription above from echoing the
  // freshly applied state right back out onto the channel. Identical snapshots
  // (e.g. immediate echo after our own hydration) are dropped so the canvas
  // never rebuilds `nodes`/`edges` — and never replays `fitView` — on tab focus.
  onGraphMutation((payload) => {
    const current = useGraphStore.getState();
    if (
      samePersistedSlice(
        { tables: current.tables, relations: current.relations, enums: current.enums },
        payload,
      )
    ) {
      return;
    }
    suspendGraphBroadcast = true;
    try {
      const next = buildGraphState(payload.tables, payload.relations, payload.enums);
      lastEmitted = {
        tables: payload.tables,
        relations: payload.relations,
        enums: payload.enums,
      };
      useGraphStore.setState({
        ...next,
        // Remote sync replaces data, never the local transient selection.
        selectedNodeId: current.selectedNodeId,
        selectedEdgeId: current.selectedEdgeId,
      });
    } finally {
      suspendGraphBroadcast = false;
    }
  });
}