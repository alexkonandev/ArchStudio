"use client";

import { cn } from "@/lib/utils";
import { describeRelation } from "@/lib/engine/relation-defaults";
import { useGraphStore } from "@/store/graph-store";
import type { Relation, RelationCascade, RelationType } from "@/types";

const CARDINALITY_OPTIONS: { value: RelationType; label: string }[] = [
  { value: "one-to-one", label: "1:1" },
  { value: "one-to-many", label: "1:N" },
  { value: "many-to-many", label: "N:M" },
];

const CASCADE_OPTIONS: { value: RelationCascade; hint: string }[] = [
  { value: "CASCADE", hint: "Supprime en chaine" },
  { value: "RESTRICT", hint: "Bloque si reference" },
  { value: "SET_NULL", hint: "Met a NULL" },
  { value: "SET_DEFAULT", hint: "Remet le defaut" },
  { value: "NO_ACTION", hint: "Ne fait rien" },
];

const SELECT_CLASS =
  "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus:ring-2 focus:ring-indigo-400/50 focus:outline-none";

/**
 * Contextual relation configurator: cardinality (1:1 / 1:N / N:M),
 * referential actions (onDelete / onUpdate), FK column + @relation name.
 */
export function RelationPopover({ relationId }: { relationId: string }) {
  const relation = useGraphStore((s) => s.relations.find((r) => r.id === relationId));
  const tables = useGraphStore((s) => s.tables);
  const updateRelation = useGraphStore((s) => s.updateRelation);
  const removeRelation = useGraphStore((s) => s.removeRelation);
  const selectEdge = useGraphStore((s) => s.selectEdge);

  if (!relation) return null;
  const from = tables.find((t) => t.id === relation.fromTableId);
  const to = tables.find((t) => t.id === relation.toTableId);
  if (!from || !to) return null;
  const patch = (values: Partial<Relation>) => updateRelation(relation.id, values);

  return (
    <div className="w-64 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        Relation
      </p>
      <p className="mb-3 truncate font-mono text-xs text-slate-700">
        {describeRelation(from, to, relation)}
      </p>
      <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        Cardinalite
      </p>
      <div role="radiogroup" aria-label="Type de relation" className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">
        {CARDINALITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={relation.type === option.value}
            onClick={() => patch({ type: option.value })}
            className={cn(
              "flex-1 rounded-md px-2 py-1 font-mono text-xs font-semibold transition-colors",
              relation.type === option.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {relation.type === "many-to-many" && (
        <p className="mb-3 rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-700">
          N:M logique — materialisez une table de jonction pour generer le SQL.
        </p>
      )}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            onDelete
          </span>
          <select
            className={SELECT_CLASS}
            value={relation.onDelete ?? "NO_ACTION"}
            onChange={(e) => patch({ onDelete: e.target.value as RelationCascade })}
            aria-label="Action a la suppression"
          >
            {CASCADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} title={o.hint}>
                {o.value}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            onUpdate
          </span>
          <select
            className={SELECT_CLASS}
            value={relation.onUpdate ?? "NO_ACTION"}
            onChange={(e) => patch({ onUpdate: e.target.value as RelationCascade })}
            aria-label="Action a la mise a jour"
          >
            {CASCADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} title={o.hint}>
                {o.value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mb-3 block">
        <span className="mb-1 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Colonne FK ({from.name})
        </span>
        <select
          className={SELECT_CLASS}
          value={relation.fromFieldId ?? ""}
          onChange={(e) => patch({ fromFieldId: e.target.value || undefined })}
          aria-label="Colonne de cle etrangere"
        >
          <option value="">— implicite —</option>
          {from.fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} : {f.type}
            </option>
          ))}
        </select>
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Nom @relation (optionnel)
        </span>
        <input
          className={SELECT_CLASS}
          value={relation.name ?? ""}
          placeholder={`${from.name}${to.name}`}
          onChange={(e) => patch({ name: e.target.value || undefined })}
          aria-label="Nom de la relation"
        />
      </label>
      <button
        type="button"
        onClick={() => {
          removeRelation(relation.id);
          selectEdge(null);
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
      >
        Supprimer la relation
      </button>
    </div>
  );
}
