"use client";

import { useEffect, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGraphStore } from "@/store/graph-store";

/** How long the creation pulse stays lit (ms). */
const PULSE_DURATION_MS = 1400;

interface RelationshipEdgeData {
  /** When true, the edge plays a one-shot luminous pulse (set on connect). */
  pulse?: boolean;
  [key: string]: unknown;
}

/**
 * Custom relation edge: a smoothstep cable that plays a brief luminous pulse
 * when a new relation is created.
 *
 * The `pulse` flag is one-shot by construction: the state initialises from the
 * first render's props and only ever flips back to `false` when the timer
 * fires, so no effect-driven `setState` is needed.
 */
export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
  selected,
}: EdgeProps) {
  const edgeData = (data ?? {}) as RelationshipEdgeData;
  const [pulsing, setPulsing] = useState<boolean>(Boolean(edgeData.pulse));
  const relation = useGraphStore((state) =>
    state.relations.find((r) => r.id === id),
  );

  useEffect(() => {
    if (!pulsing) return;
    const timer = setTimeout(() => setPulsing(false), PULSE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [pulsing, id]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const cardinalityLabel =
    relation?.type === "one-to-one"
      ? "1:1"
      : relation?.type === "many-to-many"
        ? "N:M"
        : relation
          ? "1:N"
          : null;
  const showCascade = relation?.onDelete === "CASCADE";

  return (
    <>
      {/* Glow underlay, visible only during the creation pulse. */}
      {pulsing && (
        <path
          d={edgePath}
          fill="none"
          className="stroke-indigo-400"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.5}
          style={{
            filter: "drop-shadow(0 0 6px rgb(129 140 248))",
            animation: `edge-pulse ${PULSE_DURATION_MS}ms ease-out forwards`,
          }}
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: selected ? 2.5 : 2 }}
      />
      {/* Permanent cardinality + CASCADE badge (opens the relation popover). */}
      {cardinalityLabel && !pulsing && (
        <EdgeLabelRenderer>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              useGraphStore.getState().selectEdge(id);
            }}
            className={cn(
              "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[10px] font-semibold shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-md",
              selected
                ? "border-indigo-400 bg-indigo-500 text-white"
                : "border-slate-200 bg-white/90 text-slate-600",
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            aria-label={`Configurer la relation ${cardinalityLabel}`}
          >
            {cardinalityLabel}
            {showCascade && (
              <Flame
                className={cn(
                  "size-3",
                  selected ? "text-orange-200" : "text-orange-500",
                )}
                aria-label="Suppression en cascade"
              />
            )}
          </button>
        </EdgeLabelRenderer>
      )}
      {pulsing && (
        <EdgeLabelRenderer>
          <span
            className="pointer-events-none rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              animation: "edge-pulse-fade 1400ms ease-out forwards",
            }}
          >
            Relation créée ✨
          </span>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
