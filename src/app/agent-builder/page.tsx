"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type ReactFlowInstance,
  type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { ToolNode } from "./components/nodes/tool-node";
import { AgentNode } from "./components/nodes/agent-node";
import NodeLibrary from "./components/node-library";
import CustomEdge from "./components/custom-edge";
import { generateNodeId, createNode } from "@/lib/workflow-utils";

export const dynamic = 'force-dynamic';

const toolTypes = ["memory_store", "llm_call", "webhook_receiver", "mcp_tool", "queue", "analytics"];

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  memory_store: ToolNode,
  llm_call: ToolNode,
  webhook_receiver: ToolNode,
  mcp_tool: ToolNode,
  queue: ToolNode,
  analytics: ToolNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

const AGENT_NODE_ID = "agent-node";

const createAgentNode = (): Node => ({
  id: AGENT_NODE_ID,
  type: "agent",
  position: { x: 100, y: 100 },
  data: {
    label: "Agent",
    description: "Your agent",
    config: {},
  },
  draggable: true,
  selectable: true,
  deletable: false,
});

export default function AgentBuilderPage() {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([createAgentNode()]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const filteredChanges = changes.filter((change) => {
        if (change.type === "remove" && change.id === AGENT_NODE_ID) {
          return false;
        }
        return true;
      });
      onNodesChange(filteredChanges);

      setNodes((nds) => {
        const hasAgentNode = nds.some((node) => node.id === AGENT_NODE_ID);
        if (!hasAgentNode) {
          return [...nds, createAgentNode()];
        }
        return nds;
      });
    },
    [onNodesChange, setNodes]
  );

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, type: "custom" }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type || !toolTypes.includes(type)) {
        return;
      }

      if (reactFlowBounds && reactFlowInstance) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode = createNode({
          type,
          position,
          id: generateNodeId(type),
        });

        setNodes((nds) => {
          const updatedNodes = nds.concat(newNode);
          setEdges((eds) => {
            const hasIncoming = eds.some((edge) => edge.target === newNode.id);
            if (!hasIncoming) {
              const agentEdge: Edge = {
                id: `edge-${AGENT_NODE_ID}-${newNode.id}`,
                source: AGENT_NODE_ID,
                target: newNode.id,
                type: "custom",
              };
              return [...eds, agentEdge];
            }
            return eds;
          });
          return updatedNodes;
        });
      }
    },
    [reactFlowInstance, setNodes, setEdges]
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white">
      {/* Left Sidebar */}
      <div className="w-64 border-r-2 border-black p-4 pt-24 bg-white overflow-y-auto">
        <NodeLibrary />
      </div>

      {/* Right Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              defaultEdgeOptions={{ type: "custom" }}
            >
              <Background />
              <Controls />
              <MiniMap />
              <Panel position="top-left" className="pt-6 pl-6">
                <button 
                  onClick={() => router.push("/my-agents")}
                  className="bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] px-5 py-2 rounded-lg text-sm font-bold text-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                >
                  ← Back
                </button>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
