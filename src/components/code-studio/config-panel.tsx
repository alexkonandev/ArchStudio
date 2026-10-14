"use client";

import { Check, Database, FileCode2, Palette, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CodegenOptions } from "@/store/code-workspace-store";

/** The five SQL datasource providers offered by the selector. */
const PROVIDERS: { value: CodegenOptions["provider"]; label: string }[] = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "cockroachdb", label: "CockroachDB" },
  { value: "sqlserver", label: "SQL Server" },
];

/** A labelled section wrapper for the three config groups. */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Database;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 p-4 last:border-b-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-slate-500" />
        <h3 className="text-xs font-semibold tracking-wide text-slate-800 uppercase">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

/** Accessible pill toggle used for the boolean generation options. */
function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50"
    >
      <span
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-slate-900" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      {checked && <Check className="size-4 shrink-0 text-emerald-500" />}
    </button>
  );
}

/**
 * Onglet Config : contrôles visuels qui pilotent la génération de code. Chaque
 * modification met à jour le store Zustand du workspace, ce qui régénère
 * immédiatement le VFS (datasource Prisma + ensemble de fichiers générés).
 */
export function ConfigPanel({
  options,
  onChange,
}: {
  options: CodegenOptions;
  onChange: (patch: Partial<CodegenOptions>) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Provider SQL */}
      <Section icon={Database} title="Provider SQL">
        <label
          htmlFor="cfg-provider"
          className="mb-1.5 block text-xs text-slate-500"
        >
          Datasource Prisma
        </label>
        <Select
          value={options.provider}
          onValueChange={(value) => {
            if (typeof value === "string")
              onChange({ provider: value as CodegenOptions["provider"] });
          }}
        >
          <SelectTrigger id="cfg-provider" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-slate-500">
          Définit le bloc <span className="font-mono">datasource</span> du schéma
          Prisma et la famille de dialectes SQL.
        </p>
      </Section>

      {/* DATABASE_URL */}
      <Section icon={FileCode2} title="Variable d'environnement">
        <label
          htmlFor="cfg-urlenv"
          className="mb-1.5 block text-xs text-slate-500"
        >
          Nom de la variable <span className="font-mono">DATABASE_URL</span>
        </label>
        <Input
          id="cfg-urlenv"
          value={options.urlEnv}
          spellCheck={false}
          onChange={(event) => onChange({ urlEnv: event.target.value })}
          placeholder="DATABASE_URL"
          className="font-mono"
        />
        <p className="mt-2 text-xs text-slate-500">
          Injetée dans <span className="font-mono">url = env("…")</span> du
          datasource.
        </p>
      </Section>

      {/* Génération */}
      <Section icon={Palette} title="Options de génération">
        <div className="flex flex-col gap-2">
          <Toggle
            checked={options.includeZod}
            onChange={(next) => onChange({ includeZod: next })}
            label="Schémas Zod"
            hint="Génère le fichier de validation zod-schemas.ts"
          />
          <Toggle
            checked={options.includeTypeScript}
            onChange={(next) => onChange({ includeTypeScript: next })}
            label="Types TypeScript"
            hint="Génère les interfaces types.ts"
          />
          <Toggle
            checked={options.autoFormatOnSave}
            onChange={(next) => onChange({ autoFormatOnSave: next })}
            label="Formatage automatique"
            hint="Formate le document à chaque régénération"
          />
        </div>
      </Section>

      <div className="mt-auto flex items-start gap-2 bg-slate-50/50 p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p className="text-xs text-slate-500">
          Les modifications sont appliquées immédiatement au système de fichiers
          virtuel et survivent aux bascules d'onglets.
        </p>
      </div>
    </div>
  );
}
