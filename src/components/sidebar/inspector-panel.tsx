"use client";

import { useMemo, useState } from "react";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConstraintsSection } from "./constraints-section";
import { pushToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getTableColorTheme } from "@/lib/table-colors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPES, type FieldType } from "@/types";
import { useGraphStore } from "@/store/graph-store";
import { useCollabStore } from "@/store/collab-store";
import { useTableLock } from "@/components/collab/collab-badges";
import { Lock } from "lucide-react";

const DEFAULT_PRESETS = [
  "",
  "autoincrement()",
  "uuid()",
  "cuid()",
  "now()",
  "true",
  "false",
  "0",
];

export function InspectorPanel() {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const table = useGraphStore((state) =>
    state.tables.find((t) => t.id === state.selectedNodeId),
  );
  const enums = useGraphStore((state) => state.enums);
  const renameTable = useGraphStore((state) => state.renameTable);
  const removeTable = useGraphStore((state) => state.removeTable);
  const addField = useGraphStore((state) => state.addField);
  const updateField = useGraphStore((state) => state.updateField);
  const removeField = useGraphStore((state) => state.removeField);
  const addEnum = useGraphStore((state) => state.addEnum);
  const renameEnum = useGraphStore((state) => state.renameEnum);
  const removeEnum = useGraphStore((state) => state.removeEnum);
  const addEnumValue = useGraphStore((state) => state.addEnumValue);
  const updateEnumValue = useGraphStore((state) => state.updateEnumValue);
  const removeEnumValue = useGraphStore((state) => state.removeEnumValue);
  const tables = useGraphStore((state) => state.tables);
  const relations = useGraphStore((state) => state.relations);
  const validationIssues = useGraphStore((state) => state.validationIssues);
  const updateTableComment = useGraphStore((state) => state.updateTableComment);
  const duplicateTable = useGraphStore((state) => state.duplicateTable);
  const addIndex = useGraphStore((state) => state.addIndex);
  const removeIndex = useGraphStore((state) => state.removeIndex);
  const toggleIndexUnique = useGraphStore((state) => state.toggleIndexUnique);
  const [newEnumName, setNewEnumName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [indexField, setIndexField] = useState("");
  const [indexUnique, setIndexUnique] = useState(false);
  // Governance: read-only when a peer holds the table lock, or we are a viewer.
  const lock = useTableLock(selectedNodeId ?? "");
  const selfRole = useCollabStore((state) => state.self.role);
  const readOnly = selfRole === "viewer" || Boolean(lock);

  // Inline validation: map fieldId → worst severity, plus table-level issues.
  const fieldIssues = useMemo(() => {
    const map = new Map<string, "error" | "warning">();
    if (!table) return map;
    for (const issue of validationIssues) {
      if (issue.target.tableId !== table.id || !issue.target.fieldId) continue;
      const cur = map.get(issue.target.fieldId);
      if (cur !== "error") map.set(issue.target.fieldId, issue.severity);
    }
    return map;
  }, [validationIssues, table]);

  // Duplicate field names within this table (drives inline "error" styling).
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    if (!table) return counts;
    for (const f of table.fields) counts.set(f.name, (counts.get(f.name) ?? 0) + 1);
    return counts;
  }, [table]);

  const submitEnum = () => {
    addEnum(newEnumName || `Enum${enums.length + 1}`);
    setNewEnumName("");
  };

  const confirmRemoveTable = () => {
    if (!table) return;
    const name = table.name;
    removeTable(table.id);
    setConfirmDelete(false);
    pushToast(`Table « ${name} » supprimée`, {
      type: "info",
      description: "Annulable via Ctrl+Z.",
    });
  };

  if (!table) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium">Aucune table sélectionnée</p>
        <p className="text-xs text-muted-foreground">
          Cliquez sur une table du canvas ou du catalogue pour inspecter ses
          propriétés.
        </p>
      </div>
    );
  }

  const hasPk = table.fields.some((f) => f.isPrimaryKey);
  const errorCount = validationIssues.filter(
    (i) => i.target.tableId === table.id && i.severity === "error",
  ).length;
  const theme = getTableColorTheme(table.color);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sticky header: identity + quick actions always visible. */}
      <div className="glass-panel sticky top-0 z-10 shrink-0 space-y-2 border-b p-4 backdrop-blur-md">
        {readOnly && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              lock
                ? "bg-orange-500/10 text-orange-700"
                : "bg-slate-500/10 text-slate-600",
            )}
          >
            <Lock className="size-3.5 shrink-0" />
            {lock
              ? `${lock.userName} édite cette table — lecture seule`
              : "Lecture seule (rôle lecteur)"}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("size-2.5 shrink-0 rounded-full", theme.dot)} />
            <h2 className="truncate text-sm font-semibold">{table.name}</h2>
            {!hasPk && (
              <span
                className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600"
                title="Aucune clé primaire"
              >
                sans PK
              </span>
            )}
            {errorCount > 0 && (
              <span className="shrink-0 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                {errorCount} err.
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={readOnly}
              onClick={() => {
                duplicateTable(table.id);
                pushToast(`Table « ${table.name} » dupliquée`, { type: "success" });
              }}
              title="Dupliquer la table (Ctrl+D)"
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              disabled={readOnly}
              onClick={() => setConfirmDelete(true)}
              title="Supprimer la table"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground" htmlFor="table-name">
            Nom de la table
          </label>
          <Input
            id="table-name"
            value={table.name}
            readOnly={readOnly}
            onChange={(event) => renameTable(table.id, event.target.value)}
            className="mt-1 h-8"
          />
        </div>
      </div>

      <Tabs defaultValue="fields" className="flex min-h-0 flex-1 flex-col">
        <TabsList variant="line" className="mx-4 mt-2 w-auto shrink-0 justify-start">
          <TabsTrigger value="fields">
            Champs
            <span className="text-muted-foreground">{table.fields.length}</span>
          </TabsTrigger>
          <TabsTrigger value="constraints">Contraintes</TabsTrigger>
          <TabsTrigger value="comment">Commentaire</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="min-h-0 flex-1 overflow-y-auto glass-scroll p-4">
          <ul className="space-y-2">
            {table.fields.map((field) => {
              const severity = fieldIssues.get(field.id);
              const isDup = (duplicateNames.get(field.name) ?? 0) > 1;
              return (
              <li
                key={field.id}
                className={cn(
                  "space-y-2 rounded-lg border p-2",
                  severity === "error"
                    ? "border-destructive/50 bg-destructive/5"
                    : severity === "warning"
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border",
                )}
              >
                <div className="flex items-center gap-2">
                  {field.isPrimaryKey && (
                    <KeyRound className="size-3.5 shrink-0 text-amber-500" />
                  )}
                  <Input
                    value={field.name}
                    readOnly={readOnly}
                    aria-invalid={isDup || severity === "error" ? true : undefined}
                    onChange={(event) =>
                    updateField(table.id, field.id, {
                      name: event.target.value,
                    })
                  }
                  className="h-7 font-mono text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-destructive hover:text-destructive"
                  disabled={readOnly}
                  onClick={() => removeField(table.id, field.id)}
                  title="Supprimer le champ"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Select
                  value={field.type}
                  onValueChange={(value) => {
                    if (typeof value === "string" && value)
                      updateField(table.id, field.id, {
                        type: value as FieldType,
                      });
                  }}
                >
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={field.isNullable ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 px-2 font-mono text-[11px]"
                  onClick={() =>
                    updateField(table.id, field.id, {
                      isNullable: !field.isNullable,
                    })
                  }
                  title="Activer/désactiver nullable"
                >
                  {field.isNullable ? "?" : "!"}
                </Button>
                <Button
                  variant={field.isUnique ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() =>
                    updateField(table.id, field.id, {
                      isUnique: !field.isUnique,
                    })
                  }
                  title="Activer/désactiver unique"
                >
                  UQ
                </Button>
              </div>
              {field.type === "Enum" && (
                <Select
                  value={field.enumName ?? ""}
                  onValueChange={(value) => {
                    if (typeof value === "string")
                      updateField(table.id, field.id, { enumName: value });
                  }}
                >
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue placeholder="Sélectionner un énum" />
                  </SelectTrigger>
                  <SelectContent>
                    {enums.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <Select
                  value={
                    field.defaultValue === ""
                      ? "__none__"
                      : DEFAULT_PRESETS.includes(field.defaultValue)
                        ? field.defaultValue
                        : "__custom__"
                  }
                  onValueChange={(value) => {
                    if (typeof value !== "string") return;
                    updateField(table.id, field.id, {
                      defaultValue:
                        value === "__custom__" ? field.defaultValue : value === "__none__" ? "" : value,
                    });
                  }}
                >
                  <SelectTrigger
                    className="h-7 flex-1 font-mono text-[11px]"
                    title="Valeur par défaut prédéfinie"
                  >
                    <SelectValue placeholder="Aucune valeur par défaut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune valeur par défaut</SelectItem>
                    {DEFAULT_PRESETS.filter((p) => p !== "").map((preset) => (
                      <SelectItem key={preset} value={preset}>
                        {preset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={field.defaultValue}
                  onChange={(event) =>
                    updateField(table.id, field.id, {
                      defaultValue: event.target.value,
                    })
                  }
                  placeholder="@default(...)"
                  className="h-7 font-mono text-[11px]"
                  title="Valeur par défaut brute"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={field.isPrimaryKey ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 flex-1 text-[11px]"
                  onClick={() =>
                    updateField(table.id, field.id, {
                      isPrimaryKey: !field.isPrimaryKey,
                    })
                  }
                  title="Activer/désactiver la clé primaire"
                >
                  PK
                </Button>
                <Button
                  variant={field.isList ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 flex-1 text-[11px]"
                  onClick={() =>
                    updateField(table.id, field.id, {
                      isList: !field.isList,
                    })
                  }
                  title="Colonne de type liste (Type[])"
                >
                  []
                </Button>
                <Button
                  variant={field.isUpdatedAt ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 flex-1 text-[11px]"
                  onClick={() =>
                    updateField(table.id, field.id, {
                      isUpdatedAt: !field.isUpdatedAt,
                    })
                  }
                  title="Activer/désactiver @updatedAt"
                >
                  @updatedAt
                </Button>
              </div>
              </li>
              );
            })}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            disabled={readOnly}
            onClick={() =>
              addField(table.id, {
                name: `champ${table.fields.length + 1}`,
                type: "String",
                defaultValue: "",
                isUpdatedAt: false,
                isUnique: false,
                isNullable: true,
                nullable: true,
                unique: false,
                isPrimaryKey: false,
              })
            }
          >
            Ajouter un champ
          </Button>
        </TabsContent>

        <TabsContent value="constraints" className="min-h-0 flex-1 overflow-y-auto glass-scroll p-4">
          <ConstraintsSection
            table={table}
            relations={relations}
            tables={tables}
            indexField={indexField}
            setIndexField={setIndexField}
            indexUnique={indexUnique}
            setIndexUnique={setIndexUnique}
            onAddIndex={() => {
              if (!indexField) return;
              addIndex(table.id, [indexField], indexUnique);
              setIndexField("");
              setIndexUnique(false);
            }}
            onRemoveIndex={(indexId) => removeIndex(table.id, indexId)}
            onToggleIndexUnique={(indexId) => toggleIndexUnique(table.id, indexId)}
          />
        </TabsContent>

        <TabsContent value="comment" className="min-h-0 flex-1 overflow-y-auto glass-scroll p-4">
          <label className="text-xs text-muted-foreground" htmlFor="table-comment">
            Commentaire de la table (rendu en <code className="font-mono">{"///"}</code> dans Prisma)
          </label>
          <textarea
            id="table-comment"
            value={table.comment ?? ""}
            onChange={(event) => updateTableComment(table.id, event.target.value)}
            placeholder="Décrivez le rôle de cette table…"
            rows={5}
            className="mt-1 w-full rounded-lg border border-input bg-transparent p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </TabsContent>
      </Tabs>

      <EnumSection
        enums={enums}
        newEnumName={newEnumName}
        setNewEnumName={setNewEnumName}
        submitEnum={submitEnum}
        renameEnum={renameEnum}
        removeEnum={removeEnum}
        addEnumValue={addEnumValue}
        updateEnumValue={updateEnumValue}
        removeEnumValue={removeEnumValue}
      />

      <p className="hidden">{selectedNodeId}</p>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la table « {table.name} » ?</DialogTitle>
            <DialogDescription>
              Cette action supprimera également ses {table.fields.length} champ(s)
              et les relations associées. Vous pourrez annuler via Ctrl+Z.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmRemoveTable}>
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EnumSectionProps {
  enums: { id: string; name: string; values: string[] }[];
  newEnumName: string;
  setNewEnumName: (value: string) => void;
  submitEnum: () => void;
  renameEnum: (enumId: string, name: string) => void;
  removeEnum: (enumId: string) => void;
  addEnumValue: (enumId: string, value: string) => void;
  updateEnumValue: (enumId: string, index: number, value: string) => void;
  removeEnumValue: (enumId: string, index: number) => void;
}

function EnumSection({
  enums,
  newEnumName,
  setNewEnumName,
  submitEnum,
  renameEnum,
  removeEnum,
  addEnumValue,
  updateEnumValue,
  removeEnumValue,
}: EnumSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Énums
        </h3>
        <Badge variant="secondary">{enums.length}</Badge>
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={newEnumName}
          onChange={(event) => setNewEnumName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submitEnum();
          }}
          placeholder="Nom de l'énum"
          className="h-8"
        />
        <Button size="icon" className="size-8 shrink-0" onClick={submitEnum}>
          <Plus className="size-4" />
        </Button>
      </div>
      <ul className="mt-2 space-y-2">
        {enums.map((item) => (
          <li
            key={item.id}
            className="space-y-2 rounded-lg border border-border p-2"
          >
            <div className="flex items-center gap-2">
              <Input
                value={item.name}
                onChange={(event) => renameEnum(item.id, event.target.value)}
                className="h-7 font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeEnum(item.id)}
                title="Supprimer l'énum"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <ul className="space-y-1">
              {item.values.map((value, index) => (
                <li key={`${item.id}-${index}`} className="flex gap-2">
                  <Input
                    value={value}
                    onChange={(event) =>
                      updateEnumValue(item.id, index, event.target.value)
                    }
                    className="h-7 font-mono text-[11px]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeEnumValue(item.id, index)}
                    title="Supprimer la valeur"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => addEnumValue(item.id, "")}
            >
              Ajouter une valeur
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
