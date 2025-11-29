/**
 * GET /api/agents
 * Get all agents for a wallet address
 * POST /api/agents
 * Create a new agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentsByWallet, createAgent, agentToMetadata } from '@/lib/storage/agents';
import { CreateAgentRequest } from '@/types/agent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'walletAddress query parameter is required',
      }, { status: 400 });
    }
    
    // Validate wallet address format (basic check)
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format',
      }, { status: 400 });
    }
    
    const agents = await getAgentsByWallet(walletAddress);
    
    return NextResponse.json({
      success: true,
      agents: agents.map(agent => ({
        id: agent._id.toString(),
        ...agentToMetadata(agent),
        modules: agent.modules,
      })),
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agents',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, name, description, tags, modules, apiKeys } = body;
    
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'walletAddress is required and must be a string',
      }, { status: 400 });
    }
    
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format',
      }, { status: 400 });
    }
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'name is required and must be a string',
      }, { status: 400 });
    }
    
    if (!Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'modules must be a non-empty array',
      }, { status: 400 });
    }
    
    // Validate modules - they should just be module names (capabilities)
    // Input parameters are not required - they come from chat conversation
    const validatedModules = modules.map((mod: any, index: number) => {
      if (!mod.moduleName || typeof mod.moduleName !== 'string') {
        throw new Error(`Module ${index}: moduleName is required and must be a string`);
      }
      return {
        moduleName: mod.moduleName,
        // Input is optional - modules are tools/capabilities, not pre-configured actions
        input: mod.input || {},
        order: mod.order !== undefined ? mod.order : index,
      };
    });
    
    const agentData: CreateAgentRequest = {
      walletAddress,
      name,
      description,
      tags,
      modules: validatedModules,
      apiKeys,
    };
    
    const agent = await createAgent(agentData);
    
    return NextResponse.json({
      success: true,
      agent: {
        id: agent._id.toString(),
        ...agentToMetadata(agent),
        modules: agent.modules,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create agent',
    }, { status: 500 });
  }
}

