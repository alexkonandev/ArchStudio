"use client";

import type { ReactNode } from "react";
import { useResizablePanel } from "@/hooks/use-resizable-panel";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { useFocusStore } from "@/store/focus-store";

/**
 * Canvas workspace shell: left catalogue + center canvas + right inspector,
 * with draggable widths persisted in localStorage.
 *
 * Kept separate from `app/page.tsx` (a server component) so the resize state
 * stays client-side. Bounds keep the layout usable at any viewport:
 * catalogue 200–420px (default 250), inspector 240–520px (default 300).
 *
 * Focus Graphe (`focusCanvasOnly`): both sidebars + resize handles are
 * hidden and the canvas takes the full viewport (`w-full h-screen`).
 * `GraphCanvas` itself stays mounted so node positions and zoom are preserved
 * and all of its internal tools (mode sélection/main, zoom, mini-toolbars)
 * remain fully visible and functional.
 */
export function WorkspacePanels({
  catalog,
  canvas,
  inspector,
}: {
  catalog: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
}) {
  const catalogPanel = useResizablePanel({
    storageKey: "archstudio:panel-width:catalog",
    defaultWidth: 250,
    minWidth: 200,
    maxWidth: 420,
    side: "right",
  });
  const inspectorPanel = useResizablePanel({
    storageKey: "archstudio:panel-width:inspector",
    defaultWidth: 300,
    minWidth: 240,
    maxWidth: 520,
    side: "left",
  });
  const focusCanvasOnly = useFocusStore((state) => state.focusCanvasOnly);

  if (focusCanvasOnly) {
    // Full-canvas mode: no sidebars, no resize handles — the canvas owns the
    // entire viewport (100% width × 100% height). The Topbar is hidden by
    // `WorkspaceShell`, so nothing else competes for space here.
    return (
      <div className="h-screen w-full">
        <main className="h-full w-full bg-background">{canvas}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <aside
        data-testid="catalog-panel"
        className="glass-panel shrink-0 overflow-hidden border-r backdrop-blur-md"
        style={{ width: catalogPanel.width }}
      >
        {catalog}
      </aside>
      <ResizeHandle
        side="right"
        label="Redimensionner le catalogue"
        {...catalogPanel.handleProps}
      />
      <main className="min-w-0 flex-1 bg-background">{canvas}</main>
      <ResizeHandle
        side="left"
        label="Redimensionner l'inspecteur"
        {...inspectorPanel.handleProps}
      />
      <aside
        data-testid="inspector-panel"
        className="glass-panel shrink-0 overflow-hidden border-l backdrop-blur-md"
        style={{ width: inspectorPanel.width }}
      >
        {inspector}
      </aside>
    </div>
  );
}
