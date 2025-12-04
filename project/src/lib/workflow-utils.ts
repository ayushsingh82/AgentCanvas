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
    // Onchain Actions
    mint_token: "Mint Token",
    mint_nft: "Mint NFT",
    transfer_asset: "Transfer Asset",
    create_dao: "Create DAO",
    // Onchain Data
    fetch_price: "Fetch Price",
    fetch_states: "Fetch States",
    fetch_balance: "Fetch Balance",
    fetch_transactions: "Fetch Transactions",
    // Productivity
    send_email: "Send Email",
    set_reminder: "Set Reminder",
    create_task: "Create Task",
    schedule_meeting: "Schedule Meeting",
  };
  return labels[type] || "Tool";
};

const getDefaultDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    // Onchain Actions
    mint_token: "Create and mint new ERC20 tokens",
    mint_nft: "Create and mint new NFT tokens",
    transfer_asset: "Transfer tokens or assets between addresses",
    create_dao: "Deploy a new decentralized autonomous organization",
    // Onchain Data
    fetch_price: "Get token prices from DEXs",
    fetch_states: "Retrieve contract states and data",
    fetch_balance: "Get wallet token balances",
    fetch_transactions: "Query transaction history",
    // Productivity
    send_email: "Send emails via SMTP",
    set_reminder: "Create calendar reminders",
    create_task: "Add tasks to task management",
    schedule_meeting: "Book calendar meetings",
  };
  return descriptions[type] || "Workflow tool";
};

