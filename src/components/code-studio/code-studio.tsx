"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileDown,
  LayoutGrid,
  Maximize2,
  Minimize2,
} from "lucide-react";
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
  generateCodeFiles,
  SQL_DIALECTS,
  type CodeFile,
  type SqlDialect,
} from "@/lib/engine/codegen";
import { downloadTextFile } from "@/lib/export/image";
import { useGraphStore } from "@/store/graph-store";
import { useGlobalHistoryShortcuts } from "@/hooks/use-global-history-shortcuts";
import { CodeEditor } from "./code-editor";
import { FileTree } from "./file-tree";
import { DiagnosticsPanel } from "./diagnostics-panel";

/**
 * Full-screen "Code Studio": a 3-column IDE-style workspace over the graph AST.
 * - Left: virtual file tree (Prisma / SQL dialects / TS / Zod / report).
 * - Center: format tabs + read-only code editor with line numbers.
 * - Right: live diagnostics & robustness analysis.
 *
 * Code generation is gated behind this view and fed a deferred AST so rapid
 * canvas edits stay responsive.
 */
export function CodeStudio() {
  const tables = useGraphStore((s) => s.tables);
  const relations = useGraphStore((s) => s.relations);
  const enums = useGraphStore((s) => s.enums);
  const getSchemaAst = useGraphStore((s) => s.getSchemaAst);
  const selectNode = useGraphStore((s) => s.selectNode);
  const router = useRouter();

  const [activeId, setActiveId] = useState("prisma");
  const [copied, setCopied] = useState(false);
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>("postgresql");
  const [hoverTableId, setHoverTableId] = useState<string | null>(null);
  const [zen, setZen] = useState(false);
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
    storageKey: "archstudio:panel-width:studio-diagnostics",
    defaultWidth: 320,
    minWidth: 240,
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

  const files = useMemo(() => generateCodeFiles(deferredAst), [deferredAst]);
  const stats = useMemo(() => computeStats(deferredAst), [deferredAst]);
  const alerts = useMemo(() => analyzeRobustness(deferredAst), [deferredAst]);

  const activeFile: CodeFile | undefined =
    files.find((f) => f.id === activeId) ?? files[0];

  // Lines to highlight: when hovering an alert row, find the table's block in
  // the active file (Prisma `model X {` or SQL `CREATE TABLE X (`).
  const highlightLines = useMemo(() => {
    if (!hoverTableId || !activeFile) return [];
    const table = tables.find((t) => t.id === hoverTableId);
    if (!table) return [];
    const lines = activeFile.content.split("\n");
    const found: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (
        lines[i].includes(`model ${table.name} {`) ||
        lines[i].includes(`CREATE TABLE`) && lines[i].includes(`"${table.name}"`) ||
        lines[i].includes(`CREATE TABLE`) && lines[i].includes(`\`${table.name}\``)
      ) {
        found.push(i + 1);
      }
    }
    return found;
  }, [hoverTableId, activeFile, tables]);

  // Select a SQL dialect: switch active file + keep dialect in sync.
  const handleSelectDialect = useCallback((dialect: SqlDialect) => {
    setSqlDialect(dialect);
    setActiveId(`sql-${dialect}`);
  }, []);

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

  const errorCount = alerts.filter((a) => a.severity === "error").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

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
              errorCount > 0
                ? "bg-destructive"
                : warningCount > 0
                  ? "bg-amber-500"
                  : "bg-emerald-500",
            )}
          />
          <Badge variant="secondary">{files.length} fichier{files.length === 1 ? "" : "s"}</Badge>

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

      {/* Format tabs */}
      {!zen && (
      <div className="glass-panel flex shrink-0 items-center gap-1 overflow-x-auto border-b px-2 py-1.5 backdrop-blur-md">
        <LayoutGrid className="mr-1 size-3.5 shrink-0 text-muted-foreground" />
        {files.map((file) => {
          const active = file.id === activeFile?.id;
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => setActiveId(file.id)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {file.label}
            </button>
          );
        })}
      </div>
      )}

      {/* 3 columns */}
      <div className="flex min-h-0 flex-1">
        {!zen && (
          <>
            <aside
              className="glass-panel shrink-0 overflow-hidden border-r backdrop-blur-md"
              style={{ width: fileTreePanel.width }}
            >
              <FileTree files={files} activeId={activeFile?.id ?? ""} onSelect={setActiveId} />
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
            <CodeEditor
              content={activeFile.content}
              language={activeFile.language}
              highlightLines={highlightLines}
            />
          ) : null}
        </main>

        {!zen && (
          <>
            <ResizeHandle
              side="left"
              label="Redimensionner les diagnostics"
              {...diagnosticsPanel.handleProps}
            />
            <aside
              className="glass-panel shrink-0 overflow-hidden border-l backdrop-blur-md"
              style={{ width: diagnosticsPanel.width }}
            >
              <DiagnosticsPanel
                stats={stats}
                alerts={alerts}
                onGoToTable={handleGoToTable}
                onHoverTable={setHoverTableId}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

