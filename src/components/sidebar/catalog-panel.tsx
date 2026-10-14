"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Menu as MenuIcon,
  OctagonAlert,
  Palette,
  Plus,
  Search,
  Table2,
  Trash2,
} from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { pushToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getTableColorTheme } from "@/lib/table-colors";
import { TABLE_COLORS, type TableColor } from "@/types";
import { useGraphStore } from "@/store/graph-store";

type Filter = "all" | "no-pk" | "errors";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "no-pk", label: "Sans PK" },
  { id: "errors", label: "En erreur" },
];

const menuItemClass =
  "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-muted";

/**
 * Left catalogue: instant search + quality filters + selected state over the
 * graph tables. Each row surfaces its color, primary-key / error status and
 * column count, with a contextual menu for quick node actions.
 */
export function CatalogPanel() {
  const tables = useGraphStore((state) => state.tables);
  const validationIssues = useGraphStore((state) => state.validationIssues);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const addTable = useGraphStore((state) => state.addTable);
  const selectNode = useGraphStore((state) => state.selectNode);
  const duplicateTable = useGraphStore((state) => state.duplicateTable);
  const removeTable = useGraphStore((state) => state.removeTable);
  const setTableColor = useGraphStore((state) => state.setTableColor);

  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const submit = () => {
    addTable(name || `Table${tables.length + 1}`);
    setName("");
  };

  const issueByTable = useMemo(() => {
    const map = new Map<string, { error: boolean; warning: boolean }>();
    for (const issue of validationIssues) {
      const id = issue.target.tableId;
      const cur = map.get(id) ?? { error: false, warning: false };
      if (issue.severity === "error") cur.error = true;
      else cur.warning = true;
      map.set(id, cur);
    }
    return map;
  }, [validationIssues]);

  const visibleTables = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tables.filter((table) => {
      if (q) {
        const haystack = `${table.name} ${table.fields.map((f) => f.name).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      const status = issueByTable.get(table.id);
      if (filter === "no-pk" && table.fields.some((f) => f.isPrimaryKey)) return false;
      if (filter === "errors" && !status?.error) return false;
      return true;
    });
  }, [tables, query, filter, issueByTable]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      {/* Create */}
      <div>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Ajouter une table
        </h2>
        <div className="mt-2 flex gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="Nom de la table"
            className="h-8"
          />
          <Button size="icon" className="size-8 shrink-0" onClick={submit} title="Ajouter">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une table ou un champ…"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                filter === f.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            {visibleTables.length}/{tables.length}
          </span>
        </div>
      </div>

      {/* List (templates live in the Topbar quick-access — undoable). */}
      <div className="min-h-0 flex-1">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Tables
        </h2>
        {visibleTables.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Aucune table ne correspond.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 overflow-y-auto glass-scroll">
            {visibleTables.map((table) => (
              <CatalogRow
                key={table.id}
                name={table.name}
                fieldCount={table.fields.length}
                hasPk={table.fields.some((f) => f.isPrimaryKey)}
                color={table.color}
                status={issueByTable.get(table.id)}
                active={table.id === selectedNodeId}
                onSelect={() => selectNode(table.id)}
                onDuplicate={() => {
                  duplicateTable(table.id);
                  pushToast(`Table « ${table.name} » dupliquée`, { type: "success" });
                }}
                onColor={(swatch) => setTableColor(table.id, swatch)}
                onRemove={() => {
                  removeTable(table.id);
                  pushToast(`Table « ${table.name} » supprimée`, {
                    type: "info",
                    description: "Annulable via Ctrl+Z.",
                  });
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CatalogRow({
  name,
  fieldCount,
  hasPk,
  color,
  status,
  active,
  onSelect,
  onDuplicate,
  onColor,
  onRemove,
}: {
  name: string
  fieldCount: number
  hasPk: boolean
  color?: TableColor
  status?: { error: boolean; warning: boolean }
  active: boolean
  onSelect: () => void
  onDuplicate: () => void
  onColor: (swatch: TableColor) => void
  onRemove: () => void
}) {
  const theme = getTableColorTheme(color);
  return (
    <li>
      <div
        className={cn(
          "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
          active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted",
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className={cn("size-2 shrink-0 rounded-full", theme.dot)} />
          <Table2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm">{name}</span>
          {status?.error ? (
            <OctagonAlert className="size-3.5 shrink-0 text-destructive" aria-label="Erreur" />
          ) : !hasPk ? (
            <span
              className="shrink-0 rounded bg-amber-500/15 px-1 text-[10px] font-medium text-amber-600"
              title="Sans clé primaire"
            >
              PK
            </span>
          ) : null}
        </button>
        <Badge variant="secondary">{fieldCount}</Badge>

        <Menu.Root>
          <Menu.Trigger
            aria-label={`Actions pour ${name}`}
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 data-popup-open:bg-muted data-popup-open:opacity-100"
          >
            <MenuIcon className="size-3.5" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="right" align="start" sideOffset={6} className="z-50">
              <Menu.Popup className="glass-panel min-w-40 rounded-lg p-1 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md">
                <Menu.Item className={menuItemClass} onClick={onDuplicate}>
                  <Copy className="size-3.5" /> Dupliquer
                  <span className="ml-auto flex gap-0.5">
                    <Kbd>Ctrl</Kbd>
                    <Kbd>D</Kbd>
                  </span>
                </Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className={menuItemClass}>
                    <Palette className="size-3.5" /> Couleur
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner side="right" align="start" sideOffset={4} className="z-50">
                      <Menu.Popup className="glass-panel min-w-32 rounded-lg p-1 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md">
                        {TABLE_COLORS.map((swatch) => (
                          <Menu.Item
                            key={swatch}
                            className={menuItemClass}
                            onClick={() => onColor(swatch)}
                          >
                            <span
                              className={cn(
                                "size-3 rounded-full ring-1 ring-slate-300",
                                getTableColorTheme(swatch).dot,
                              )}
                            />
                            {swatch}
                          </Menu.Item>
                        ))}
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
                <Menu.Item
                  className={cn(menuItemClass, "text-destructive data-highlighted:bg-destructive/10")}
                  onClick={onRemove}
                >
                  <Trash2 className="size-3.5" /> Supprimer
                  <span className="ml-auto flex gap-0.5">
                    <Kbd>⌫</Kbd>
                  </span>
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>
    </li>
  );
}
