"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parsePrismaSchema, parseSqlSchema } from "@/lib/engine";
import { useGraphStore } from "@/store/graph-store";

const PRISMA_SAMPLE = `model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int   @id @default(autoincrement())
  title    String
  authorId Int?
  author   User  @relation(fields: [authorId], references: [id])
}`;

const SQL_SAMPLE = `CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "role" "Role" NOT NULL DEFAULT 'USER'
);`;

export function ImportDialog() {
  const loadSchema = useGraphStore((s) => s.loadSchema);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("prisma");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fillSample = (): void => {
    setCode(tab === "prisma" ? PRISMA_SAMPLE : SQL_SAMPLE);
    setError(null);
    setSuccess(null);
  };

  const parseAndLoad = (): void => {
    setError(null);
    setSuccess(null);
    if (!code.trim()) {
      setError("Paste some code first — or click “Load sample”.");
      return;
    }
    try {
      const parsed = tab === "prisma" ? parsePrismaSchema(code) : parseSqlSchema(code);
      if (parsed.tables.length === 0) throw new Error("No tables found in the pasted code.");
      loadSchema(parsed);
      const rel = parsed.relations.length;
      const en = parsed.enums.length;
      setSuccess(`Loaded ${parsed.tables.length} table(s), ${rel} relation(s), ${en} enum(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid syntax — nothing was imported.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setError(null);
          setSuccess(null);
        }
      }}
    >
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FileUp className="size-4" />
        Import
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import schema</DialogTitle>
          <DialogDescription>Paste Prisma or Postgres SQL — parsing is tolerant, relations are rebuilt.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="prisma">Prisma</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
          </TabsList>
          <TabsContent value="prisma">
            <CodeBox code={code} setCode={setCode} label="Prisma schema" />
          </TabsContent>
          <TabsContent value="sql">
            <CodeBox code={code} setCode={setCode} label="Postgres DDL" />
          </TabsContent>
        </Tabs>
        {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
        {success && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-400">{success}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={fillSample}>Load sample</Button>
          <Button onClick={parseAndLoad}>Parse &amp; Load</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CodeBox({ code, setCode, label }: { code: string; setCode: (v: string) => void; label: string }) {
  return (
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder={`Paste ${label} here…`}
      spellCheck={false}
      className="h-64 w-full rounded-lg border border-input bg-muted p-3 font-mono text-xs outline-none focus-visible:border-ring"
    />
  );
}
