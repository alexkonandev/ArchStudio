"use client";

import { useMemo } from "react";
import {
  Braces,
  ChevronDown,
  FileCode,
  FileDigit,
  FileText,
  Folder,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceFile } from "@/store/code-workspace-store";

const ICONS: Record<WorkspaceFile["kind"], typeof FileText> = {
  prisma: FileCode,
  sql: FileDigit,
  typescript: Braces,
  zod: ShieldCheck,
  report: FileText,
};

/**
 * Folder groups for the explorer, in display order. Each maps to the set of
 * VFS file kinds it owns — this is the "structuré par dossiers" layout
 * (Prisma / SQL / Types / Documentation).
 */
const FOLDERS: { label: string; kinds: WorkspaceFile["kind"][] }[] = [
  { label: "Prisma", kinds: ["prisma"] },
  { label: "SQL", kinds: ["sql"] },
  { label: "Types", kinds: ["typescript", "zod"] },
  { label: "Documentation", kinds: ["report"] },
];

/**
 * Left panel: a VS Code-style file explorer that groups the virtual files into
 * collapsible folders. Selecting a file opens it as a tab; a dot marks files
 * with unsaved edits (dirty state). Pure presentational component.
 */
export function FileTree({
  files,
  activeId,
  openIds,
  onSelect,
}: {
  files: WorkspaceFile[];
  activeId: string | null;
  /** Ids currently open in the tab strip (drives the "open" file styling). */
  openIds: string[];
  onSelect: (id: string) => void;
}) {
  const groups = useMemo(
    () =>
      FOLDERS.map((folder) => ({
        label: folder.label,
        files: files.filter((f) => folder.kinds.includes(f.kind)),
      })).filter((g) => g.files.length > 0),
    [files],
  );

  const openSet = useMemo(() => new Set(openIds), [openIds]);

  return (
    <nav aria-label="Explorateur de fichiers" className="flex h-full flex-col overflow-y-auto p-2">
      {groups.map((group) => {
        const hasActive = group.files.some((f) => f.id === activeId);
        return (
          <details key={group.label} open className="group mb-1.5">
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide uppercase transition-colors select-none",
                hasActive ? "text-foreground" : "text-muted-foreground",
                "hover:text-foreground",
              )}
            >
              <ChevronDown className="size-3.5 shrink-0 transition-transform group-open:rotate-0" />
              {hasActive ? (
                <FolderOpen className="size-4 shrink-0 text-primary" />
              ) : (
                <Folder className="size-4 shrink-0" />
              )}
              {group.label}
            </summary>
            <ul className="mt-0.5 ml-2 flex flex-col gap-0.5 border-l border-border pl-1.5">
              {group.files.map((file) => {
                const Icon = ICONS[file.kind];
                const active = file.id === activeId;
                const open = openSet.has(file.id);
                return (
                  <li key={file.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(file.id)}
                      aria-current={active ? "true" : undefined}
                      title={file.filename}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : open
                            ? "text-foreground hover:bg-muted"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate font-mono">{file.filename}</span>
                      {file.dirty ? (
                        <span
                          aria-label="Modifié"
                          title="Modifications non enregistrées"
                          className="ml-auto size-1.5 shrink-0 rounded-full bg-amber-400"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </nav>
  );
}

