import type { Node } from "@xyflow/react";

/** Payload carried by a table node on the React Flow canvas. */
export type TableNodeData = {
  tableId: string;
};

/** Typed React Flow node for a {@link Table}. */
export type TableFlowNode = Node<TableNodeData, "table">;