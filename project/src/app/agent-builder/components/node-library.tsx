"use client";

import { Database, List, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const availableTools = [
  {
    type: "memory_store",
    label: "Memory Store (KV)",
    description: "Fast key-value store for agent memory",
    icon: <Database className="h-5 w-5" />,
    borderColor: "border-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-500",
    operations: [
      { type: "memory_store_get", label: "Get", description: "Retrieve value by key" },
      { type: "memory_store_put", label: "Put", description: "Store key-value pair" },
      { type: "memory_store_delete", label: "Delete", description: "Remove key-value pair" },
      { type: "memory_store_list", label: "List", description: "List all keys with prefix" },
    ],
  },
  {
    type: "queue",
    label: "Queue",
    description: "Async message queuing for workflows",
    icon: <List className="h-5 w-5" />,
    borderColor: "border-indigo-500",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-500",
    operations: [
      { type: "queue_send", label: "Send", description: "Send single message to queue" },
      { type: "queue_send_batch", label: "Send Batch", description: "Send multiple messages" },
      { type: "queue_send_delayed", label: "Send Delayed", description: "Schedule message for future" },
      { type: "queue_consume", label: "Consume", description: "Process messages from queue" },
    ],
  },
  {
    type: "analytics",
    label: "Analytics",
    description: "Track metrics and monitor performance",
    icon: <BarChart3 className="h-5 w-5" />,
    borderColor: "border-teal-500",
    bgColor: "bg-teal-100",
    textColor: "text-teal-500",
    operations: [
      { type: "analytics_write", label: "Write Data Point", description: "Write single metric" },
      { type: "analytics_write_batch", label: "Write Batch", description: "Write multiple metrics" },
      { type: "analytics_query", label: "Query", description: "Query metrics with SQL" },
    ],
  },
];

export default function NodeLibrary() {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const onDragStart = (event: React.DragEvent, toolType: string) => {
    event.dataTransfer.setData("application/reactflow", toolType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 mb-4 mt-8">Drag the desired components to right and build agent</p>
      <div className="space-y-2">
        {availableTools.map((tool) => (
          <div key={tool.type} className={`border-2 ${tool.borderColor} bg-white rounded-lg overflow-hidden`}>
            {/* Main Tool Card */}
            <div
              onClick={() => setExpandedTool(expandedTool === tool.type ? null : tool.type)}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`rounded-full w-10 h-10 flex items-center justify-center ${tool.bgColor} ${tool.textColor}`}>
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-black">{tool.label}</div>
                    <div className="text-xs text-gray-500">{tool.description}</div>
                  </div>
                </div>
                <div className="text-gray-400">
                  {expandedTool === tool.type ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Operations */}
            {expandedTool === tool.type && (
              <div className="border-t-2 border-gray-200 bg-gray-50 p-2 space-y-1">
                {tool.operations.map((operation) => (
                  <div
                    key={operation.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, operation.type)}
                    className="p-2 bg-white border border-gray-300 rounded cursor-move hover:shadow-sm hover:border-gray-400 transition-all text-xs"
                  >
                    <div className="font-semibold text-black">{operation.label}</div>
                    <div className="text-gray-500 text-xs">{operation.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

