"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  Wand2,
  X,
} from "lucide-react";
import type { editor } from "monaco-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { pushToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useResizablePanel } from "@/hooks/use-resizable-panel";
import {
  analyzeRobustness,
  computeStats,
  SQL_DIALECTS,
  type SqlDialect,
} from "@/lib/engine/codegen";
import { computeHealthScore } from "@/lib/engine/health-score";
import { parseOutline } from "@/lib/engine/outline";
import { downloadTextFile } from "@/lib/export/image";
import { useGraphStore } from "@/store/graph-store";
import {
  useCodeWorkspaceStore,
  type WorkspaceFile,
} from "@/store/code-workspace-store";
import { useGlobalHistoryShortcuts } from "@/hooks/use-global-history-shortcuts";
import { MonacoCodeEditor } from "./monaco-code-editor";
import { FileTree } from "./file-tree";
import { RightSidebar } from "./right-sidebar";


/**
 * Full-screen "Code Studio": a modular, VS Code-inspired IDE over the graph AST.
 * - Left: folder-structured virtual file explorer (Prisma / SQL / Types / Docs).
 * - Center: editor tab strip + Monaco editor + quick actions (copy / format /
 *   download / revert).
 * - Right: interactive diagnostics wired to the Health Score and schema errors.
 *
 * Code generation is gated behind this view. The graph AST is derived with a
 * deferred value so rapid canvas edits stay responsive, and pushed into the
 * dedicated {@link useCodeWorkspaceStore} VFS (which preserves manual edits on
 * dirty files across regenerations).
 */
