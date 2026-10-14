"use client";

import { useViewport } from "@xyflow/react";
import type { AlignmentGuide } from "@/lib/alignment";

interface AlignmentLayerProps {
  guides: AlignmentGuide[];
}

/**
 * Renders smart-alignment guide lines (Figma-style) in flow coordinates.
 *
 * React Flow applies the pan/zoom transform to its internal viewport layer, so
 * a plain child of `<ReactFlow>` is *not* transformed. We therefore read the
 * live viewport via {@link useViewport} and replicate the transform on our own
 * absolutely-positioned SVG overlay. Lines are drawn with a magenta glow.
 */
export function AlignmentLayer({ guides }: AlignmentLayerProps) {
  const { x, y, zoom } = useViewport();

  if (guides.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-visible"
      aria-hidden
    >
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {guides.map((guide, index) =>
          guide.orientation === "vertical" ? (
            <line
              key={`v-${index}`}
              x1={guide.position}
              y1={guide.start - 4000}
              x2={guide.position}
              y2={guide.end + 4000}
              className="stroke-fuchsia-500"
              strokeWidth={1 / zoom}
              strokeDasharray={`${4 / zoom} ${4 / zoom}`}
            />
          ) : (
            <line
              key={`h-${index}`}
              x1={guide.start - 4000}
              y1={guide.position}
              x2={guide.end + 4000}
              y2={guide.position}
              className="stroke-fuchsia-500"
              strokeWidth={1 / zoom}
              strokeDasharray={`${4 / zoom} ${4 / zoom}`}
            />
          ),
        )}
      </g>
    </svg>
  );
}
