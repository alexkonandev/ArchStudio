"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Code2,
  Database,
  Frame,
  Keyboard,
  LayoutGrid,
  LayoutTemplate,
  OctagonAlert,
  MoreHorizontal,
  Redo2,
  Search,
  Undo2,
  Users,
  Wand2,
} from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { pushToast } from "@/components/ui/toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGraphStore } from "@/store/graph-store";
import { countNormalizations } from "@/lib/engine/normalize";
import { HealthPill } from "./health-pill";
import { ImportDialog } from "./import-dialog";
import { TemplatesDialog } from "./templates-dialog";
import { ExportMenu } from "./export-menu";
import { ResetButton } from "./reset-button";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { CollabToolbar } from "@/components/collab/collab-toolbar";
import { useCollabStore } from "@/store/collab-store";
import { type CommandDialogKind } from "./command-palette";
import { useFocusStore, toggleCanvasFocus } from "@/store/focus-store";

/** Human summary of a one-click normalisation, for the toast body. */
function describeNormalization(summary: {
  addedPk: string[];
  promotedPk: string[];
  fixedFkTypes: string[];
  addedIndexes: string[];
}): string {
  const parts: string[] = [];
  const pkCount = summary.addedPk.length + summary.promotedPk.length;
  if (pkCount) parts.push(`${pkCount} clé(s) primaire(s)`);
  if (summary.fixedFkTypes.length) parts.push(`${summary.fixedFkTypes.length} type(s) FK corrigé(s)`);
  if (summary.addedIndexes.length) parts.push(`${summary.addedIndexes.length} index unique(s)`);
  return parts.join(" · ");
}

const menuItemClass =
  "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none select-none data-highlighted:bg-muted";