export function CodeStudio() {
  const tables = useGraphStore((s) => s.tables);
  const relations = useGraphStore((s) => s.relations);
  const enums = useGraphStore((s) => s.enums);
  const validationIssues = useGraphStore((s) => s.validationIssues);
  const getSchemaAst = useGraphStore((s) => s.getSchemaAst);
  const selectNode = useGraphStore((s) => s.selectNode);
  const router = useRouter();

  // VFS store — the single source of truth for the editor's files & tabs.
  const files = useCodeWorkspaceStore((s) => s.files);
  const openTabIds = useCodeWorkspaceStore((s) => s.openTabIds);
  const activeFileId = useCodeWorkspaceStore((s) => s.activeFileId);
  const syncFiles = useCodeWorkspaceStore((s) => s.syncFiles);
  const openFile = useCodeWorkspaceStore((s) => s.openFile);
  const closeTab = useCodeWorkspaceStore((s) => s.closeTab);
  const updateFileContent = useCodeWorkspaceStore((s) => s.updateFileContent);
  const revertFile = useCodeWorkspaceStore((s) => s.revertFile);

  // Modular right sidebar state (active tab, outline symbols, reveal bus, config).
  const activeRightSidebarTab = useCodeWorkspaceStore((s) => s.activeRightSidebarTab);
  const setActiveRightSidebarTab = useCodeWorkspaceStore((s) => s.setActiveRightSidebarTab);
  const parsedSymbols = useCodeWorkspaceStore((s) => s.parsedSymbols);
  const setParsedSymbols = useCodeWorkspaceStore((s) => s.setParsedSymbols);
  const revealRequest = useCodeWorkspaceStore((s) => s.revealRequest);
  const requestRevealLine = useCodeWorkspaceStore((s) => s.requestRevealLine);
  const codegenOptions = useCodeWorkspaceStore((s) => s.codegenOptions);
  const updateCodegenOptions = useCodeWorkspaceStore((s) => s.updateCodegenOptions);

  const [copied, setCopied] = useState(false);
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>("postgresql");
  const [hoverTableId, setHoverTableId] = useState<string | null>(null);
  const [zen, setZen] = useState(false);
  const editorInstanceRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useGlobalHistoryShortcuts();

  const fileTreePanel = useResizablePanel({
    storageKey: "archstudio:panel-width:studio-files",
    defaultWidth: 256,
    minWidth: 180,
    maxWidth: 420,
    side: "right",
  });
  const diagnosticsPanel = useResizablePanel({
    storageKey: "archstudio:panel-width:studio-sidebar",
    defaultWidth: 384,
    minWidth: 280,
    maxWidth: 520,
    side: "left",
  });

  // Zen mode: Alt+Z toggles, Esc exits. Ignored inside editable fields.
  // Also listens to the ⌘K palette bus (archstudio:toggle-zen).
  useEffect(() => {
    const onBusToggle = (): void => setZen((v) => !v);
    window.addEventListener("archstudio:toggle-zen", onBusToggle);
    return () => window.removeEventListener("archstudio:toggle-zen", onBusToggle);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editable =
        target && typeof target.closest === "function"
          ? Boolean(
              target.closest(
                'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]',
              ),
            )
          : false;
      if (event.altKey && (event.key === "z" || event.key === "Z") && !editable) {
        event.preventDefault();
        setZen((v) => !v);
        return;
      }
      if (event.key === "Escape" && zen && !editable) {
        setZen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zen]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const ast = useMemo(
    () => getSchemaAst(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tables, relations, enums],
  );
  const deferredAst = useDeferredValue(ast);

  // Push the (deferred) AST into the VFS store. The store reconciles the file
  // set, preserving manual edits on dirty files, so we only feed it data. It
  // also re-runs whenever the codegen options change (provider / urlEnv / file
  // toggles) so a Config edit regenerates the VFS immediately.
  useEffect(() => {
    syncFiles(deferredAst);
  }, [deferredAst, syncFiles, codegenOptions]);

  const stats = useMemo(() => computeStats(deferredAst), [deferredAst]);
  const alerts = useMemo(() => analyzeRobustness(deferredAst), [deferredAst]);
  const health = useMemo(
    () => computeHealthScore(tables, relations, validationIssues),
    [tables, relations, validationIssues],
  );

  const activeFile: WorkspaceFile | undefined =
    files.find((f) => f.id === activeFileId) ?? files[0];

  // Files currently open in the tab strip, resolved from the VFS.
  const openFiles = useMemo(
    () =>
      openTabIds
        .map((id) => files.find((f) => f.id === id))
        .filter((f): f is WorkspaceFile => f !== undefined),
    [openTabIds, files],
  );

  // Locate a table's block in a file: Prisma `model X {` or SQL `CREATE TABLE X`.
  const findTableLines = useCallback(
    (tableName: string, content: string): number[] => {
      const lines = content.split("\n");
      const found: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes(`model ${tableName} {`) ||
          (lines[i].includes("CREATE TABLE") && lines[i].includes(`"${tableName}"`)) ||
          (lines[i].includes("CREATE TABLE") && lines[i].includes(`\`${tableName}\``))
        ) {
          found.push(i + 1);
        }
      }
      return found;
    },
    [],
  );

  // Lines to highlight: when hovering a diagnostic row, find the table's block
  // in the active file so Monaco can paint a whole-line decoration.
  const highlightLines = useMemo(() => {
    if (!hoverTableId || !activeFile) return [];
    const table = tables.find((t) => t.id === hoverTableId);
    if (!table) return [];
    return findTableLines(table.name, activeFile.content);
  }, [hoverTableId, activeFile, tables, findTableLines]);

  // Outline: re-parse the active file whenever its content or language changes,
  // so the symbol tree tracks manual Monaco edits instantly.
  useEffect(() => {
    if (!activeFile) {
      setParsedSymbols([]);
      return;
    }
    setParsedSymbols(parseOutline(activeFile.content, activeFile.language));
  }, [activeFile, setParsedSymbols]);

  // Reveal bus: when the Outline/Diagnostics panel requests a line, scroll the
  // live Monaco instance to it and place the cursor. The nonce lets the same
  // line be re-requested (e.g. clicking the same symbol twice).
  useEffect(() => {
    const instance = editorInstanceRef.current;
    if (!instance || !revealRequest) return;
    instance.revealLineInCenter(revealRequest.line);
    instance.setPosition({ lineNumber: revealRequest.line, column: 1 });
    instance.focus();
  }, [revealRequest]);

  // Select a SQL dialect: open the matching dialect file + keep state in sync.
  const handleSelectDialect = useCallback(
    (dialect: SqlDialect) => {
      setSqlDialect(dialect);
      openFile(`sql-${dialect}`);
    },
    [openFile],
  );

  const handleCopy = useCallback(() => {
    if (!activeFile) return;
    void navigator.clipboard
      .writeText(activeFile.content)
      .catch(() => undefined)
      .finally(() => {
        setCopied(true);
        if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => {
          setCopied(false);
          copyTimerRef.current = null;
        }, 2000);
      });
  }, [activeFile]);

  // "Format": run Monaco's built-in document formatter on the active model.
  const handleFormat = useCallback(() => {
    const instance = editorInstanceRef.current;
    if (!instance) return;
    void instance.getAction("editor.action.formatDocument")?.run();
  }, []);

  // "Revert": discard manual edits, restoring the generated baseline.
  const handleRevert = useCallback(() => {
    if (!activeFile?.dirty) return;
    revertFile(activeFile.id);
    pushToast("Modifications annulées", {
      type: "info",
      description: `${activeFile.filename} restauré depuis le schéma.`,
    });
  }, [activeFile, revertFile]);

  const handleDownloadSingle = useCallback(() => {
    if (!activeFile) return;
    downloadTextFile(activeFile.filename, activeFile.content);
    pushToast("Fichier téléchargé", { type: "success", description: activeFile.filename });
  }, [activeFile]);

  const handleDownloadAll = useCallback(() => {
    // Browsers block parallel programmatic downloads, so stagger each file by a
    // short delay and confirm once at the end.
    if (files.length === 0) return;
    files.forEach((file, index) => {
      setTimeout(() => downloadTextFile(file.filename, file.content), index * 350);
    });
    pushToast(`${files.length} fichier${files.length === 1 ? "" : "s"} en téléchargement`, {
      type: "success",
      description: "Autorisez les téléchargements multiples si le navigateur le demande.",
    });
  }, [files]);

  const handleGoToTable = useCallback(
    (tableId: string) => {
      selectNode(tableId);
      router.push("/studio");
    },
    [selectNode, router],
  );

  // Diagnostics → editor: reveal the table's first matching line in Monaco.
  const handleRevealTable = useCallback(
    (tableId: string) => {
      if (!activeFile) return;
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      const line = findTableLines(table.name, activeFile.content)[0];
      if (line) requestRevealLine(line);
    },
    [activeFile, tables, findTableLines, requestRevealLine],
  );

  const handleEditorReady = useCallback(
    (instance: editor.IStandaloneCodeEditor) => {
      editorInstanceRef.current = instance;
      // Auto-format on regeneration: when the option is on, run the built-in
      // formatter each time a freshly generated document mounts.
      if (codegenOptions.autoFormatOnSave) {
        void instance.getAction("editor.action.formatDocument")?.run();
      }
    },
    [codegenOptions.autoFormatOnSave],
  );

  const dirtyCount = files.reduce((count, f) => count + (f.dirty ? 1 : 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Toolbar */}
      <div className="glass-panel flex shrink-0 items-center gap-2 border-b px-4 py-2 backdrop-blur-md">
        <Button size="sm" variant="outline" onClick={() => router.push("/studio")}>
          <ArrowLeft className="size-4" />
          Retour au Canvas
        </Button>
        <div className="h-5 w-px bg-border" />
        <span className="font-mono text-xs text-muted-foreground">
          {activeFile?.filename}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* SQL dialect switcher — only shown while a SQL file is active. */}
          {activeFile?.kind === "sql" && (
            <>
              <div
                role="radiogroup"
                aria-label="Dialecte SQL"
                className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
              >
                {SQL_DIALECTS.map((dialect) => (
                  <button
                    key={dialect}
                    type="button"
                    role="radio"
                    aria-checked={sqlDialect === dialect}
                    onClick={() => handleSelectDialect(dialect)}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                      sqlDialect === dialect
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {dialect === "postgresql" ? "Postgres" : dialect === "mysql" ? "MySQL" : "SQLite"}
                  </button>
                ))}
              </div>
              <div className="h-5 w-px bg-border" />
            </>
          )}

          <span
            className={cn(
              "size-2 rounded-full",
              health.errorCount > 0
                ? "bg-destructive"
                : health.warningCount > 0
                  ? "bg-amber-500"
                  : "bg-emerald-500",
            )}
            aria-label={`Santé du schéma : ${health.score}%`}
          />
          <Badge variant="secondary">
            {health.score}% · {files.length} fichier{files.length === 1 ? "" : "s"}
          </Badge>
          {dirtyCount > 0 && (
            <Tooltip label="Fichiers modifiés manuellement — cliquez pour tout restaurer">
              <Button size="sm" variant="outline" onClick={handleRevert}>
                <RotateCcw className="size-4" />
                {dirtyCount} modifié{dirtyCount === 1 ? "" : "s"}
              </Button>
            </Tooltip>
          )}

          <Tooltip label="Formater le document" shortcut="mod+shift+i">
            <Button size="sm" variant="outline" onClick={handleFormat}>
              <Wand2 className="size-4" />
              Formater
            </Button>
          </Tooltip>
          <Tooltip label="Copier dans le presse-papiers">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-600" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copier le code
                </>
              )}
            </Button>
          </Tooltip>
          <Tooltip label="Télécharger ce fichier" shortcut="mod+s">
            <Button size="sm" variant="outline" onClick={handleDownloadSingle}>
              <FileDown className="size-4" />
              Télécharger
            </Button>
          </Tooltip>
          <Tooltip label="Télécharger tous les fichiers générés">
            <Button size="sm" onClick={handleDownloadAll}>
              <Download className="size-4" />
              Tout télécharger
            </Button>
          </Tooltip>
          <div className="h-5 w-px bg-border" />
          <Tooltip
            label={zen ? "Quitter le mode Zen" : "Mode Zen — focus éditeur"}
            shortcut="alt+z"
          >
            <Button
              size="sm"
              variant={zen ? "default" : "outline"}
              onClick={() => setZen((v) => !v)}
              aria-pressed={zen}
            >
              {zen ? (
                <>
                  <Minimize2 className="size-4" />
                  Quitter Zen
                </>
              ) : (
                <>
                  <Maximize2 className="size-4" />
                  Zen
                </>
              )}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Editor tab strip (VS Code-style) */}
      {!zen && (
        <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border bg-muted px-1.5 py-1">
          {openFiles.length === 0 ? (
            <span className="px-2 py-1 text-xs text-muted-foreground">
              Ouvrez un fichier depuis l&apos;explorateur →
            </span>
          ) : (
            openFiles.map((file) => {
              const active = file.id === activeFile?.id;
              return (
                <div
                  key={file.id}
                  className={cn(
                    "group/tab flex shrink-0 items-center gap-1.5 rounded-t-md border-t-2 px-2.5 py-1.5 text-xs transition-colors",
                    active
                      ? "border-t-primary bg-background text-foreground"
                      : "border-t-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openFile(file.id)}
                    className="flex items-center gap-1.5 font-mono"
                    aria-current={active ? "true" : undefined}
                  >
                    {file.filename}
                    {file.dirty && (
                      <span
                        aria-hidden
                        title="Modifié"
                        className="size-1.5 rounded-full bg-amber-400"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => closeTab(file.id)}
                    aria-label={`Fermer ${file.filename}`}
                    className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover/tab:opacity-100 hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3 columns: explorer | editor | diagnostics */}
      <div className="flex min-h-0 flex-1">
        {!zen && (
          <>
            <aside
              className="glass-panel shrink-0 overflow-hidden border-r backdrop-blur-md"
              style={{ width: fileTreePanel.width }}
            >
              <FileTree
                files={files}
                activeId={activeFile?.id ?? null}
                openIds={openTabIds}
                onSelect={openFile}
              />
            </aside>
            <ResizeHandle
              side="right"
              label="Redimensionner l'explorateur de fichiers"
              {...fileTreePanel.handleProps}
            />
          </>
        )}

        <main className={cn("min-w-0 flex-1", !zen && "p-3", zen && "p-6")}>
          {activeFile ? (
            <div className="h-full overflow-hidden rounded-lg border border-border shadow-sm">
              <MonacoCodeEditor
                key={activeFile.id}
                value={activeFile.content}
                language={activeFile.language}
                path={`file:///workspace/${activeFile.filename}`}
                onChange={(next) => updateFileContent(activeFile.id, next)}
                highlightLines={highlightLines}
                onReady={handleEditorReady}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Sélectionnez un fichier dans l&apos;explorateur pour l&apos;ouvrir.
            </div>
          )}
        </main>

        {!zen && (
          <>
            <ResizeHandle
              side="left"
              label="Redimensionner le panneau latéral"
              {...diagnosticsPanel.handleProps}
            />
            <aside
              className="glass-panel shrink-0 overflow-hidden border-l backdrop-blur-md"
              style={{ width: diagnosticsPanel.width }}
            >
              <RightSidebar
                activeTab={activeRightSidebarTab}
                onTabChange={setActiveRightSidebarTab}
                symbols={parsedSymbols}
                onRevealLine={requestRevealLine}
                codegenOptions={codegenOptions}
                onCodegenChange={updateCodegenOptions}
                diagnostics={{
                  stats,
                  health,
                  issues: validationIssues,
                  alerts,
                  onGoToTable: handleGoToTable,
                  onRevealTable: handleRevealTable,
                  onHoverTable: setHoverTableId,
                }}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

