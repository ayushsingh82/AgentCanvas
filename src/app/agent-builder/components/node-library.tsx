"use client";

import { Coins, Image as ImageIcon, Users, Gift } from "lucide-react";

const availableTools = [
  {
    type: "deploy_erc20",
    label: "Deploy ERC-20",
    description: "Deploy ERC-20 token",
    icon: <Coins className="h-5 w-5" />,
    color: "border-yellow-500 bg-yellow-100 text-yellow-500",
  },
  {
    type: "deploy_erc721",
    label: "Deploy ERC-721",
    description: "Deploy ERC-721 NFT",
    icon: <ImageIcon className="h-5 w-5" />,
    color: "border-pink-500 bg-pink-100 text-pink-500",
  },
  {
    type: "create_dao",
    label: "Create DAO",
    description: "Create a new DAO",
    icon: <Users className="h-5 w-5" />,
    color: "border-indigo-500 bg-indigo-100 text-indigo-500",
  },
  {
    type: "airdrop",
    label: "Airdrop",
    description: "Airdrop tokens to addresses",
    icon: <Gift className="h-5 w-5" />,
    color: "border-cyan-500 bg-cyan-100 text-cyan-500",
  },
];

export default function NodeLibrary() {
  const onDragStart = (event: React.DragEvent, toolType: string) => {
    event.dataTransfer.setData("application/reactflow", toolType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black text-black mb-4">Tools</h2>
      <div className="space-y-3">
        {availableTools.map((tool) => (
          <div
            key={tool.type}
            draggable
            onDragStart={(e) => onDragStart(e, tool.type)}
            className={`p-4 border-2 ${tool.color.split(' ')[0]} bg-white rounded-lg cursor-move hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full w-10 h-10 flex items-center justify-center ${tool.color.split(' ')[1]} ${tool.color.split(' ')[2]}`}>
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

