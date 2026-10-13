import { GraphCanvas } from "@/components/canvas/graph-canvas";
import { CatalogPanel } from "@/components/sidebar/catalog-panel";
import { InspectorPanel } from "@/components/sidebar/inspector-panel";
import { StudioHeader } from "@/components/toolbar/studio-header";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <StudioHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="w-[250px] shrink-0 overflow-hidden border-r border-border bg-card">
          <CatalogPanel />
        </aside>
        <main className="min-w-0 flex-1 bg-background">
          <GraphCanvas />
        </main>
        <aside className="w-[300px] shrink-0 overflow-hidden border-l border-border bg-card">
          <InspectorPanel />
        </aside>
      </div>
    </div>
  );
}

