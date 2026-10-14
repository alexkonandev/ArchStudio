import { GraphCanvas } from "@/components/canvas/graph-canvas";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { CatalogPanel } from "@/components/sidebar/catalog-panel";
import { InspectorPanel } from "@/components/sidebar/inspector-panel";
import { CollabProvider } from "@/components/collab/collab-provider";
import { ActivityFeed } from "@/components/collab/activity-feed";
import { CommentDrawer } from "@/components/collab/comment-drawer";

/** Default collaboration room (the `?room=` query param can override it). */
const DEFAULT_ROOM = "archstudio";

/**
 * The visual modelling Studio (canvas workspace), served on `/studio`.
 *
 * This is the former root (`/`) route, moved here so the root can host the
 * marketing landing page. Everything is preserved 1:1 — the client wrappers,
 * `WorkspaceShell` (Topbar + resizable sidebars + canvas) and the Code Studio
 * entry point all behave exactly as before.
 */
export default function StudioPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <CollabProvider roomId={DEFAULT_ROOM} />
      <WorkspaceShell
        catalog={<CatalogPanel />}
        canvas={<GraphCanvas />}
        inspector={<InspectorPanel />}
      />
      <ActivityFeed />
      <CommentDrawer />
    </div>
  );
}