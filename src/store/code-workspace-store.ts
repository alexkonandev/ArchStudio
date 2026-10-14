"use client";

import { create } from "zustand";
import type { DatabaseProvider, SchemaAst } from "@/types";
import {
  generateCodeFiles,
  type CodeFile,
  type CodeFileKind,
  type SqlDialect,
} from "@/lib/engine/codegen";
import type { OutlineSymbol } from "@/lib/engine/outline";

/** Active tab of the modular right sidebar. */
export type RightSidebarTab = "outline" | "config" | "diagnostics";

/**
 * Global code-generation configuration, editable from the "Config" tab. Any
 * change is immediately reflected in the regenerated VFS (see `syncFiles`).
 */
export interface CodegenOptions {
  /** Prisma datasource provider (also drives the SQL dialect family). */
  provider: DatabaseProvider;
  /** Name of the env var holding the connection URL (`env("…")` in Prisma). */
  urlEnv: string;
  /** Whether the Zod schemas virtual file is generated. */
  includeZod: boolean;
  /** Whether the TypeScript interfaces virtual file is generated. */
  includeTypeScript: boolean;
  /** Format the active document whenever the schema regenerates. */
  autoFormatOnSave: boolean;
}

/**
 * Editor language hint for a {@link WorkspaceFile}. Mirrors {@link CodeFile}'s
 * `language` field and maps 1:1 onto Monaco language ids (see the
 * `MONACO_LANGUAGE` map in `monaco-code-editor.tsx`).
 */
export type CodeFileLanguage = CodeFile["language"];

/**
 * A single entry of the virtual file system (VFS).
 *
 * Each file carries both the last codegen output (`generatedContent`, an
 * immutable baseline) and the live editor buffer (`content`). `dirty` is true
 * whenever the buffer diverges from the baseline, which lets the UI show an
 * unsaved-changes marker and lets regeneration overwrite only clean files —
 * a user's manual edits on a dirty file survive an AST refresh.
 */
export interface WorkspaceFile {
  /** Stable id (matches the generated {@link CodeFile.id}). */
  id: string;
  kind: CodeFileKind;
  /** Dialect for `kind === "sql"`, otherwise undefined. */
  dialect?: SqlDialect;
  /** File name shown in the tree / tabs and used when downloading. */
  filename: string;
  /** Short label for format tabs. */
  label: string;
  /** Editor language hint. */
  language: CodeFileLanguage;
  /** Last generated content — the immutable baseline for dirty tracking. */
  generatedContent: string;
  /** Current editor buffer (equals `generatedContent` unless edited). */
  content: string;
  /** True when `content` differs from `generatedContent`. */
  dirty: boolean;
}

export interface CodeWorkspaceState {
  /** All virtual files, in stable codegen order. */
  files: WorkspaceFile[];
  /** Opened tab ids, in the order they were opened. */
  openTabIds: string[];
  /** The active (visible) file id, or null when nothing is open. */
  activeFileId: string | null;

  /** Active tab of the modular right sidebar (Outline / Config / Diagnostics). */
  activeRightSidebarTab: RightSidebarTab;
  /** Symbols parsed from the active file, feeding the Outline tab. */
  parsedSymbols: OutlineSymbol[];
  /**
   * Line Monaco should scroll to, plus a monotonic nonce so re-requesting the
   * same line still fires a fresh reveal (a bare number wouldn't re-trigger).
   */
  revealRequest: { line: number; nonce: number } | null;
  /** Global code-generation config, editable from the Config tab. */
  codegenOptions: CodegenOptions;

  /**
   * Regenerate the VFS from a graph AST. Clean files are refreshed in place;
   * dirty files keep their user edits but get an updated baseline. Tabs and
   * the active file are reconciled against the new file set. The datasource
   * (provider + urlEnv) and the Zod / TypeScript file set are applied from the
   * current {@link codegenOptions} so a Config edit regenerates immediately.
   */
  syncFiles: (ast: SchemaAst) => void;
  /** Open a file as a tab (no-op if unknown) and make it active. */
  openFile: (id: string) => void;
  /** Close a tab; activates a neighbour when the active tab is closed. */
  closeTab: (id: string) => void;
  /** Focus an already-known file without forcing it into the tab strip. */
  setActiveFile: (id: string) => void;
  /** Update a file buffer and recompute its dirty flag. */
  updateFileContent: (id: string, content: string) => void;
  /** Discard edits on a file, restoring the generated baseline. */
  revertFile: (id: string) => void;
  /** Discard edits on every dirty file. */
  revertAll: () => void;

  /** Switch the active right-sidebar tab. */
  setActiveRightSidebarTab: (tab: RightSidebarTab) => void;
  /** Replace the parsed symbols shown in the Outline tab. */
  setParsedSymbols: (symbols: OutlineSymbol[]) => void;
  /**
   * Ask Monaco to reveal a 1-based line. Increments an internal nonce so the
   * consumer effect re-fires even when the same line is requested twice.
   */
  requestRevealLine: (line: number) => void;
  /** Patch the code-generation options (provider, urlEnv, file toggles). */
  updateCodegenOptions: (patch: Partial<CodegenOptions>) => void;
}

