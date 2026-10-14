"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Code2,
  Database,
  Download,
  Frame,
  Keyboard,
  LayoutGrid,
  LayoutTemplate,
  Maximize2,
  OctagonAlert,
  Redo2,
  Search,
  Table2,
  Undo2,
  Upload,
  Users,
  Wand2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { pushToast } from "@/components/ui/toast";
import { useGraphStore } from "@/store/graph-store";
import { toggleCanvasFocus } from "@/store/focus-store";
import { countNormalizations } from "@/lib/engine/normalize";

/**
 * Cross-component command bus: the palette lives in the root layout, while the
 * dialogs it can open (import, templates, export, issues, shortcuts) are owned
 * by the header on the canvas route. The palette simply broadcasts an event.
 */
export type CommandDialogKind =
  | "import"
  | "templates"
  | "export"
  | "issues"
  | "shortcuts";

export function openStudioDialog(kind: CommandDialogKind): void {
  window.dispatchEvent(
    new CustomEvent<CommandDialogKind>("archstudio:open-dialog", {
      detail: kind,
    }),
  );
}

export function toggleZenMode(): void {
  window.dispatchEvent(new CustomEvent("archstudio:toggle-zen"));
}

export function toggleCollabMode(): void {
  window.dispatchEvent(new CustomEvent("archstudio:toggle-collab"));
}

interface PaletteAction {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords: string;
  run: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const openRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const tables = useGraphStore((s) => s.tables);
  const validationIssues = useGraphStore((s) => s.validationIssues);

  // Opening resets the query/selection and focuses the search field. Centralised
  // here so both the ⌘K shortcut and the dialog's own close/open share one path
  // (and no setState happens inside an effect body).
  const openPalette = (next: boolean) => {
    openRef.current = next;
    if (next) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
    setOpen(next);
  };

  // Ctrl+K / ⌘K toggles the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette(!openRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const actions = useMemo<PaletteAction[]>(() => {
    const st = useGraphStore.getState();
    const base: PaletteAction[] = [
      {
        id: "auto-layout",
        group: "Canvas",
        label: "Disposition automatique",
        hint: "Réorganise le graphe",
        icon: <LayoutGrid className="size-4" />,
        keywords: "layout disposition auto grille",
        run: () => {
          st.applyAutoLayout();
          pushToast("Disposition automatique appliquée", { type: "success" });
        },
      },
      {
        id: "normalize",
        group: "Canvas",
        label: "Normalisation 1-click",
        hint: "PK FK index",
        icon: <Wand2 className="size-4" />,
        keywords: "normaliser pk fk index unique",
        run: () => {
          const summary = st.normalizeSchema();
          const c = countNormalizations(summary);
          pushToast(
            c === 0
              ? "Schéma déjà optimal"
              : `${c} correction${c === 1 ? "" : "s"} appliquée${c === 1 ? "" : "s"}`,
            { type: c === 0 ? "info" : "success" },
          );
        },
      },
      {
        id: "undo",
        group: "Historique",
        label: "Annuler",
        hint: "Ctrl+Z",
        icon: <Undo2 className="size-4" />,
        keywords: "undo annuler retour",
        run: () => st.undo(),
      },
      {
        id: "redo",
        group: "Historique",
        label: "Rétablir",
        hint: "Ctrl+Shift+Z",
        icon: <Redo2 className="size-4" />,
        keywords: "redo retablir refaire",
        run: () => st.redo(),
      },
      {
        id: "templates",
        group: "Schéma",
        label: "Charger un modèle…",
        hint: "Démarrage & Presets",
        icon: <LayoutTemplate className="size-4" />,
        keywords: "template modele preset demarrage",
        run: () => openStudioDialog("templates"),
      },
      {
        id: "import",
        group: "Schéma",
        label: "Importer un schéma…",
        hint: "Prisma SQL JSON",
        icon: <Upload className="size-4" />,
        keywords: "import importer prisma sql json",
        run: () => openStudioDialog("import"),
      },
      {
        id: "export",
        group: "Schéma",
        label: "Exporter…",
        hint: "ZIP PNG HD Prisma SQL",
        icon: <Download className="size-4" />,
        keywords: "export zip png hd prisma sql",
        run: () => openStudioDialog("export"),
      },
      {
        id: "issues",
        group: "Qualité",
        label: "Voir le rapport de validation…",
        hint: `${validationIssues.length} alerte(s)`,
        icon: <AlertTriangle className="size-4" />,
        keywords: "validation erreur warning rapport",
        run: () => openStudioDialog("issues"),
      },
    ];


