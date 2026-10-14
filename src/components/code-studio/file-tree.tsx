"use client";

import {
  Braces,
  FileCode,
  FileDigit,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeFile } from "@/lib/engine/codegen";

const ICONS: Record<CodeFile["kind"], typeof FileText> = {
  prisma: FileCode,
  sql: FileDigit,
  typescript: Braces,
  zod: ShieldCheck,
  report: FileText,
};

/**
 * Left panel: virtual file tree grouped by language family. Selecting a file
 * updates the active file in the editor. Pure presentational component.
 */
export function FileTree({
  files,
  activeId,
  onSelect,
}: {
  files: CodeFile[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const groups: { label: string; files: CodeFile[] }[] = [
    { label: "Prisma", files: files.filter((f) => f.kind === "prisma") },
    { label: "SQL", files: files.filter((f) => f.kind === "sql") },
    { label: "TypeScript", files: files.filter((f) => f.kind === "typescript") },
    { label: "Validation", files: files.filter((f) => f.kind === "zod") },
    { label: "Documentation", files: files.filter((f) => f.kind === "report") },
  ].filter((g) => g.files.length > 0);

  return (
    <nav aria-label="Fichiers générés" className="flex h-full flex-col overflow-y-auto p-2">
      {groups.map((group) => (
        <div key={group.label} className="mb-3">
          <p className="px-2 py-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.files.map((file) => {
              const Icon = ICONS[file.kind];
              const active = file.id === activeId;
              return (
                <li key={file.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(file.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate font-mono">{file.filename}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
