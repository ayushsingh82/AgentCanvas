"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Coins,
  Image,
  ArrowRightLeft,
  Users,
  DollarSign,
  Database,
  Wallet,
  FileText,
  Mail,
  Bell,
  CheckSquare,
  Calendar,
} from "lucide-react";
import type { NodeData } from "@/lib/types";

const toolIcons: Record<string, React.ReactNode> = {
  // Onchain Actions
  mint_token: <Coins className="h-4 w-4" />,
  mint_nft: <Image className="h-4 w-4" />,
  transfer_asset: <ArrowRightLeft className="h-4 w-4" />,
  create_dao: <Users className="h-4 w-4" />,
  // Onchain Data
  fetch_price: <DollarSign className="h-4 w-4" />,
  fetch_states: <Database className="h-4 w-4" />,
  fetch_balance: <Wallet className="h-4 w-4" />,
  fetch_transactions: <FileText className="h-4 w-4" />,
  // Productivity
  send_email: <Mail className="h-4 w-4" />,
  set_reminder: <Bell className="h-4 w-4" />,
  create_task: <CheckSquare className="h-4 w-4" />,
  schedule_meeting: <Calendar className="h-4 w-4" />,
};

const toolColors: Record<string, { border: string; bg: string; text: string }> = {
  // Onchain Actions (blue variants)
  mint_token: { border: "border-blue-500", bg: "bg-blue-100", text: "text-blue-500" },
  mint_nft: { border: "border-blue-600", bg: "bg-blue-100", text: "text-blue-600" },
  transfer_asset: { border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-400" },
  create_dao: { border: "border-blue-700", bg: "bg-blue-100", text: "text-blue-700" },
  // Onchain Data (indigo variants)
  fetch_price: { border: "border-indigo-500", bg: "bg-indigo-100", text: "text-indigo-500" },
  fetch_states: { border: "border-indigo-600", bg: "bg-indigo-100", text: "text-indigo-600" },
  fetch_balance: { border: "border-indigo-400", bg: "bg-indigo-50", text: "text-indigo-400" },
  fetch_transactions: { border: "border-indigo-700", bg: "bg-indigo-100", text: "text-indigo-700" },
  // Productivity (teal variants)
  send_email: { border: "border-teal-500", bg: "bg-teal-100", text: "text-teal-500" },
  set_reminder: { border: "border-teal-600", bg: "bg-teal-100", text: "text-teal-600" },
  create_task: { border: "border-teal-400", bg: "bg-teal-50", text: "text-teal-400" },
  schedule_meeting: { border: "border-teal-700", bg: "bg-teal-100", text: "text-teal-700" },
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

