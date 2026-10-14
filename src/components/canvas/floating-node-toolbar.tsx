"use client";

import { useState } from "react";
import { Copy, MessageSquare, Palette, Plus, Trash2 } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
import { TABLE_COLORS, type TableColor } from "@/types";
import { useGraphStore } from "@/store/graph-store";
import { useCollabStore } from "@/store/collab-store";
import { TABLE_COLOR_THEMES } from "@/lib/table-colors";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FloatingNodeToolbarProps {
  tableId: string;
  /** Only shown while the owning node is selected. */
  visible: boolean;
}

/**
 * Contextual quick-actions bar suspended above a selected table node
 * (Figma-style floating node actions).
 *
 * Rendered *inside* the node so it pans/zooms with the canvas. The `nodrag`
 * class prevents React Flow from starting a node drag when the bar is used.
 */
export function FloatingNodeToolbar({ tableId, visible }: FloatingNodeToolbarProps) {
  const fieldCount = useGraphStore(
    (state) => state.tables.find((t) => t.id === tableId)?.fields.length ?? 0,
  );
  const color = useGraphStore(
    (state) => state.tables.find((t) => t.id === tableId)?.color,
  );
  const addField = useGraphStore((state) => state.addField);
  const duplicateTable = useGraphStore((state) => state.duplicateTable);
  const removeTable = useGraphStore((state) => state.removeTable);
  const setTableColor = useGraphStore((state) => state.setTableColor);
  const setActiveCommentTableId = useCollabStore(
    (state) => state.setActiveCommentTableId,
  );
  const addComment = useCollabStore((state) => state.addComment);
  const [quickComment, setQuickComment] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);

  if (!visible) return null;

  const handleAddField = () => {
    addField(tableId, {
      name: `champ${fieldCount + 1}`,
      type: "String",
      defaultValue: "",
      isUpdatedAt: false,
      isUnique: false,
      isNullable: true,
      nullable: true,
      unique: false,
      isPrimaryKey: false,
    });
  };

  const submitQuickComment = () => {
    if (!quickComment.trim()) return;
    addComment(tableId, quickComment);
    setQuickComment("");
    setCommentOpen(false);
  };


  const actionClass =
    "flex size-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95";

  return (
    <div
      className={cn(
        "nodrag absolute -top-11 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5",
        "rounded-lg border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur-md",
        "transition-all duration-200",
      )}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Tooltip label="Ajouter un champ">
        <button
          type="button"
          className={actionClass}
          onClick={handleAddField}
          aria-label="Ajouter un champ"
        >
          <Plus className="size-4" />
        </button>
      </Tooltip>

      <Popover.Root open={commentOpen} onOpenChange={setCommentOpen}>
        <Tooltip label="Note rapide / commentaires">
          <Popover.Trigger
            className={cn(actionClass, "nodrag")}
            aria-label="Ajouter un commentaire"
          >
            <MessageSquare className="size-4" />
          </Popover.Trigger>
        </Tooltip>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} className="z-50">
            <Popover.Popup className="w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
              <p className="mb-2 px-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Note rapide
              </p>
              <Input
                autoFocus
                value={quickComment}
                onChange={(e) => setQuickComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitQuickComment();
                }}
                placeholder="Commenter cette table…"
                className="h-8 text-sm"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => {
                    setActiveCommentTableId(tableId);
                    setCommentOpen(false);
                  }}
                >
                  Voir le fil
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-3 text-[11px]"
                  onClick={submitQuickComment}
                  disabled={!quickComment.trim()}
                >
                  Publier
                </Button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      <Popover.Root>
        <Popover.Trigger
          className={cn(actionClass, "nodrag")}
          title="Couleur du modèle"
          aria-label="Couleur du modèle"
        >
          <Palette className="size-4" />
          <span
            className={cn(
              "absolute right-1 bottom-1 size-2 rounded-full ring-1 ring-white",
              TABLE_COLOR_THEMES[color ?? "slate"].dot,
            )}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} className="z-50">
            <Popover.Popup className="rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
              <p className="mb-2 px-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Couleur
              </p>
              <div className="flex items-center gap-1.5">
                {TABLE_COLORS.map((swatch: TableColor) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setTableColor(tableId, swatch)}
                    title={swatch}
                    aria-label={`Couleur ${swatch}`}
                    className={cn(
                      "size-6 rounded-full ring-1 ring-slate-200 transition-transform hover:scale-110",
                      TABLE_COLOR_THEMES[swatch].dot,
                      color === swatch && "ring-2 ring-slate-900 ring-offset-1",
                    )}
                  />
                ))}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      <span className="mx-0.5 h-5 w-px bg-slate-200" />

      <Tooltip label="Dupliquer la table" shortcut="mod+d">
        <button
          type="button"
          className={actionClass}
          onClick={() => duplicateTable(tableId)}
          aria-label="Dupliquer la table"
        >
          <Copy className="size-4" />
        </button>
      </Tooltip>

      <Tooltip label="Supprimer la table" shortcut="del">
        <button
          type="button"
          className={cn(
            actionClass,
            "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
          )}
          onClick={() => removeTable(tableId)}
          aria-label="Supprimer la table"
        >
          <Trash2 className="size-4" />
        </button>
      </Tooltip>
    </div>
  );
}
