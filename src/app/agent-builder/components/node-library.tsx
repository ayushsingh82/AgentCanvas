"use client";

import { Database, Brain, Webhook, Puzzle, List, BarChart3 } from "lucide-react";

const availableTools = [
  {
    type: "memory_store",
    label: "Memory Store (KV)",
    description: "Fast key-value store for agent memory",
    icon: <Database className="h-5 w-5" />,
    borderColor: "border-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-500",
  },
  {
    type: "llm_call",
    label: "LLM Call",
    description: "Call any LLM provider for AI processing",
    icon: <Brain className="h-5 w-5" />,
    borderColor: "border-purple-500",
    bgColor: "bg-purple-100",
    textColor: "text-purple-500",
  },
  {
    type: "webhook_receiver",
    label: "Webhook Receiver",
    description: "Receive and process webhook data",
    icon: <Webhook className="h-5 w-5" />,
    borderColor: "border-green-500",
    bgColor: "bg-green-100",
    textColor: "text-green-500",
  },
  {
    type: "mcp_tool",
    label: "MCP Tool",
    description: "Model Context Protocol tool integration",
    icon: <Puzzle className="h-5 w-5" />,
    borderColor: "border-orange-500",
    bgColor: "bg-orange-100",
    textColor: "text-orange-500",
  },
  {
    type: "queue",
    label: "Queue",
    description: "Async message queuing for workflows",
    icon: <List className="h-5 w-5" />,
    borderColor: "border-indigo-500",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-500",
  },
  {
    type: "analytics",
    label: "Analytics",
    description: "Track metrics and monitor performance",
    icon: <BarChart3 className="h-5 w-5" />,
    borderColor: "border-teal-500",
    bgColor: "bg-teal-100",
    textColor: "text-teal-500",
  },
];

export default function NodeLibrary() {
  const onDragStart = (event: React.DragEvent, toolType: string) => {
    event.dataTransfer.setData("application/reactflow", toolType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 mb-4 mt-8">Drag the desired components to right and build agent</p>
      <div className="space-y-3">
        {availableTools.map((tool) => (
          <div
            key={tool.type}
            draggable
            onDragStart={(e) => onDragStart(e, tool.type)}
            className={`p-4 border-2 ${tool.borderColor} bg-white rounded-lg cursor-move hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full w-10 h-10 flex items-center justify-center ${tool.bgColor} ${tool.textColor}`}>
                {tool.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-black">{tool.label}</div>
                <div className="text-xs text-gray-500">{tool.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

