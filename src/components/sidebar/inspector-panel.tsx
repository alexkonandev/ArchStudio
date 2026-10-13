"use client";

import { useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPES, type FieldType } from "@/types";
import { useGraphStore } from "@/store/graph-store";

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
  const [newEnumName, setNewEnumName] = useState("");

  const submitEnum = () => {
    addEnum(newEnumName || `Enum${enums.length + 1}`);
    setNewEnumName("");
  };

  if (!table) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium">No table selected</p>
        <p className="text-xs text-muted-foreground">
          Click a table on the canvas or in the catalog to inspect its
          properties.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Inspector
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={() => removeTable(table.id)}
          title="Delete table"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground" htmlFor="table-name">
          Table name
        </label>
        <Input
          id="table-name"
          value={table.name}
          onChange={(event) => renameTable(table.id, event.target.value)}
          className="mt-1 h-8"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Fields
          </h3>
          <Badge variant="secondary">{table.fields.length}</Badge>
        </div>
        <ul className="mt-2 space-y-2">
          {table.fields.map((field) => (
            <li
              key={field.id}
              className="space-y-2 rounded-lg border border-border p-2"
            >
              <div className="flex items-center gap-2">
                {field.isPrimaryKey && (
                  <KeyRound className="size-3.5 shrink-0 text-amber-400" />
                )}
                <Input
                  value={field.name}
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
                  onClick={() => removeField(table.id, field.id)}
                  title="Delete field"
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
                  title="Toggle nullable"
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
                  title="Toggle unique"
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
                    <SelectValue placeholder="Select enum" />
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
                    DEFAULT_PRESETS.includes(field.defaultValue)
                      ? field.defaultValue
                      : "__custom__"
                  }
                  onValueChange={(value) => {
                    if (typeof value !== "string") return;
                    updateField(table.id, field.id, {
                      defaultValue:
                        value === "__custom__" ? field.defaultValue : value,
                    });
                  }}
                >
                  <SelectTrigger
                    className="h-7 flex-1 font-mono text-[11px]"
                    title="Default value preset"
                  >
                    <SelectValue placeholder="No default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No default</SelectItem>
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
                  title="Raw default value"
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
                  title="Toggle primary key"
                >
                  PK
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
                  title="Toggle @updatedAt"
                >
                  @updatedAt
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() =>
            addField(table.id, {
              name: `field${table.fields.length + 1}`,
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
          Add field
        </Button>
      </div>

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
          Enums
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
          placeholder="Enum name"
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
                title="Delete enum"
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
                    title="Delete value"
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
              Add value
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
