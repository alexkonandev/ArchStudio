"use client";

import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRESET_TEMPLATES } from "@/lib/templates/presets";
import { useGraphStore } from "@/store/graph-store";

export function TemplatesDialog() {
  const loadSchema = useGraphStore((s) => s.loadSchema);
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const pending = PRESET_TEMPLATES.find((t) => t.id === pendingId) ?? null;

  const confirmLoad = (): void => {
    if (!pending) return;
    loadSchema({ tables: pending.schema.tables, relations: pending.schema.relations, enums: pending.schema.enums });
    setPendingId(null);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setPendingId(null);
      }}
    >
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <LayoutTemplate className="size-4" />
        Templates
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schema templates</DialogTitle>
          <DialogDescription>Loading a template replaces the current canvas. Confirm before applying.</DialogDescription>
        </DialogHeader>
        {!pending ? (
          <ul className="grid gap-2">
            {PRESET_TEMPLATES.map((t) => (
              <li key={t.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="ml-auto flex gap-1">
                    <Badge variant="secondary">{t.schema.tables.length} tables</Badge>
                    <Badge variant="secondary">{t.schema.relations.length} rels</Badge>
                    <Badge variant="secondary">{t.schema.enums.length} enums</Badge>
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {t.schema.tables.map((x) => x.name).join(" · ")}
                </p>
                <Button size="sm" className="mt-2" variant="outline" onClick={() => setPendingId(t.id)}>
                  Preview &amp; Load
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold">Replace canvas with “{pending.name}”?</p>
            <p className="mt-1 text-xs text-muted-foreground">{pending.description}</p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {pending.schema.tables.map((t) => (
                <li key={t.id} className="rounded bg-muted px-2 py-1 font-mono text-[11px]">
                  {t.name} ({t.fields.map((f) => f.name).join(", ")})
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingId(null)}>Back</Button>
              <Button onClick={confirmLoad}>Replace schema</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
