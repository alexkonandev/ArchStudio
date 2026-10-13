"use client";

import { useState } from "react";
import { Plus, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGraphStore } from "@/store/graph-store";

export function CatalogPanel() {
  const tables = useGraphStore((state) => state.tables);
  const addTable = useGraphStore((state) => state.addTable);
  const selectNode = useGraphStore((state) => state.selectNode);
  const [name, setName] = useState("");

  const submit = () => {
    addTable(name || `Table${tables.length + 1}`);
    setName("");
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Add table
        </h2>
        <div className="mt-2 flex gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="Table name"
            className="h-8"
          />
          <Button size="icon" className="size-8 shrink-0" onClick={submit}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Tables
        </h2>
        <ul className="mt-2 space-y-1 overflow-y-auto">
          {tables.map((table) => (
            <li key={table.id}>
              <button
                type="button"
                onClick={() => selectNode(table.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Table2 className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{table.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {table.fields.length}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
