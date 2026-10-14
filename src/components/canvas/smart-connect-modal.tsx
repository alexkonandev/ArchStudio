"use client";

import { useMemo } from "react";
import { KeyRound, Link2, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGraphStore } from "@/store/graph-store";
import { analyzeJoin } from "@/lib/engine/smart-join";

/**
 * Smart-connect modal.
 *
 * Opened by the canvas `onConnect` when a relation is traced between two tables
 * that share no compatible foreign-key column. It explains the gap and offers:
 *  - "Créer le champ & lier": one click creates the inferred FK column and wires
 *    the relation (single undoable step via `resolveSmartJoin({ createField })`).
 *  - "Choisir un champ existant": lists the type-compatible columns on the
 *    source table so the user can wire the relation through an existing field.
 */
export function SmartConnectModal() {
  const pending = useGraphStore((state) => state.pendingJoin);
  const tables = useGraphStore((state) => state.tables);
  const resolveSmartJoin = useGraphStore((state) => state.resolveSmartJoin);
  const cancelSmartJoin = useGraphStore((state) => state.cancelSmartJoin);

  const source = useMemo(
    () => tables.find((t) => t.id === pending?.sourceId),
    [tables, pending],
  );
  const target = useMemo(
    () => tables.find((t) => t.id === pending?.targetId),
    [tables, pending],
  );
  const analysis = useMemo(
    () => (source && target ? analyzeJoin(source, target) : null),
    [source, target],
  );

  const open = Boolean(pending && source && target && analysis);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && cancelSmartJoin()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        {open && source && target && analysis && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                Jointure intelligente
              </DialogTitle>
              <DialogDescription>
                Aucune clé étrangère détectée entre{" "}
                <span className="font-semibold text-foreground">
                  {source.name}
                </span>{" "}
                et{" "}
                <span className="font-semibold text-foreground">
                  {target.name}
                </span>
                . Voulez-vous que je crée automatiquement le champ{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
                  {analysis.suggestedFieldName}
                </code>{" "}
                dans{" "}
                <span className="font-semibold text-foreground">
                  {source.name}
                </span>{" "}
                ?
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="font-mono">
                {source.name} · {analysis.cardinality} · {target.name}
              </Badge>
              {analysis.referencedKey && (
                <span>
                  Type hérité de la PK cible :{" "}
                  <code className="font-mono text-foreground">
                    {analysis.referencedKey.type}
                  </code>
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                onClick={() => resolveSmartJoin({ createField: true })}
              >
                <KeyRound className="size-4" />
                Créer le champ &amp; lier
              </Button>

              {analysis.candidates.length > 0 && (
                <div className="rounded-lg border border-border p-2">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    <Link2 className="size-3" />
                    Choisir un champ existant
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.candidates.map((field) => (
                      <Button
                        key={field.id}
                        variant="outline"
                        size="xs"
                        className="font-mono"
                        onClick={() =>
                          resolveSmartJoin({ fromFieldId: field.id })
                        }
                      >
                        {field.name} : {field.type}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="ghost" onClick={cancelSmartJoin}>
                Annuler
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
