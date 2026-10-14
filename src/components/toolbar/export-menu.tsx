"use client";

import { useState } from "react";
import { Archive, FileJson, FileCode2, FileDigit, ImageDown, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compileToPrisma, compileToSql } from "@/lib/engine";
import { downloadTextFile, exportCanvasPng, exportCanvasSvg, exportProjectZip } from "@/lib/export/image";
import { useGraphStore } from "@/store/graph-store";

export function ExportMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const getSchemaAst = useGraphStore((s) => s.getSchemaAst);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const doExport = (kind: "json" | "prisma" | "sql"): void => {
    const ast = getSchemaAst();
    if (kind === "json") {
      downloadTextFile("schema.json", JSON.stringify(ast, null, 2), "application/json");
      setStatus("schema.json téléchargé.");
    } else if (kind === "prisma") {
      downloadTextFile("schema.prisma", compileToPrisma(ast));
      setStatus("schema.prisma téléchargé.");
    } else {
      downloadTextFile("schema.sql", compileToSql(ast));
      setStatus("schema.sql téléchargé.");
    }
    pushToast("Export terminé", { type: "success", description: exportFilename(kind) });
  };

  const runAsync = async (key: string, label: string, task: () => Promise<void>): Promise<void> => {
    setBusy(key);
    try {
      await task();
      setStatus(`${label} téléchargé.`);
      pushToast("Export terminé", { type: "success", description: label });
    } catch (err) {
      const message = err instanceof Error ? err.message : `Échec de l'export ${label}.`;
      setStatus(message);
      pushToast(`Échec de l'export ${label}`, { type: "error", description: message });
    } finally {
      setBusy(null);
    }
  };

  const doPng = (): Promise<void> =>
    runAsync("png", "archstudio-diagram@3x.png", () => exportCanvasPng("archstudio-diagram@3x.png", 3));

  const doSvg = (): Promise<void> =>
    runAsync("svg", "archstudio-diagram.svg", () => exportCanvasSvg());

  const doZip = (): Promise<void> =>
    runAsync("zip", "archstudio-project.zip", () => exportProjectZip(getSchemaAst()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter le schéma</DialogTitle>
          <DialogDescription>Téléchargez le graphe actuel dans le format de votre choix.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant="default" className="justify-start" disabled={busy !== null} onClick={() => void doZip()}>
            <Archive className="size-4" /> {busy === "zip" ? "Compression…" : "Pack projet complet (.zip)"}
          </Button>
          <p className="-mt-1 text-[11px] text-muted-foreground">
            Prisma · SQL ×3 · TypeScript · Zod · rapport MD · JSON + README.
          </p>
          <Button variant="outline" className="justify-start" onClick={() => doExport("json")}>
            <FileJson className="size-4" /> Schéma JSON (.json, réimportable)
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => doExport("prisma")}>
            <FileCode2 className="size-4" /> Fichier Prisma (schema.prisma)
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => doExport("sql")}>
            <FileDigit className="size-4" /> Migration SQL (schema.sql)
          </Button>
          <Button variant="outline" className="justify-start" disabled={busy !== null} onClick={() => void doPng()}>
            <ImageDown className="size-4" /> {busy === "png" ? "Rendu HD…" : "Image PNG HD ×3 (diagramme épuré)"}
          </Button>
          <Button variant="outline" className="justify-start" disabled={busy !== null} onClick={() => void doSvg()}>
            <Shapes className="size-4" /> {busy === "svg" ? "Rendu…" : "Image SVG vectorielle (diagramme épuré)"}
          </Button>
        </div>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </DialogContent>
    </Dialog>
  );
}

/** Filename label for a text export kind (used in the toast body). */
function exportFilename(kind: "json" | "prisma" | "sql"): string {
  return kind === "json"
    ? "schema.json"
    : kind === "prisma"
      ? "schema.prisma"
      : "schema.sql";
}
