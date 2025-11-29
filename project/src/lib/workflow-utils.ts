import type { Node, XYPosition } from "reactflow";
import type { NodeData } from "./types";

let toolIdCounter = 0;

export const generateNodeId = (type: string): string => {
  toolIdCounter++;
  return `${type}-${toolIdCounter}`;
};

export const createNode = ({
  type,
  position,
  id,
}: {
  type: string;
  position: XYPosition;
  id: string;
}): Node<NodeData> => {
  return {
    id,
    type,
    position,
    data: {
      label: getDefaultLabel(type),
      description: getDefaultDescription(type),
      config: {},
    },
  };
};

const getDefaultLabel = (type: string): string => {
  const labels: Record<string, string> = {
    // Memory Store operations
    memory_store_get: "Memory Store: Get",
    memory_store_put: "Memory Store: Put",
    memory_store_delete: "Memory Store: Delete",
    memory_store_list: "Memory Store: List",
    // Queue operations
    queue_send: "Queue: Send",
    queue_send_batch: "Queue: Send Batch",
    queue_send_delayed: "Queue: Send Delayed",
    queue_consume: "Queue: Consume",
    // Analytics operations
    analytics_write: "Analytics: Write",
    analytics_write_batch: "Analytics: Write Batch",
    analytics_query: "Analytics: Query",
  };
  return labels[type] || "Tool";
};

const getDefaultDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    // Memory Store operations
    memory_store_get: "Retrieve value by key",
    memory_store_put: "Store key-value pair",
    memory_store_delete: "Remove key-value pair",
    memory_store_list: "List all keys with prefix",
    // Queue operations
    queue_send: "Send single message to queue",
    queue_send_batch: "Send multiple messages",
    queue_send_delayed: "Schedule message for future",
    queue_consume: "Process messages from queue",
    // Analytics operations
    analytics_write: "Write single metric",
    analytics_write_batch: "Write multiple metrics",
    analytics_query: "Query metrics with SQL",
  };
  return descriptions[type] || "Workflow tool";
};