    // Display + navigation actions.
    base.push(
      {
        id: "zen",
        group: "Affichage",
        label: "Basculer le mode Zen",
        hint: "Alt+Z",
        icon: <Maximize2 className="size-4" />,
        keywords: "zen focus plein ecran",
        run: () => {
          if (window.location.pathname.startsWith("/studio/code")) {
            toggleZenMode();
          } else {
            router.push("/studio/code");
            pushToast("Mode Zen", {
              type: "info",
              description: "Code Studio ouvert — Alt+Z pour basculer en Zen.",
            });
          }
        },
      },

      {
        id: "focus-canvas",
        group: "Affichage",
        label: "Basculer le Focus Graphe",
        hint: "Shift+Z",
        icon: <Frame className="size-4" />,
        keywords: "focus graphe canvas plein ecran",
        run: () => {
          if (window.location.pathname.startsWith("/studio/code")) {
            router.push("/studio");
            setTimeout(() => toggleCanvasFocus(), 150);
          } else {
            toggleCanvasFocus();
          }
        },
      },
      {
        id: "collab",
        group: "Affichage",
        label: "Basculer la revue collaborative",
        hint: "Curseurs temps réel",
        icon: <Users className="size-4" />,
        keywords:
          "collab collaboration curseur temps reel presence revue figma architecte",
        run: () => {
          if (window.location.pathname.startsWith("/studio/code")) {
            router.push("/studio");
            setTimeout(() => toggleCollabMode(), 150);
          } else {
            toggleCollabMode();
          }
        },
      },
      {
        id: "goto-studio",
        group: "Navigation",
        label: "Aller au Studio de Code",
        hint: "/studio/code",
        icon: <Code2 className="size-4" />,
        keywords: "studio code prisma sql",
        run: () => router.push("/studio/code"),
      },
      {
        id: "goto-canvas",
        group: "Navigation",
        label: "Retour au Canvas",
        hint: "/studio",
        icon: <Database className="size-4" />,
        keywords: "canvas retour graphe",
        run: () => router.push("/studio"),
      },
      {
        id: "shortcuts",
        group: "Aide",
        label: "Raccourcis clavier…",
        hint: "?",
        icon: <Keyboard className="size-4" />,
        keywords: "raccourci aide clavier",
        run: () => openStudioDialog("shortcuts"),
      },
    );

    // Jump to a table.
    for (const t of tables) {
      base.push({
        id: `goto-table-${t.id}`,
        group: "Aller à une table",
        label: `Table : ${t.name}`,
        hint: `${t.fields.length} colonne(s)`,
        icon: <Table2 className="size-4" />,
        keywords: `table ${t.name} ${t.fields.map((f) => f.name).join(" ")}`,
        run: () => {
          st.selectNode(t.id);
          if (window.location.pathname.startsWith("/studio/code")) router.push("/studio");
        },
      });
    }

    // Jump to a validation error / warning.
    for (const issue of validationIssues) {
      base.push({
        id: `goto-issue-${issue.id}`,
        group: "Aller à une erreur",
        label: `${issue.severity === "error" ? "Erreur" : "Avertissement"} : ${issue.message.slice(0, 80)}`,
        hint: "Sélectionne la table",
        icon:
          issue.severity === "error" ? (
            <OctagonAlert className="size-4 text-destructive" />
          ) : (
            <AlertTriangle className="size-4 text-amber-500" />
          ),
        keywords: `erreur ${issue.message} ${issue.target.tableId}`,
        run: () => {
          st.selectNode(issue.target.tableId);
          if (window.location.pathname.startsWith("/studio/code")) router.push("/studio");
        },
      });
    }

    return base;
  }, [tables, validationIssues, router]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q) ||
        a.keywords.toLowerCase().includes(q),
    );
  }, [actions, query]);

  // Clamp the active index when the result set shrinks (derived, no effect).
  const activeIndex =
    filtered.length === 0 ? 0 : Math.min(active, filtered.length - 1);

  const runAction = (action: PaletteAction) => {
    setOpen(false);
    action.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        filtered.length ? (i - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const action = filtered[activeIndex];
      if (action) runAction(action);
    }
  };

  let lastGroup = "";

  return (
    <Dialog open={open} onOpenChange={openPalette}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Palette de commandes</DialogTitle>
          <DialogDescription>
            Recherchez et exécutez une action rapidement.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Rechercher une commande, une table…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            role="combobox"
            aria-expanded={open}
            aria-controls="archstudio-command-list"
          />
          <Kbd>mod+K</Kbd>
        </div>
        <ul
          id="archstudio-command-list"
          role="listbox"
          className="max-h-72 overflow-y-auto px-1 py-1"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              Aucune commande pour « {query} ».
            </li>
          )}
          {filtered.map((action, index) => {
            const showGroup = action.group !== lastGroup;
            lastGroup = action.group;
            return (
              <li key={action.id}>
                {showGroup && (
                  <p className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {action.group}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  data-index={index}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => runAction(action)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    index === activeIndex
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground/80",
                  )}
                >
                  <span className="shrink-0 text-muted-foreground">
                    {action.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {action.label}
                  </span>
                  {action.hint && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {action.hint}
                    </span>
                  )}
                  {index === activeIndex && (
                    <ArrowRight className="size-3.5 shrink-0 text-primary" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="flex items-center gap-2 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> naviguer
          </span>
          <span className="flex items-center gap-0.5">
            <Kbd>↵</Kbd> exécuter
          </span>
          <span className="flex items-center gap-0.5">
            <Kbd>Échap</Kbd> fermer
          </span>
        </p>
      </DialogContent>
    </Dialog>
  );
}

