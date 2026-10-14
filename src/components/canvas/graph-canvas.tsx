"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Hand, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  beginDragTransaction,
  endDragTransaction,
  GRAPH_EDGE_TYPE,
  GRAPH_NODE_TYPE,
  useGraphStore,
} from "@/store/graph-store";
import type { TableFlowNode } from "@/types";
import { computeAlignment, type AlignmentGuide } from "@/lib/alignment";
import { TableNode } from "./table-node";
import { RelationshipEdge } from "./relationship-edge";
import { AlignmentLayer } from "./alignment-layer";
import { HealthScoreBar } from "./health-score-bar";
import { RelationPopover } from "./relation-popover";
import { SmartConnectModal } from "./smart-connect-modal";
import { CollabCursors, collabToast, useCollabPresence } from "./collab-presence";
import { FocusExitPill } from "./focus-exit-pill";

/** Canvas interaction mode (Figma-style): select vs hand/pan. */
type CanvasMode = "select" | "pan";

/** Narrowing predicate: a position change for a node actively being dragged. */
type DraggingPositionChange = Extract<
  NodeChange<TableFlowNode>,
  { type: "position" }
>;

function isDraggingPositionChange(
  change: NodeChange<TableFlowNode>,
): change is DraggingPositionChange {
  return (
    change.type === "position" &&
    change.dragging === true &&
    change.position !== undefined
  );
}

/** The canvas never steals keys while the user types in a field or panel. */
function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.closest !== "function") return false;
  return Boolean(
    element.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]',
    ),
  );
}

