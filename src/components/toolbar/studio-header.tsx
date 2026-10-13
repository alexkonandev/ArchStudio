"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Code2,
  Database,
  LayoutGrid,
  OctagonAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { compileToPrisma, compileToSql } from "@/lib/engine";
import { useGraphStore } from "@/store/graph-store";
import { ImportDialog } from "./import-dialog";
import { TemplatesDialog } from "./templates-dialog";
import { ExportMenu } from "./export-menu";
import { ResetButton } from "./reset-button";

export function StudioHeader() {
  const tables = useGraphStore((state) => state.tables);
  const relations = useGraphStore((state) => state.relations);
  const enums = useGraphStore((state) => state.enums);
  const validationIssues = useGraphStore((state) => state.validationIssues);
  const getSchemaAst = useGraphStore((state) => state.getSchemaAst);
  const applyAutoLayout = useGraphStore((state) => state.applyAutoLayout);
  const selectNode = useGraphStore((state) => state.selectNode);
  const hydrateFromStorage = useGraphStore((state) => state.hydrateFromStorage);
  const [codeOpen, setCodeOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);

  useEffect(() => {
    hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ast = useMemo(
    () => getSchemaAst(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tables, relations, enums],
  );
  const prisma = useMemo(() => compileToPrisma(ast), [ast]);
  const sql = useMemo(() => compileToSql(ast), [ast]);

  const errorCount = validationIssues.filter((i) => i.severity === "error").length;
  const warningCount = validationIssues.filter(
    (i) => i.severity === "warning",
  ).length;
  const tableNameOf = (tableId: string) =>
    tables.find((t) => t.id === tableId)?.name ?? tableId;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Database className="size-4" />
        </span>
        <h1 className="text-base font-semibold tracking-tight">ArchStudio</h1>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{tables.length} tables</Badge>
        <Badge variant="secondary">{relations.length} relations</Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ImportDialog />
        <TemplatesDialog />
        <ExportMenu />
        <ResetButton />
        <button
          type="button"
          onClick={() => setIssuesOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent"
          title="Open validation report"
        >
          <span
            className={`size-2 rounded-full ${errorCount > 0 ? "bg-destructive" : warningCount > 0 ? "bg-amber-500" : "bg-emerald-500"}`}
          />
          {errorCount} Error{errorCount === 1 ? "" : "s"}, {warningCount}{" "}
          Warning{warningCount === 1 ? "" : "s"}
        </button>
        <Button size="sm" variant="outline" onClick={applyAutoLayout}>
          <LayoutGrid className="size-4" />
          Auto Layout
        </Button>
        <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
          <DialogTrigger
            render={
              <Button size="sm">
                <Code2 className="size-4" />
                Generate Code
              </Button>
            }
          />
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Generated schema</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="prisma">
              <TabsList>
                <TabsTrigger value="prisma">Prisma</TabsTrigger>
                <TabsTrigger value="sql">SQL</TabsTrigger>
              </TabsList>
              <TabsContent value="prisma">
                <pre className="max-h-[50vh] overflow-auto rounded-lg bg-muted p-4 font-mono text-xs">
                  {prisma}
                </pre>
              </TabsContent>
              <TabsContent value="sql">
                <pre className="max-h-[50vh] overflow-auto rounded-lg bg-muted p-4 font-mono text-xs">
                  {sql}
                </pre>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
        <Sheet open={issuesOpen} onOpenChange={setIssuesOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Validation report</SheetTitle>
              <SheetDescription>
                {errorCount} error{errorCount === 1 ? "" : "s"}, {warningCount}{" "}
                warning{warningCount === 1 ? "" : "s"} detected in the graph.
              </SheetDescription>
            </SheetHeader>
            <ul className="flex flex-col gap-2 overflow-y-auto p-4">
              {validationIssues.length === 0 && (
                <li className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                  Graph is healthy. No errors or warnings.
                </li>
              )}
              {validationIssues.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    {issue.severity === "error" ? (
                      <OctagonAlert className="size-4 shrink-0 text-destructive" />
                    ) : (
                      <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                    )}
                    <Badge
                      variant={
                        issue.severity === "error" ? "destructive" : "secondary"
                      }
                    >
                      {issue.severity}
                    </Badge>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {tableNameOf(issue.target.tableId)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs">{issue.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      selectNode(issue.target.tableId);
                      setIssuesOpen(false);
                    }}
                  >
                    Go to {tableNameOf(issue.target.tableId)}
                  </Button>
                </li>
              ))}
            </ul>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
