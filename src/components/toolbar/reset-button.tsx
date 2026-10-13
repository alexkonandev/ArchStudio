"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGraphStore } from "@/store/graph-store";

export function ResetButton() {
  const resetGraph = useGraphStore((s) => s.resetGraph);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"empty" | "seed">("empty");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
        Clear
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset canvas?</DialogTitle>
          <DialogDescription>This replaces the current schema. This cannot be undone unless you exported it.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant={mode === "empty" ? "default" : "outline"} onClick={() => setMode("empty")}>
            Clear to empty canvas
          </Button>
          <Button variant={mode === "seed" ? "default" : "outline"} onClick={() => setMode("seed")}>
            Reload default seed
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetGraph(mode);
              setOpen(false);
            }}
          >
            Confirm reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
