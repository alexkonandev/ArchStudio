"use client";

import {
  Boxes,
  Braces,
  Database,
  Hash,
  Heading,
  KeyRound,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutlineSymbol, OutlineSymbolKind } from "@/lib/engine/outline";

/** Icon per outline symbol kind (Prisma / SQL / TS / MD). */
const KIND_ICON: Record<OutlineSymbolKind, LucideIcon> = {
  model: Table2,
  enum: Boxes,
  datasource: Database,
  generator: Braces,
  type: Hash,
  interface: Braces,
  const: KeyRound,
  table: Table2,
  heading: Heading,
};

/** Human label for the member count badge. */
const KIND_MEMBER_LABEL: Record<OutlineSymbolKind, string> = {
  model: "champs",
  enum: "valeurs",
  datasource: "clés",
  generator: "options",
  type: "membres",
  interface: "propriétés",
  const: "propriétés",
  table: "colonnes",
  heading: "niveau",
};

/**
 * Onglet Outline : explorateur de symboles du fichier actif. Chaque entrée est
 * cliquable et demande à Monaco de révéler la ligne correspondante. Liste pure
 * et légère, sans état interne — les symboles viennent du store.
 */
export function OutlinePanel({
  symbols,
  onReveal,
}: {
  symbols: OutlineSymbol[];
  onReveal: (line: number) => void;
}) {
  if (symbols.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Table2 className="size-8 text-slate-300" />
        <p className="text-sm text-slate-800">Aucun symbole détecté</p>
        <p className="max-w-[16rem] text-xs text-slate-500">
          Ouvrez un fichier <span className="font-mono">.prisma</span>,{" "}
          <span className="font-mono">.sql</span> ou <span className="font-mono">.ts</span>{" "}
          pour explorer sa structure.
        </p>
      </div>
    );
  }

  return (
    <nav aria-label="Explorateur de symboles" className="flex h-full flex-col overflow-y-auto p-2">
      <ul className="flex flex-col gap-0.5">
        {symbols.map((symbol) => {
          const Icon = KIND_ICON[symbol.kind];
          return (
            <li key={symbol.id}>
              <button
                type="button"
                onClick={() => onReveal(symbol.line)}
                title={`Aller à la ligne ${symbol.line}`}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-slate-100"
              >
                <Icon className="size-4 shrink-0 text-slate-500 transition-colors group-hover:text-slate-800" />
                <span className="truncate text-sm text-slate-800">{symbol.name}</span>
                {symbol.members > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {symbol.members} {KIND_MEMBER_LABEL[symbol.kind]}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
