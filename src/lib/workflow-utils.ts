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
    memory_store: "Memory Store (KV)",
    llm_call: "LLM Call",
    webhook_receiver: "Webhook Receiver",
    mcp_tool: "MCP Tool",
    queue: "Queue",
    analytics: "Analytics",
  };
  return labels[type] || "Tool";
};

const getDefaultDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    memory_store: "Fast key-value store for agent memory",
    llm_call: "Call any LLM provider for AI processing",
    webhook_receiver: "Receive and process webhook data",
    mcp_tool: "Model Context Protocol tool integration",
    queue: "Async message queuing for workflows",
    analytics: "Track metrics and monitor performance",
  };
  return descriptions[type] || "Workflow tool";
};

