"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGraphStore } from "@/store/graph-store";

export function ResetButton({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const resetGraph = useGraphStore((s) => s.resetGraph);
  const [mode, setMode] = useState<"empty" | "seed">("empty");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Réinitialiser le canvas ?</DialogTitle>
          <DialogDescription>Cette action remplace le schéma actuel. Elle est irréversible sauf si vous l&apos;avez exporté.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant={mode === "empty" ? "default" : "outline"} onClick={() => setMode("empty")}>
            Effacer vers un canvas vide
          </Button>
          <Button variant={mode === "seed" ? "default" : "outline"} onClick={() => setMode("seed")}>
            Recharger le modèle par défaut
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetGraph(mode);
              onOpenChange(false);
              pushToast(
                mode === "empty" ? "Canvas effacé" : "Modèle par défaut rechargé",
                { type: "info", description: "Exportez avant pour conserver une copie." },
              );
            }}
          >
            Confirmer la réinitialisation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
