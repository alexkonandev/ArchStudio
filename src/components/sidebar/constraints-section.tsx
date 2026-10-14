"use client";

import { ListPlus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Relation, Table } from "@/types";

interface ConstraintsSectionProps {
  table: Table;
  relations: Relation[];
  tables: Table[];
  indexField: string;
  setIndexField: (value: string) => void;
  indexUnique: boolean;
  setIndexUnique: (value: boolean) => void;
  onAddIndex: () => void;
  onRemoveIndex: (indexId: string) => void;
  onToggleIndexUnique: (indexId: string) => void;
}

/** Constraints tab: index management (CRUD) + incoming/outgoing relations. */
export function ConstraintsSection({
  table,
  relations,
  tables,
  indexField,
  setIndexField,
  indexUnique,
  setIndexUnique,
  onAddIndex,
  onRemoveIndex,
  onToggleIndexUnique,
}: ConstraintsSectionProps) {
  const fieldName = (id: string) =>
    table.fields.find((f) => f.id === id)?.name ?? id;
  const tableName = (id: string) => tables.find((t) => t.id === id)?.name ?? id;
  const outgoing = relations.filter((r) => r.fromTableId === table.id);
  const incoming = relations.filter((r) => r.toTableId === table.id);
  const indexes = table.indexes ?? [];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Index
          </h3>
          <Badge variant="secondary">{indexes.length}</Badge>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <select
            value={indexField}
            onChange={(event) => setIndexField(event.target.value)}
            aria-label="Champ à indexer"
            className="h-7 flex-1 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
          >
            <option value="">Champ…</option>
            {table.fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIndexUnique(!indexUnique)}
            aria-pressed={indexUnique}
            className={cn(
              "h-7 shrink-0 rounded-md border px-2 font-mono text-[11px] transition-colors",
              indexUnique
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
            title="Index unique"
          >
            UQ
          </button>
          <Button
            size="icon"
            className="size-7 shrink-0"
            onClick={onAddIndex}
            disabled={!indexField}
            title="Ajouter l'index"
          >
            <ListPlus className="size-3.5" />
          </Button>
        </div>

        {indexes.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Aucun index.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {indexes.map((index) => (
              <li
                key={index.id}
                className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5"
              >
                <Zap className="size-3.5 shrink-0 text-sky-500" />
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {index.fieldIds.map(fieldName).join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleIndexUnique(index.id)}
                  aria-pressed={index.unique}
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                    index.unique
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  title="Basculer unique"
                >
                  {index.unique ? "UNIQUE" : "index"}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => onRemoveIndex(index.id)}
                  title="Supprimer l'index"
                >
                  <Trash2 className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Relations
        </h3>
        {outgoing.length + incoming.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Aucune relation.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {outgoing.map((rel) => (
              <RelationRow
                key={rel.id}
                badge="FK"
                label={`${table.name} → ${tableName(rel.toTableId)}`}
                type={rel.type}
              />
            ))}
            {incoming.map((rel) => (
              <RelationRow
                key={rel.id}
                badge="réf"
                label={`${tableName(rel.fromTableId)} → ${table.name}`}
                type={rel.type}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RelationRow({
  badge,
  label,
  type,
}: {
  badge: string;
  label: string;
  type: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-xs">
      <span className="shrink-0 rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[10px] text-indigo-600">
        {badge}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
        {type === "one-to-one" ? "1:1" : type === "one-to-many" ? "1:N" : "N:M"}
      </span>
    </li>
  );
}

