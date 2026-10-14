"use client";

import { useState } from "react";
import { pushToast } from "@/components/ui/toast";
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
import { QUICK_STARTERS } from "@/lib/templates/quick-starters";
import { useGraphStore } from "@/store/graph-store";
import type { ParsedSchema } from "@/lib/engine/parser";

export function TemplatesDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const applyQuickStarter = useGraphStore((s) => s.applyQuickStarter);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const all = [
    ...QUICK_STARTERS.map((q) => ({
      id: `quick-${q.id}`,
      name: q.name,
      description: q.description,
      schema: q.schema as ParsedSchema,
      tag: "Démarrage",
    })),
    ...PRESET_TEMPLATES.map((t) => ({
      id: `preset-${t.id}`,
      name: t.name,
      description: t.description,
      schema: t.schema as ParsedSchema,
      tag: "Preset",
    })),
  ];

  const pending = all.find((t) => t.id === pendingId) ?? null;

  const confirmLoad = (): void => {
    if (!pending) return;
    // Undoable: single checkpoint inside applyQuickStarter (Ctrl+Z restores).
    applyQuickStarter(pending.schema);
    setPendingId(null);
    onOpenChange(false);
    pushToast(`Modèle « ${pending.name} » chargé`, {
      type: "success",
      description: `${pending.schema.tables.length} table(s) · ${pending.schema.relations.length} relation(s). Annulable via Ctrl+Z.`,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setPendingId(null);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modèles de schéma</DialogTitle>
          <DialogDescription>Charger un modèle remplace le canvas actuel. Confirmez avant d&apos;appliquer.</DialogDescription>
        </DialogHeader>
        {!pending ? (
          <ul className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1">
            {all.map((t) => (
              <li key={t.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <Badge variant="outline" className="ml-1">{t.tag}</Badge>
                  <span className="ml-auto flex gap-1">
                    <Badge variant="secondary">{t.schema.tables.length} tables</Badge>
                    <Badge variant="secondary">{t.schema.relations.length} relations</Badge>
                    <Badge variant="secondary">{t.schema.enums.length} énums</Badge>
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {t.schema.tables.map((x) => x.name).join(" · ")}
                </p>
                <Button size="sm" className="mt-2" variant="outline" onClick={() => setPendingId(t.id)}>
                  Aperçu et chargement
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold">Remplacer le canvas par « {pending.name} » ?</p>
            <p className="mt-1 text-xs text-muted-foreground">{pending.description}</p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {pending.schema.tables.map((t) => (
                <li key={t.id} className="rounded bg-muted px-2 py-1 font-mono text-[11px]">
                  {t.name} ({t.fields.map((f) => f.name).join(", ")})
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingId(null)}>Retour</Button>
              <Button onClick={confirmLoad}>Remplacer le schéma</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
