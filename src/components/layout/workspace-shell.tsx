"use client";

import type { ReactNode } from "react";
import { useCanvasFocus } from "@/hooks/use-canvas-focus";
import { useFocusStore } from "@/store/focus-store";
import { StudioHeader } from "@/components/toolbar/studio-header";
import { WorkspacePanels } from "@/components/layout/workspace-panels";

/**
 * Client shell for the canvas route (`/`).
 *
 * Registers the Focus Graphe shortcuts. When `focusCanvasOnly` is active the
 * Topbar is hidden entirely and `WorkspacePanels` hides both sidebars, so the
 * canvas owns the full viewport. A discreet floating `FocusExitPill` (rendered
 * inside `GraphCanvas`) restores the chrome with a single click. `GraphCanvas`
 * stays mounted across toggles so node positions and zoom are preserved — only
 * CSS visibility changes, no remount, no `fitView`.
 */
export function WorkspaceShell({
  catalog,
  canvas,
  inspector,
}: {
  catalog: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
}) {
  useCanvasFocus();
  const focusCanvasOnly = useFocusStore((state) => state.focusCanvasOnly);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/*
        Topbar: hidden entirely in Focus Graphe so the canvas owns the full
        viewport. `GraphCanvas` stays mounted (positions/zoom preserved); a
        discreet floating `FocusExitPill` inside it restores the chrome.
      */}
      {!focusCanvasOnly && <StudioHeader />}
      <WorkspacePanels
        catalog={catalog}
        canvas={canvas}
        inspector={inspector}
      />
    </div>
  );
}