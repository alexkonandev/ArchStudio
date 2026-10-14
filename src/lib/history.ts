import type { Relation, Table } from "@/types";

/**
 * Bounded undo/redo history over immutable graph snapshots.
 *
 * Framework-agnostic and side-effect free: the Zustand store owns one instance
 * (module state, never persisted) and pushes the *pre-mutation* snapshot before
 * each discrete mutation. Transient/derived state (nodes, edges,
 * validationIssues, selection) is intentionally excluded — snapshots only carry
 * `{ tables, relations, enums }`, and the store rebuilds the rest on restore.
 */

export interface GraphSnapshot {
  tables: Table[];
  relations: Relation[];
  enums: GraphSnapshotEnum[];
}

interface GraphSnapshotEnum {
  id: string;
  name: string;
  values: string[];
}

/** Maximum retained undo steps (oldest entries are dropped first). */
export const HISTORY_LIMIT = 50;

export interface HistoryState {
  past: GraphSnapshot[];
  future: GraphSnapshot[];
}

/** Empty history (fresh load, reset, or hydration from storage). */
export function emptyHistory(): HistoryState {
  return { past: [], future: [] };
}

/**
 * Record the pre-mutation snapshot. Any new mutation clears the redo stack
 * (standard linear-undo semantics). Past is capped at {@link HISTORY_LIMIT}.
 */
export function pushHistory(
  history: HistoryState,
  snapshot: GraphSnapshot,
): HistoryState {
  const past = [...history.past, snapshot];
  if (past.length > HISTORY_LIMIT) {
    past.splice(0, past.length - HISTORY_LIMIT);
  }
  return { past, future: [] };
}

/** Undo: returns the snapshot to restore, or `null` when history is empty. */
export function undoHistory(
  history: HistoryState,
  current: GraphSnapshot,
): { state: HistoryState; snapshot: GraphSnapshot } | null {
  if (history.past.length === 0) return null;
  const snapshot = history.past[history.past.length - 1];
  return {
    state: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
    },
    snapshot,
  };
}

/** Redo: returns the snapshot to restore, or `null` when stack is empty. */
export function redoHistory(
  history: HistoryState,
  current: GraphSnapshot,
): { state: HistoryState; snapshot: GraphSnapshot } | null {
  if (history.future.length === 0) return null;
  const [snapshot, ...future] = history.future;
  return {
    state: { past: [...history.past, current], future },
    snapshot,
  };
}

/** Structural snapshot of the current store state (for push/undo/redo). */
export function takeSnapshot(state: {
  tables: Table[];
  relations: Relation[];
  enums: { id: string; name: string; values: string[] }[];
}): GraphSnapshot {
  return {
    tables: structuredClone(state.tables),
    relations: structuredClone(state.relations),
    enums: structuredClone(state.enums),
  };
}
