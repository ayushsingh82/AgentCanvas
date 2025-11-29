/**
 * Agent Storage using MongoDB
 */

import connectDB from '@/lib/db/mongodb';
import Agent, { IAgent } from '@/lib/db/models/Agent';
import { CreateAgentRequest, AgentMetadata } from '@/types/agent';
import { UserModuleSelection } from '@/types/module';

/**
 * Create a new agent
 */
export async function createAgent(data: CreateAgentRequest): Promise<IAgent> {
  await connectDB();
  
  const agent = new Agent({
    walletAddress: data.walletAddress,
    name: data.name,
    description: data.description,
    tags: data.tags || [],
    modules: data.modules,
    apiKeys: data.apiKeys || {},
    status: 'draft',
  });
  
  return await agent.save();
}

/**
 * Get all agents for a wallet address
 */
export async function getAgentsByWallet(walletAddress: string): Promise<IAgent[]> {
  await connectDB();
  
  return await Agent.find({ walletAddress })
    .sort({ createdAt: -1 })
    .exec();
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string): Promise<IAgent | null> {
  await connectDB();
  
  return await Agent.findById(agentId).exec();
}

/**
 * Get agent by ID and wallet address (for security)
 */
export async function getAgentByIdAndWallet(
  agentId: string,
  walletAddress: string
): Promise<IAgent | null> {
  await connectDB();
  
  return await Agent.findOne({ _id: agentId, walletAddress }).exec();
}

/**
 * Update agent
 */
export async function updateAgent(
  agentId: string,
  walletAddress: string,
  updates: Partial<{
    name: string;
    description: string;
    tags: string[];
    modules: UserModuleSelection[];
    workflow: any;
    agentChatURL: string;
    status: 'draft' | 'deployed' | 'archived';
    apiKeys: Record<string, string>;
  }>
): Promise<IAgent | null> {
  await connectDB();
  
  return await Agent.findOneAndUpdate(
    { _id: agentId, walletAddress },
    { $set: updates },
    { new: true }
  ).exec();
}

/**
 * Deploy agent (update status and set agentChatURL)
 */
export async function deployAgent(
  agentId: string,
  walletAddress: string,
  agentChatURL: string,
  workflow: any
): Promise<IAgent | null> {
  await connectDB();
  
  return await Agent.findOneAndUpdate(
    { _id: agentId, walletAddress },
    {
      $set: {
        status: 'deployed',
        agentChatURL,
        workflow,
        deployedAt: new Date(),
      },
    },
    { new: true }
  ).exec();
}

/**
 * Delete agent
 */
export async function deleteAgent(agentId: string, walletAddress: string): Promise<boolean> {
  await connectDB();
  
  const result = await Agent.findOneAndDelete({ _id: agentId, walletAddress }).exec();
  return !!result;
}

/**
 * Convert IAgent to AgentMetadata
 */
export function agentToMetadata(agent: IAgent): AgentMetadata {
  return {
    name: agent.name,
    description: agent.description,
    tags: agent.tags,
    walletAddress: agent.walletAddress,
    agentChatURL: agent.agentChatURL,
    status: agent.status,
    apiKeys: agent.apiKeys,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
    deployedAt: agent.deployedAt?.toISOString(),
  };
}

