import type { TableFlowNode } from "@/types";

/**
 * Smart alignment engine for the canvas.
 *
 * Pure & deterministic: given the node currently being dragged and its sibling
 * nodes, it returns the snapped position plus the guide lines that should be
 * drawn. Kept framework-agnostic (no React Flow imports) so the math can be
 * unit-tested and reasoned about in isolation.
 */

/** Snap threshold in flow units — closer than this and a node "sticks". */
export const SNAP_THRESHOLD = 6;

/** Approximate rendered size of a table node (matches the `w-60` card). */
export const NODE_WIDTH = 240;
/** Header + one row estimate; refined by callers when available. */
export const NODE_HEIGHT_ESTIMATE = 120;

/** A guide line to render, in absolute flow coordinates. */
export interface AlignmentGuide {
  orientation: "vertical" | "horizontal";
  /** Absolute flow coordinate of the line (x for vertical, y for horizontal). */
  position: number;
  /** Start of the line along the cross axis. */
  start: number;
  /** End of the line along the cross axis. */
  end: number;
}

export interface AlignmentResult {
  /** Corrected position for the dragged node (snapped on one/both axes). */
  position: { x: number; y: number };
  /** Guides to render for this drag frame. */
  guides: AlignmentGuide[];
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Candidate anchor lines of a box: its two edges and its center per axis. */
function verticalAnchors(box: Box): number[] {
  return [box.x, box.x + box.width / 2, box.x + box.width];
}
function horizontalAnchors(box: Box): number[] {
  return [box.y, box.y + box.height / 2, box.y + box.height];
}

/**
 * Find the best snap for the dragged box against a set of target boxes on one
 * axis. Returns the corrected coordinate (or `undefined` when nothing is within
 * the threshold) plus the guide to draw.
 */
function snapAxis(
  draggedValue: number,
  draggedSize: number,
  targets: Box[],
  crossMin: number,
  crossMax: number,
  axis: "vertical" | "horizontal",
): { value: number; guide: AlignmentGuide } | null {
  const draggedAnchors =
    axis === "vertical"
      ? verticalAnchors(singleAxisBox(draggedValue, draggedSize, "x"))
      : horizontalAnchors(singleAxisBox(draggedValue, draggedSize, "y"));

  let best: { delta: number; targetAnchor: number; crossStart: number; crossEnd: number } | null = null;

  for (const target of targets) {
    const targetAnchors =
      axis === "vertical" ? verticalAnchors(target) : horizontalAnchors(target);
    const targetCrossMin = axis === "vertical" ? target.y : target.x;
    const targetCrossMax =
      axis === "vertical" ? target.y + target.height : target.x + target.width;

    for (let i = 0; i < draggedAnchors.length; i += 1) {
      for (const targetAnchor of targetAnchors) {
        const delta = targetAnchor - draggedAnchors[i];
        if (Math.abs(delta) > SNAP_THRESHOLD) continue;
        if (best === null || Math.abs(delta) < Math.abs(best.delta)) {
          best = {
            delta,
            targetAnchor,
            crossStart: Math.min(crossMin, targetCrossMin),
            crossEnd: Math.max(crossMax, targetCrossMax),
          };
        }
      }
    }
  }

  if (best === null) return null;
  return {
    value: draggedValue + best.delta,
    guide: {
      orientation: axis,
      position: best.targetAnchor,
      start: best.crossStart,
      end: best.crossEnd,
    },
  };
}

// Tiny helper: build a box that only carries one axis so `snapAxis` stays readable.
function singleAxisBox(
  value: number,
  size: number,
  axis: "x" | "y",
): Box {
  return axis === "x"
    ? { x: value, y: 0, width: size, height: 0 }
    : { x: 0, y: value, width: 0, height: size };
}

/**
 * Compute the snapped position + guides for a node being dragged.
 *
 * @param dragging   The node being moved (uses its `position` and measured size
 *                   when available).
 * @param others     All other nodes to align against.
 * @param size       Optional explicit { width, height }; falls back to the
 *                   measured node dimensions or the estimate.
 */
export function computeAlignment(
  dragging: TableFlowNode,
  others: TableFlowNode[],
  size?: { width: number; height: number },
): AlignmentResult {
  const width = size?.width ?? dragging.measured?.width ?? NODE_WIDTH;
  const height = size?.height ?? dragging.measured?.height ?? NODE_HEIGHT_ESTIMATE;

  const draggedBox: Box = {
    x: dragging.position.x,
    y: dragging.position.y,
    width,
    height,
  };
  const targetBoxes: Box[] = others.map((node) => ({
    x: node.position.x,
    y: node.position.y,
    width: node.measured?.width ?? NODE_WIDTH,
    height: node.measured?.height ?? NODE_HEIGHT_ESTIMATE,
  }));

  const guides: AlignmentGuide[] = [];

  const xSnap = snapAxis(
    draggedBox.x,
    draggedBox.width,
    targetBoxes,
    draggedBox.y,
    draggedBox.y + draggedBox.height,
    "vertical",
  );
  const ySnap = snapAxis(
    draggedBox.y,
    draggedBox.height,
    targetBoxes,
    draggedBox.x,
    draggedBox.x + draggedBox.width,
    "horizontal",
  );

  let x = draggedBox.x;
  let y = draggedBox.y;
  if (xSnap) {
    x = xSnap.value;
    guides.push(xSnap.guide);
  }
  if (ySnap) {
    y = ySnap.value;
    guides.push(ySnap.guide);
  }

  return { position: { x, y }, guides };
}
