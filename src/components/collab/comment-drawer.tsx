"use client";

import { useMemo, useState } from "react";
import { Check, MessageSquare, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCollabStore } from "@/store/collab-store";
import { useGraphStore } from "@/store/graph-store";
import { Avatar } from "./avatar";

/** Comment threads drawer anchored to a single table. */
export function CommentDrawer() {
  const activeTableId = useCollabStore((s) => s.activeCommentTableId);
  const setActiveTableId = useCollabStore((s) => s.setActiveCommentTableId);
  const comments = useCollabStore((s) => s.comments);
  const self = useCollabStore((s) => s.self);
  const addComment = useCollabStore((s) => s.addComment);
  const resolveComment = useCollabStore((s) => s.resolveComment);
  const canEdit = useCollabStore((s) => s.canEditTable);
  const tableName = useGraphStore(
    (s) => s.tables.find((t) => t.id === activeTableId)?.name,
  );

  const [draft, setDraft] = useState("");

  const thread = useMemo(
    () =>
      comments
        .filter((c) => c.tableId === activeTableId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [comments, activeTableId],
  );

  const unresolvedCount = thread.filter((c) => !c.resolved).length;
  const canComment = activeTableId ? canEdit(activeTableId) : false;

  const submit = () => {
    if (!activeTableId || !draft.trim()) return;
    addComment(activeTableId, draft);
    setDraft("");
  };

  return (
    <Sheet
      open={Boolean(activeTableId)}
      onOpenChange={(open) => {
        if (!open) {
          setDraft("");
          setActiveTableId(null);
        }
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            Commentaires
            {tableName && (
              <span className="font-mono text-xs text-muted-foreground">
                {tableName}
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            {unresolvedCount > 0
              ? `${unresolvedCount} fil(s) non résolu(s).`
              : "Aucun fil ouvert sur cette table."}
          </SheetDescription>
        </SheetHeader>

        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 pt-0">
          {thread.length === 0 && (
            <li className="rounded-lg border border-border p-3 text-center text-xs text-muted-foreground">
              Aucun commentaire. Ajoutez une note pour lancer la discussion.
            </li>
          )}
          {thread.map((comment) => (
            <li
              key={comment.id}
              className={cn(
                "rounded-lg border p-2.5 transition-colors",
                comment.resolved
                  ? "border-border/60 bg-muted/40 opacity-70"
                  : "border-border bg-background",
              )}
            >
              <div className="flex items-center gap-2">
                <Avatar
                  name={comment.authorName}
                  color={comment.authorId === self.id ? self.avatarColor : "#e2e8f0"}
                  role="editor"
                  size="sm"
                />
                <span className="truncate text-xs font-medium">
                  {comment.authorName}
                </span>
                {comment.resolved && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                    <Check className="size-3" /> Résolu
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "mt-1.5 text-sm",
                  comment.resolved && "text-muted-foreground line-through",
                )}
              >
                {comment.text}
              </p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
                {!comment.resolved ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => resolveComment(comment.id, true)}
                  >
                    <Check className="size-3" /> Résoudre
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => resolveComment(comment.id, false)}
                  >
                    Réouvrir
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {canComment && (
          <div className="flex items-center gap-2 border-t p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Ajouter un commentaire…"
              className="h-9 flex-1"
            />
            <Button
              size="icon"
              className="size-9"
              onClick={submit}
              disabled={!draft.trim()}
              aria-label="Envoyer le commentaire"
            >
              <Send className="size-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

