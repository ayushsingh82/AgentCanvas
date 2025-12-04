"use client";

import { Coins, Database, Mail, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const availableTools = [
  {
    type: "onchain_action",
    label: "Onchain Action",
    description: "Blockchain operations and transactions",
    icon: <Coins className="h-5 w-5" />,
    borderColor: "border-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-500",
    operations: [
      { type: "mint_token", label: "Mint Token", description: "Create and mint new ERC20 tokens" },
      { type: "mint_nft", label: "Mint NFT", description: "Create and mint new NFT tokens" },
      { type: "transfer_asset", label: "Transfer Asset", description: "Transfer tokens or assets between addresses" },
      { type: "create_dao", label: "Create DAO", description: "Deploy a new decentralized autonomous organization" },
      { type: "add_more", label: "Add More", description: "More onchain actions coming soon", comingSoon: true },
    ],
  },
  {
    type: "onchain_data",
    label: "Onchain Data",
    description: "Fetch blockchain data and states",
    icon: <Database className="h-5 w-5" />,
    borderColor: "border-indigo-500",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-500",
    operations: [
      { type: "fetch_price", label: "Fetch Price", description: "Get token prices from DEXs", comingSoon: true },
      { type: "fetch_states", label: "Fetch States", description: "Retrieve contract states and data", comingSoon: true },
      { type: "fetch_balance", label: "Fetch Balance", description: "Get wallet token balances", comingSoon: true },
      { type: "fetch_transactions", label: "Fetch Transactions", description: "Query transaction history", comingSoon: true },
    ],
  },
  {
    type: "productivity",
    label: "Productivity",
    description: "Automation and productivity tools",
    icon: <Mail className="h-5 w-5" />,
    borderColor: "border-teal-500",
    bgColor: "bg-teal-100",
    textColor: "text-teal-500",
    operations: [
      { type: "send_email", label: "Send Email", description: "Send emails via SMTP", comingSoon: true },
      { type: "set_reminder", label: "Set Reminder", description: "Create calendar reminders", comingSoon: true },
      { type: "create_task", label: "Create Task", description: "Add tasks to task management", comingSoon: true },
      { type: "schedule_meeting", label: "Schedule Meeting", description: "Book calendar meetings", comingSoon: true },
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
      <p className="text-xs text-gray-400 mb-4">Drag the desired components to right and build agent</p>
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
                    draggable={!operation.comingSoon}
                    onDragStart={(e) => !operation.comingSoon && onDragStart(e, operation.type)}
                    className={`p-2 bg-white border border-gray-300 rounded text-xs transition-all ${
                      operation.comingSoon 
                        ? 'cursor-not-allowed opacity-60' 
                        : 'cursor-move hover:shadow-sm hover:border-gray-400'
                    }`}
                    title={operation.comingSoon ? 'Coming soon' : operation.description}
                  >
                    <div className="font-semibold text-black flex items-center justify-between">
                      <span>{operation.label}</span>
                      {operation.comingSoon && (
                        <span className="text-xs text-gray-400 italic">Coming soon</span>
                      )}
                    </div>
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