/** Build a fresh VFS entry from a generated {@link CodeFile}. */
function toWorkspaceFile(file: CodeFile): WorkspaceFile {
  return {
    id: file.id,
    kind: file.kind,
    dialect: file.dialect,
    filename: file.filename,
    label: file.label,
    language: file.language,
    generatedContent: file.content,
    content: file.content,
    dirty: false,
  };
}

/**
 * Dedicated Zustand store for the Code Studio virtual file system.
 *
 * It is intentionally decoupled from the graph store: the graph owns the AST,
 * this store owns the derived, editable artifacts. `syncFiles` is the bridge —
 * the shell calls it with a (deferred) AST so rapid canvas edits regenerate
 * cleanly while preserving in-progress manual edits.
 */
export const useCodeWorkspaceStore = create<CodeWorkspaceState>()((set, get) => ({
  files: [],
  openTabIds: [],
  activeFileId: null,
  activeRightSidebarTab: "outline",
  parsedSymbols: [],
  revealRequest: null,
  codegenOptions: {
    provider: "postgresql",
    urlEnv: "DATABASE_URL",
    includeZod: true,
    includeTypeScript: true,
    autoFormatOnSave: true,
  },

  syncFiles: (ast) =>
    set((state) => {
      const options = state.codegenOptions;
      // Apply the live Config: datasource block + which artifact files exist.
      const effectiveAst: SchemaAst = {
        ...ast,
        datasource: { provider: options.provider, urlEnv: options.urlEnv },
      };
      const allFiles = generateCodeFiles(effectiveAst);
      const generated = allFiles.filter((file) => {
        if (file.kind === "zod") return options.includeZod;
        if (file.kind === "typescript") return options.includeTypeScript;
        return true;
      });
      const byId = new Map(state.files.map((f) => [f.id, f]));

      const files: WorkspaceFile[] = generated.map((gen) => {
        const existing = byId.get(gen.id);
        if (existing) {
          // Preserve user edits on a dirty file; only refresh the baseline and
          // the (potentially renamed) metadata.
          return {
            ...existing,
            kind: gen.kind,
            dialect: gen.dialect,
            filename: gen.filename,
            label: gen.label,
            language: gen.language,
            generatedContent: gen.content,
          };
        }
        return toWorkspaceFile(gen);
      });

      const ids = new Set(files.map((f) => f.id));
      let openTabIds = state.openTabIds.filter((id) => ids.has(id));
      const activeFileId =
        state.activeFileId && ids.has(state.activeFileId)
          ? state.activeFileId
          : (files[0]?.id ?? null);

      // First load (nothing open yet): seed the tab strip with the Prisma
      // schema so the editor and the tab strip start in sync, like an IDE that
      // restores its last session with one file open.
      if (openTabIds.length === 0 && files.length > 0) {
        openTabIds = [files[0].id];
      }

      return { files, openTabIds, activeFileId };
    }),

  openFile: (id) =>
    set((state) => {
      if (!state.files.some((f) => f.id === id)) return state;
      const openTabIds = state.openTabIds.includes(id)
        ? state.openTabIds
        : [...state.openTabIds, id];
      return { openTabIds, activeFileId: id };
    }),

  closeTab: (id) =>
    set((state) => {
      const index = state.openTabIds.indexOf(id);
      if (index === -1) return state;
      const openTabIds = state.openTabIds.filter((tabId) => tabId !== id);
      let activeFileId = state.activeFileId;
      if (activeFileId === id) {
        activeFileId =
          openTabIds[index] ?? openTabIds[index - 1] ?? openTabIds[0] ?? null;
      }
      return { openTabIds, activeFileId };
    }),

  setActiveFile: (id) =>
    set((state) => (state.files.some((f) => f.id === id) ? { activeFileId: id } : state)),

  updateFileContent: (id, content) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, content, dirty: content !== f.generatedContent } : f,
      ),
    })),

  revertFile: (id) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, content: f.generatedContent, dirty: false } : f,
      ),
    })),

  revertAll: () =>
    set((state) => ({
      files: state.files.map((f) =>
        f.dirty ? { ...f, content: f.generatedContent, dirty: false } : f,
      ),
    })),

  setActiveRightSidebarTab: (tab) => set({ activeRightSidebarTab: tab }),

  setParsedSymbols: (symbols) => set({ parsedSymbols: symbols }),

  requestRevealLine: (line) =>
    set((state) => ({
      revealRequest: {
        line,
        nonce: (state.revealRequest?.nonce ?? 0) + 1,
      },
    })),

  updateCodegenOptions: (patch) =>
    set((state) => ({ codegenOptions: { ...state.codegenOptions, ...patch } })),
}));

/** Read-only selector: the active {@link WorkspaceFile}, or undefined. */
export function selectActiveFile(state: CodeWorkspaceState): WorkspaceFile | undefined {
  return state.files.find((f) => f.id === state.activeFileId);
}

/** Read-only selector: number of dirty (edited) files. */
export function selectDirtyCount(state: CodeWorkspaceState): number {
  return state.files.reduce((count, f) => count + (f.dirty ? 1 : 0), 0);
}

