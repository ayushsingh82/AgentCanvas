/**
 * POST /api/agents/[id]/deploy
 * Deploy an agent (generate workflow and get agentChatURL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentByIdAndWallet, deployAgent, agentToMetadata } from '@/lib/storage/agents';
import { buildWorkflow } from '@/lib/workflow/builder';
import { initializeAgent } from '@/lib/agent/runner';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'walletAddress is required',
      }, { status: 400 });
    }
    
    // Get agent
    const agent = await getAgentByIdAndWallet(params.id, walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found or unauthorized',
      }, { status: 404 });
    }
    
    if (agent.modules.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Agent must have at least one module to deploy',
      }, { status: 400 });
    }
    
    // Generate workflow and tool definitions
    // Modules are registered as available tools (capabilities)
    // Parameters will come from chat conversation when agent uses the tool
    const { workflow, errors, tools } = buildWorkflow(walletAddress, agent.modules);
    
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate workflow',
        errors,
      }, { status: 400 });
    }
    
    // Tools are now registered with the agent
    // The agent can use these tools based on chat conversation
    
    // Initialize agent with API keys and registered tools
    // Tools are capabilities - agent will use them based on chat conversation
    const { agentChatURL } = await initializeAgent({
      userId: walletAddress,
      sessionId: workflow.metadata.sessionId,
      workflow: {
        ...workflow,
        tools, // Pass tool definitions for agent registration
      },
      mcpTools: agent.apiKeys,
    });
    
    // Update agent with deployed status
    const deployedAgent = await deployAgent(
      params.id,
      walletAddress,
      agentChatURL,
      workflow
    );
    
    if (!deployedAgent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update agent status',
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      agent: {
        id: deployedAgent._id.toString(),
        ...agentToMetadata(deployedAgent),
        modules: deployedAgent.modules,
        workflow: deployedAgent.workflow,
      },
      agentChatURL,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deploy agent',
    }, { status: 500 });
  }
}