export function StudioHeader() {
  const tables = useGraphStore((state) => state.tables);
  const relations = useGraphStore((state) => state.relations);
  const validationIssues = useGraphStore((state) => state.validationIssues);
  const applyAutoLayout = useGraphStore((state) => state.applyAutoLayout);
  const normalizeSchema = useGraphStore((state) => state.normalizeSchema);
  const autoDetectRelations = useGraphStore(
    (state) => state.autoDetectRelations,
  );
  const selectNode = useGraphStore((state) => state.selectNode);
  const hydrateFromStorage = useGraphStore((state) => state.hydrateFromStorage);
  const undo = useGraphStore((state) => state.undo);
  const redo = useGraphStore((state) => state.redo);
  // Reactive subscription: re-render the buttons when history changes.
  const historyVersion = useGraphStore((state) => state.historyVersion);
  const canUndo = useGraphStore((state) => state.canUndo)();
  const canRedo = useGraphStore((state) => state.canRedo)();
  const pushActivity = useCollabStore((state) => state.pushActivity);
  const focusCanvasOnly = useFocusStore((state) => state.focusCanvasOnly);
  void historyVersion;
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [fileAction, setFileAction] = useState<
    null | "import" | "templates" | "export" | "reset"
  >(null);


  useEffect(() => {
    hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Command-palette bus: open any header dialog from ⌘K actions.
  useEffect(() => {
    const onCommand = (event: Event) => {
      const kind = (event as CustomEvent<CommandDialogKind>).detail;
      if (kind === "issues") setIssuesOpen(true);
      else if (kind === "shortcuts") setShortcutsOpen(true);
      else setFileAction(kind);
    };
    window.addEventListener("archstudio:open-dialog", onCommand);
    return () => window.removeEventListener("archstudio:open-dialog", onCommand);
  }, []);

  const errorCount = validationIssues.filter((i) => i.severity === "error").length;
  const warningCount = validationIssues.filter(
    (i) => i.severity === "warning",
  ).length;
  const tableNameOf = (tableId: string) =>
    tables.find((t) => t.id === tableId)?.name ?? tableId;

  const handleNormalize = () => {
    const summary = normalizeSchema();
    if (summary.noop) {
      pushToast("Schéma déjà optimal", {
        type: "success",
        description: "Rien à normaliser.",
      });
      return;
    }
    const count = countNormalizations(summary);
    pushActivity("normalize", `a appliqué la normalisation (${count} corrections)`);
    pushToast(`${count} correction${count === 1 ? "" : "s"} appliquée${count === 1 ? "" : "s"}`, {
      type: "success",
      description: describeNormalization(summary),
    });
  };

  const handleAutoLayout = () => {
    applyAutoLayout();
    pushActivity("create", `a réorganisé la disposition (${tables.length} tables)`);
    pushToast(
      `${tables.length} table${tables.length === 1 ? "" : "s"} réorganisée${tables.length === 1 ? "" : "s"}`,
      { type: "success", description: "Disposition automatique appliquée." },
    );
  };

  const openFileAction = (action: NonNullable<typeof fileAction>) =>
    setFileAction(action);

  const handleAutoDetect = () => {
    const summary = autoDetectRelations();
    if (summary.created === 0) {
      pushToast("Aucune relation orpheline détectée", {
        type: "info",
        description:
          "Les conventions de nommage n'ont révélé aucune jointure manquante.",
      });
      return;
    }
    pushActivity(
      "create",
      `a auto-détecté ${summary.created} relation${summary.created === 1 ? "" : "s"}`,
    );
    pushToast(
      `${summary.created} relation${summary.created === 1 ? "" : "s"} créée${summary.created === 1 ? "" : "s"}`,
      {
        type: "success",
        description: `${summary.links.slice(0, 3).join(" · ")}${summary.links.length > 3 ? " · …" : ""} · annulable via Ctrl+Z.`,
      },
    );
  };

  return (
    <header
      data-testid="studio-header"
      className="glass-panel flex h-14 shrink-0 items-center gap-3 border-b backdrop-blur-md px-4"
    >
      <Link
        href="/"
        className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="ArchStudio — accueil"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Database className="size-4" />
        </span>
        <h1 className="text-base font-semibold tracking-tight">ArchStudio</h1>
      </Link>

      <div className="hidden items-center gap-2 lg:flex">
        <Badge variant="secondary">{tables.length} table{tables.length === 1 ? "" : "s"}</Badge>
        <Badge variant="secondary">{relations.length} relation{relations.length === 1 ? "" : "s"}</Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Tooltip label="Annuler" shortcut="mod+z">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Annuler"
            >
              <Undo2 className="size-4" />
            </Button>
          </Tooltip>
          <Tooltip label="Rétablir" shortcut="mod+shift+z">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Rétablir"
            >
              <Redo2 className="size-4" />
            </Button>
          </Tooltip>
        </div>

        <HealthPill
          onOpenIssues={() => setIssuesOpen(true)}
          onNormalize={handleNormalize}
        />

        {/* Grouped file / schema actions — collapses to a single menu so the
            topbar never overflows on narrow viewports. */}
        <Menu.Root>
          <Menu.Trigger
            aria-label="Actions du fichier"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted"
          >
            <MoreHorizontal className="size-4" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
              <Menu.Popup className="glass-panel min-w-44 rounded-xl p-1 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md">
                <Menu.Item className={menuItemClass} onClick={handleAutoDetect}>
                  <Wand2 className="size-4" />
                  Auto-détecter les relations
                </Menu.Item>
                <Menu.Item className={menuItemClass} onClick={() => openFileAction("import")}>
                  Importer
                </Menu.Item>
                <Menu.Item className={menuItemClass} onClick={() => openFileAction("templates")}>
                  Modèles
                </Menu.Item>
                <Menu.Item className={menuItemClass} onClick={() => openFileAction("export")}>
                  Exporter
                </Menu.Item>
                <Menu.Item
                  className={cn(menuItemClass, "text-destructive data-highlighted:bg-destructive/10")}
                  onClick={() => openFileAction("reset")}
                >
                  Effacer
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>

        <span className="hidden xl:inline-flex">
          <Tooltip label="Disposition automatique" shortcut="A">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoLayout}
            >
              <LayoutGrid className="size-4" />
              Disposition
            </Button>
          </Tooltip>
        </span>
        {/* Smart-join: scan the schema and auto-wire orphan relations (undoable). */}
        <Tooltip label="Auto-détecter les relations (annulable)" side="bottom">
          <Button size="sm" variant="outline" onClick={handleAutoDetect}>
            <Wand2 className="size-4" />
            Auto-détecter
          </Button>
        </Tooltip>
        {/* Quick-access Templates (moved from sidebar): undoable + toast. */}
        <Tooltip label="Modèles — Démarrage & Presets (annulable)" side="bottom">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openFileAction("templates")}
          >
            <LayoutTemplate className="size-4" />
            Modèles
          </Button>
        </Tooltip>
        <Button
          size="sm"
          variant="default"
          nativeButton={false}
          render={<Link href="/studio/code" />}
        >
          <Code2 className="size-4" />
          Studio de Code
        </Button>

        <Tooltip label="Palette de commandes" shortcut="mod+k" side="bottom">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
              )
            }
            aria-label="Palette de commandes (Ctrl+K)"
          >
            <Search className="size-4" />
          </Button>
        </Tooltip>

        <Tooltip label="Revue collaborative — curseurs temps réel" side="bottom">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => window.dispatchEvent(new CustomEvent("archstudio:toggle-collab"))}
            aria-label="Basculer la revue collaborative"
          >
            <Users className="size-4" />
          </Button>
        </Tooltip>

        <CollabToolbar />

        <Tooltip label="Focus Graphe — plein écran canvas" shortcut="shift+z" side="bottom">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={toggleCanvasFocus}
            aria-pressed={focusCanvasOnly}
            aria-label="Basculer le Focus Graphe (Shift+Z)"
          >
            <Frame className="size-4" />
          </Button>
        </Tooltip>

        <Tooltip label="Raccourcis clavier" shortcut="?" side="bottom">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Raccourcis clavier"
          >
            <Keyboard className="size-4" />
          </Button>
        </Tooltip>
      </div>

      {/* Controlled dialogs opened from the grouped menu. */}
      <ImportDialog
        open={fileAction === "import"}
        onOpenChange={(open) => setFileAction(open ? "import" : null)}
      />
      <TemplatesDialog
        open={fileAction === "templates"}
        onOpenChange={(open) => setFileAction(open ? "templates" : null)}
      />
      <ExportMenu
        open={fileAction === "export"}
        onOpenChange={(open) => setFileAction(open ? "export" : null)}
      />
      <ResetButton
        open={fileAction === "reset"}
        onOpenChange={(open) => setFileAction(open ? "reset" : null)}
      />

        <Sheet open={issuesOpen} onOpenChange={setIssuesOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Rapport de validation</SheetTitle>
              <SheetDescription>
                {errorCount} erreur{errorCount === 1 ? "" : "s"}, {warningCount}{" "}
                avertissement{warningCount === 1 ? "" : "s"} détecté
                {errorCount + warningCount === 1 ? "" : "s"} dans le graphe.
              </SheetDescription>
            </SheetHeader>
            <ul className="flex flex-col gap-2 overflow-y-auto p-4">
              {validationIssues.length === 0 && (
                <li className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                  Le graphe est sain. Aucune erreur ni avertissement.
                </li>
              )}
              {validationIssues.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    {issue.severity === "error" ? (
                      <OctagonAlert className="size-4 shrink-0 text-destructive" />
                    ) : (
                      <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                    )}
                    <Badge
                      variant={
                        issue.severity === "error" ? "destructive" : "secondary"
                      }
                    >
                      {issue.severity === "error" ? "erreur" : "avertissement"}
                    </Badge>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {tableNameOf(issue.target.tableId)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs">{issue.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      selectNode(issue.target.tableId);
                      setIssuesOpen(false);
                    }}
                  >
                    Aller à {tableNameOf(issue.target.tableId)}
                  </Button>
                </li>
              ))}
            </ul>
          </SheetContent>
        </Sheet>

        {/* Global keyboard cheatsheet, opened with `?` or the header button. */}
        <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}
