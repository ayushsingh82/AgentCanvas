"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Database,
  List,
  BarChart3,
  Search,
  Save,
  Trash2,
  List as ListIcon,
  Send,
  SendHorizonal,
  Clock,
  Download,
  FileText,
  FileText as FileTextBatch,
  Database as DatabaseQuery,
} from "lucide-react";
import type { NodeData } from "@/lib/types";

const toolIcons: Record<string, React.ReactNode> = {
  // Memory Store operations
  memory_store_get: <Search className="h-4 w-4" />,
  memory_store_put: <Save className="h-4 w-4" />,
  memory_store_delete: <Trash2 className="h-4 w-4" />,
  memory_store_list: <ListIcon className="h-4 w-4" />,
  // Queue operations
  queue_send: <Send className="h-4 w-4" />,
  queue_send_batch: <SendHorizonal className="h-4 w-4" />,
  queue_send_delayed: <Clock className="h-4 w-4" />,
  queue_consume: <Download className="h-4 w-4" />,
  // Analytics operations
  analytics_write: <FileText className="h-4 w-4" />,
  analytics_write_batch: <FileTextBatch className="h-4 w-4" />,
  analytics_query: <DatabaseQuery className="h-4 w-4" />,
};

const toolColors: Record<string, { border: string; bg: string; text: string }> = {
  // Memory Store operations (blue variants)
  memory_store_get: { border: "border-blue-500", bg: "bg-blue-100", text: "text-blue-500" },
  memory_store_put: { border: "border-blue-600", bg: "bg-blue-100", text: "text-blue-600" },
  memory_store_delete: { border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-400" },
  memory_store_list: { border: "border-blue-700", bg: "bg-blue-100", text: "text-blue-700" },
  // Queue operations (indigo variants)
  queue_send: { border: "border-indigo-500", bg: "bg-indigo-100", text: "text-indigo-500" },
  queue_send_batch: { border: "border-indigo-600", bg: "bg-indigo-100", text: "text-indigo-600" },
  queue_send_delayed: { border: "border-indigo-400", bg: "bg-indigo-50", text: "text-indigo-400" },
  queue_consume: { border: "border-indigo-700", bg: "bg-indigo-100", text: "text-indigo-700" },
  // Analytics operations (teal variants)
  analytics_write: { border: "border-teal-500", bg: "bg-teal-100", text: "text-teal-500" },
  analytics_write_batch: { border: "border-teal-600", bg: "bg-teal-100", text: "text-teal-600" },
  analytics_query: { border: "border-teal-700", bg: "bg-teal-100", text: "text-teal-700" },
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

