"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Database,
  Brain,
  Webhook,
  Puzzle,
  List,
  BarChart3,
} from "lucide-react";
import type { NodeData } from "@/lib/types";

const toolIcons: Record<string, React.ReactNode> = {
  memory_store: <Database className="h-4 w-4" />,
  llm_call: <Brain className="h-4 w-4" />,
  webhook_receiver: <Webhook className="h-4 w-4" />,
  mcp_tool: <Puzzle className="h-4 w-4" />,
  queue: <List className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
};

const toolColors: Record<string, { border: string; bg: string; text: string }> = {
  memory_store: { border: "border-blue-500", bg: "bg-blue-100", text: "text-blue-500" },
  llm_call: { border: "border-purple-500", bg: "bg-purple-100", text: "text-purple-500" },
  webhook_receiver: { border: "border-green-500", bg: "bg-green-100", text: "text-green-500" },
  mcp_tool: { border: "border-orange-500", bg: "bg-orange-100", text: "text-orange-500" },
  queue: { border: "border-indigo-500", bg: "bg-indigo-100", text: "text-indigo-500" },
  analytics: { border: "border-teal-500", bg: "bg-teal-100", text: "text-teal-500" },
};

export const ToolNode = memo(({ data, type, isConnectable }: NodeProps<NodeData>) => {
  const colors = toolColors[type || ""] || { border: "border-gray-500", bg: "bg-gray-100", text: "text-gray-500" };
  const icon = toolIcons[type || ""] || null;

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${colors.border} min-w-[150px]`}>
      <div className="flex items-center">
        <div className={`rounded-full w-8 h-8 flex items-center justify-center ${colors.bg} ${colors.text}`}>
          {icon}
        </div>
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label || type}</div>
          <div className="text-xs text-gray-500">{data.description || "Tool"}</div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3" />
    </div>
  );
});

ToolNode.displayName = "ToolNode";