export function GraphCanvas() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const storeOnNodesChange = useGraphStore((state) => state.onNodesChange);
  const onEdgesChange = useGraphStore((state) => state.onEdgesChange);
  const onConnect = useGraphStore((state) => state.onConnect);
  const selectNode = useGraphStore((state) => state.selectNode);
  const selectEdge = useGraphStore((state) => state.selectEdge);
  const selectedEdgeId = useGraphStore((state) => state.selectedEdgeId);

  const nodeTypes = useMemo<NodeTypes>(
    () => ({ [GRAPH_NODE_TYPE]: TableNode }),
    [],
  );
  const edgeTypes = useMemo<EdgeTypes>(
    () => ({ [GRAPH_EDGE_TYPE]: RelationshipEdge }),
    [],
  );

  /** Live smart-alignment guides shown while a node is dragged. */
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);
  /** Figma-style interaction mode, plus held-space temporary pan. */
  const [mode, setMode] = useState<CanvasMode>("select");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const effectivePan = mode === "pan" || spaceHeld;
  /** Collab review mode: broadcast + render remote cursors (BroadcastChannel). */
  const [collabEnabled, setCollabEnabled] = useState(false);
  // Mirror of collabEnabled so event handlers can read/toggle the latest value
  // without stalling on a stale closure (and without side effects in a setter).
  const collabEnabledRef = useRef(collabEnabled);
  const { peers } = useCollabPresence(collabEnabled);

  // Topbar ⌘K toggle: the palette lives in the header, the switch lives here.
  useEffect(() => {
    const onToggle = (): void => {
      // Compute the next value from the ref, then toast *outside* the state
      // updater. Calling pushToast inside a setState updater would fire a
      // Toaster update while GraphCanvas is rendering (React "cannot update a
      // component while rendering a different component").
      const next = !collabEnabledRef.current;
      collabEnabledRef.current = next;
      setCollabEnabled(next);
      collabToast(next);
    };
    window.addEventListener("archstudio:toggle-collab", onToggle);
    return () => window.removeEventListener("archstudio:toggle-collab", onToggle);
  }, []);

  /**
   * Controlled smart snapping: position changes are intercepted and corrected
   * against sibling anchors (left/center/right, top/center/bottom) within the
   * snap threshold, then forwarded to the store. Guides render the magnetism.
   */
  const handleNodesChange = useCallback(
    (changes: NodeChange<TableFlowNode>[]) => {
      const currentNodes = useGraphStore.getState().nodes;
      const draggingChanges = changes.filter(isDraggingPositionChange);
      if (draggingChanges.length === 0) {
        if (changes.some((change) => change.type === "position")) {
          setGuides([]);
        }
        storeOnNodesChange(changes);
        return;
      }
      const draggingIds = new Set(draggingChanges.map((change) => change.id));
      const others = currentNodes.filter((node) => !draggingIds.has(node.id));
      const nextGuides: AlignmentGuide[] = [];
      const nextChanges = changes.map((change) => {
        if (
          change.type !== "position" ||
          change.dragging !== true ||
          !change.position
        ) {
          return change;
        }
        const node = currentNodes.find(
          (candidate) => candidate.id === change.id,
        );
        if (!node) return change;
        const size =
          node.measured?.width !== undefined &&
          node.measured?.height !== undefined
            ? { width: node.measured.width, height: node.measured.height }
            : undefined;
        const { position, guides: frameGuides } = computeAlignment(
          { ...node, position: { ...change.position } },
          others,
          size,
        );
        nextGuides.push(...frameGuides);
        if (
          position.x === change.position.x &&
          position.y === change.position.y
        ) {
          return change;
        }
        return { ...change, position };
      });
      setGuides(nextGuides);
      storeOnNodesChange(nextChanges);
    },
    [storeOnNodesChange],
  );

  const handleNodeDragStart = useCallback(() => {
    beginDragTransaction();
  }, []);

  const handleNodeDragStop = useCallback(() => {
    endDragTransaction();
    setGuides([]);
  }, []);

  /* Figma-style shortcuts: V select, H hand, Space (held) pan, Suppr remove,
     Ctrl/Cmd+D duplicate, Esc deselect. React Flow native deletion stays
     disabled (deleteKeyCode={null}) so the store is the source of truth. */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !isEditableTarget(event.target)) {
        event.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (isEditableTarget(event.target)) return;
      if (event.key === "Escape") {
        const store = useGraphStore.getState();
        store.selectNode(null);
        store.selectEdge(null);
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === "z" && !event.shiftKey) {
          // Undo global — but never steal Ctrl+Z from a text field.
          if (isEditableTarget(event.target)) return;
          event.preventDefault();
          useGraphStore.getState().undo();
          return;
        }
        if ((key === "y" || (key === "z" && event.shiftKey)) && !isEditableTarget(event.target)) {
          // Redo global (Ctrl+Y or Ctrl+Shift+Z).
          event.preventDefault();
          useGraphStore.getState().redo();
          return;
        }
        if (event.key === "d" || event.key === "D") {
          event.preventDefault();
          const { selectedNodeId, duplicateTable } = useGraphStore.getState();
          if (selectedNodeId) duplicateTable(selectedNodeId);
        }
        return;
      }
      if (event.key === "v" || event.key === "V") {
        setMode("select");
      } else if (event.key === "h" || event.key === "H") {
        setMode("pan");
      } else if (event.key === "Delete" || event.key === "Backspace") {
        const store = useGraphStore.getState();
        if (store.selectedEdgeId) {
          event.preventDefault();
          store.removeRelation(store.selectedEdgeId);
          store.selectEdge(null);
        } else if (store.selectedNodeId) {
          event.preventDefault();
          store.removeTable(store.selectedNodeId);
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false);
    };
    const handleBlur = () => setSpaceHeld(false);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative h-full w-full",
        effectivePan && "cursor-grab active:cursor-grabbing",
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onPaneClick={() => selectNode(null)}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        fitView
        colorMode="light"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        panOnDrag={effectivePan ? true : [1, 2]}
        nodesDraggable={!effectivePan}
        selectionOnDrag={!effectivePan}
        snapToGrid
        snapGrid={[8, 8]}
        defaultEdgeOptions={{ type: GRAPH_EDGE_TYPE }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          className="!bg-card"
        />
        <AlignmentLayer guides={guides} />
      </ReactFlow>

      <HealthScoreBar />

      {/* Remote architect cursors (collab review mode, export-hidden). */}
      <CollabCursors peers={peers} />

      <FocusExitPill />

      {/* Smart-join prompt: opened by `onConnect` when a FK column is missing. */}
      <SmartConnectModal />

      {/* Relation configurator: anchored overlay for the selected edge. */}
      {selectedEdgeId && (
        <div className="absolute top-16 left-1/2 z-20 -translate-x-1/2">
          <RelationPopover relationId={selectedEdgeId} />
        </div>
      )}

      {/* Figma-style mode switcher (top-left; HealthScoreBar sits top-center). */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMode("select")}
          aria-pressed={mode === "select"}
          title="Sélection (V)"
          aria-label="Mode sélection"
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-colors",
            mode === "select"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <MousePointer2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setMode("pan")}
          aria-pressed={mode === "pan"}
          title="Main (H ou Espace maintenu)"
          aria-label="Mode main"
          className={cn(
            "flex size-7 items-center justify-center rounded-full transition-colors",
            mode === "pan"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <Hand className="size-4" />
        </button>
        <span className="hidden px-1.5 text-[10px] text-muted-foreground xl:block">
          V / H · Espace : main
        </span>
      </div>
    </div>
  );
}
