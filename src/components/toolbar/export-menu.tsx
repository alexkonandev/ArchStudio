"use client";

import { useState } from "react";
import { Download, FileJson, FileCode2, FileDigit, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compileToPrisma, compileToSql } from "@/lib/engine";
import { downloadTextFile, exportCanvasPng } from "@/lib/export/image";
import { useGraphStore } from "@/store/graph-store";

export function ExportMenu() {
  const getSchemaAst = useGraphStore((s) => s.getSchemaAst);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const doExport = (kind: "json" | "prisma" | "sql"): void => {
    const ast = getSchemaAst();
    if (kind === "json") {
      downloadTextFile("schema.json", JSON.stringify(ast, null, 2), "application/json");
      setStatus("schema.json downloaded.");
    } else if (kind === "prisma") {
      downloadTextFile("schema.prisma", compileToPrisma(ast));
      setStatus("schema.prisma downloaded.");
    } else {
      downloadTextFile("schema.sql", compileToSql(ast));
      setStatus("schema.sql downloaded.");
    }
  };

  const doPng = async (): Promise<void> => {
    try {
      await exportCanvasPng();
      setStatus("Diagram PNG downloaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "PNG export failed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Download className="size-4" />
        Export
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export schema</DialogTitle>
          <DialogDescription>Download the current graph in any format.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant="outline" className="justify-start" onClick={() => doExport("json")}>
            <FileJson className="size-4" /> JSON Schema (.json, re-importable)
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => doExport("prisma")}>
            <FileCode2 className="size-4" /> Prisma File (schema.prisma)
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => doExport("sql")}>
            <FileDigit className="size-4" /> SQL Migration (schema.sql)
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => void doPng()}>
            <ImageDown className="size-4" /> Image PNG (diagram)
          </Button>
        </div>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </DialogContent>
    </Dialog>
  );
}
