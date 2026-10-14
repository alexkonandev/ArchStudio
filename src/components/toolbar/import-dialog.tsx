"use client";

import { useRef, useState } from "react";
import {
  CircleAlert,
  CircleCheckBig,
  CloudUpload,
  LoaderCircle,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  parsePrismaSchema,
  parseSqlSchema,
  validateStoredSchema,
} from "@/lib/engine";
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

type Format = "prisma" | "sql";

const ACCEPTED_EXTENSIONS = [".prisma", ".sql", ".json", ".txt"] as const;
const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

const getExtension = (fileName: string): string => {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx).toLowerCase();
};

/** Pick a parser tab from the file name, falling back to content sniffing. */
const detectFormat = (fileName: string, content: string): Format => {
  const ext = getExtension(fileName);
  if (ext === ".sql") return "sql";
  if (ext === ".prisma") return "prisma";
  const looksSql =
    /\bCREATE\s+(TABLE|TYPE|SCHEMA)\b/i.test(content) ||
    /\bALTER\s+TABLE\b/i.test(content);
  const looksPrisma =
    /\bmodel\s+[A-Za-z_]/i.test(content) || /\benum\s+[A-Za-z_]/i.test(content);
  if (looksSql && !looksPrisma) return "sql";
  return "prisma";
};

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const loadSchema = useGraphStore((s) => s.loadSchema);
  const [tab, setTab] = useState<Format>("prisma");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFeedback = (): void => {
    setError(null);
    setSuccess(null);
  };

  const handleLoadSample = (): void => {
    const sample = tab === "prisma" ? PRISMA_SAMPLE : SQL_SAMPLE;
    setCode(sample);
    parseAndLoad(sample, tab);
  };

  const parseAndLoad = (source?: string, format?: Format): void => {
    const text = source ?? code;
    const activeFormat = format ?? tab;
    resetFeedback();
    if (!text.trim()) {
      setError("Collez d'abord du code — ou déposez un fichier ci-dessus.");
      return;
    }
    try {
      const parsed =
        activeFormat === "prisma" ? parsePrismaSchema(text) : parseSqlSchema(text);
      if (parsed.tables.length === 0) {
        throw new Error("Aucune table trouvée dans le contenu fourni.");
      }
      loadSchema(parsed);
      setSuccess(
        `Chargement effectué : ${parsed.tables.length} table(s), ${parsed.relations.length} relation(s), ${parsed.enums.length} enum(s).`,
      );
      pushToast("Schéma importé", {
        type: "success",
        description: `${parsed.tables.length} table(s), ${parsed.relations.length} relation(s).`,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Syntaxe invalide — rien n'a été importé.",
      );
    }
  };

  const loadFromJson = (content: string): void => {
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch {
      setError("JSON invalide — le fichier n'a pas pu être analysé.");
      return;
    }
    const validated = validateStoredSchema(data);
    if (!validated || validated.tables.length === 0) {
      setError("Le fichier JSON ne contient pas de schéma valide (aucune table trouvée).");
      return;
    }
    loadSchema({
      tables: validated.tables,
      relations: validated.relations,
      enums: validated.enums,
    });
    setSuccess(
      `Chargement effectué : ${validated.tables.length} table(s), ${validated.relations.length} relation(s), ${validated.enums.length} enum(s).`,
    );
    pushToast("Schéma importé", {
      type: "success",
      description: `${validated.tables.length} table(s) depuis JSON.`,
    });
  };

  const handleFiles = async (files: FileList | null): Promise<void> => {
    const file = files?.[0];
    if (!file) return;
    resetFeedback();

    const ext = getExtension(file.name);
    if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
      setError(
        `Type de fichier non pris en charge « ${ext || file.name} ». Autorisés : ${ACCEPTED_EXTENSIONS.join(", ")}.`,
      );
      return;
    }

    setIsReading(true);
    try {
      const content = await file.text();
      if (ext === ".json") {
        loadFromJson(content);
      } else {
        const format = detectFormat(file.name, content);
        setTab(format);
        setCode(content);
        parseAndLoad(content, format);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Impossible de lire le fichier : ${err.message}`
          : "Impossible de lire le fichier.",
      );
    } finally {
      setIsReading(false);
    }
  };

  const browse = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setError(null);
          setSuccess(null);
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un schéma</DialogTitle>
          <DialogDescription>
            Déposez un fichier <code className="rounded bg-muted px-1">.prisma</code>,{" "}
            <code className="rounded bg-muted px-1">.sql</code>,{" "}
            <code className="rounded bg-muted px-1">.json</code> ou{" "}
            <code className="rounded bg-muted px-1">.txt</code>, ou collez du code
            ci-dessous. L&apos;analyse est tolérante ; les relations sont reconstruites.
          </DialogDescription>
        </DialogHeader>

        <DropZone
          onFiles={(files) => void handleFiles(files)}
          onBrowse={browse}
          isReading={isReading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou collez manuellement
          <span className="h-px flex-1 bg-border" />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Format)}>
          <TabsList>
            <TabsTrigger value="prisma">Prisma</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
          </TabsList>
          <TabsContent value="prisma">
            <CodeBox code={code} setCode={setCode} label="schéma Prisma" />
          </TabsContent>
          <TabsContent value="sql">
            <CodeBox code={code} setCode={setCode} label="DDL PostgreSQL" />
          </TabsContent>
        </Tabs>

        <div aria-live="polite" className="flex flex-col gap-2">
          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {success && (
            <p className="flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-700">
              <CircleCheckBig className="mt-0.5 size-4 shrink-0" />
              <span>{success}</span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleLoadSample} disabled={isReading}>
            Charger un exemple
          </Button>
          <Button onClick={() => parseAndLoad()} disabled={isReading}>
            {isReading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Lecture…
              </>
            ) : (
              "Analyser et charger"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DropZone({
  onFiles,
  onBrowse,
  isReading,
}: {
  onFiles: (files: FileList | null) => void;
  onBrowse: () => void;
  isReading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={isReading}
      onClick={() => !isReading && onBrowse()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isReading) onBrowse();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isReading) setIsDragging(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!isReading) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isReading) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-input bg-muted/40 hover:border-ring hover:bg-muted",
        isReading && "pointer-events-none opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full transition-colors",
          isDragging
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground",
        )}
      >
        {isReading ? (
          <LoaderCircle className="size-5 animate-spin" />
        ) : (
          <CloudUpload className="size-5" />
        )}
      </span>
      <p className="text-sm font-medium">
        {isReading
          ? "Lecture du fichier…"
          : isDragging
            ? "Déposez pour importer"
            : "Glissez un fichier .prisma, .sql, .json ou .txt ici"}
      </p>
      <p className="text-xs text-muted-foreground">
        ou cliquez pour parcourir · {ACCEPTED_EXTENSIONS.join(", ")}
      </p>
    </div>
  );
}

function CodeBox({ code, setCode, label }: { code: string; setCode: (v: string) => void; label: string }) {
  return (
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder={`Collez votre ${label} ici…`}
      spellCheck={false}
      className="h-64 w-full rounded-lg border border-input bg-white p-3 font-mono text-xs text-slate-700 outline-none focus-visible:border-ring"
    />
  );
}
