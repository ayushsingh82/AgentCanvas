/**
 * POST /api/chat
 * DEPRECATED: Chat should be done directly with agentChatURL
 * This endpoint is kept for backward compatibility but should not be used
 * The frontend should connect directly to the agentChatURL returned from agent deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentByIdAndWallet } from '@/lib/storage/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, agentId, message } = body;
    
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'walletAddress is required and must be a string',
      }, { status: 400 });
    }
    
    if (!agentId) {
      return NextResponse.json({
        success: false,
        error: 'agentId is required',
      }, { status: 400 });
    }
    
    // Get agent to retrieve agentChatURL
    const agent = await getAgentByIdAndWallet(agentId, walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found or unauthorized',
      }, { status: 404 });
    }
    
    if (!agent.agentChatURL) {
      return NextResponse.json({
        success: false,
        error: 'Agent is not deployed. Please deploy the agent first.',
      }, { status: 400 });
    }
    
    // Return the agentChatURL so frontend can connect directly
    return NextResponse.json({
      success: true,
      message: 'Connect directly to agentChatURL for chat',
      agentChatURL: agent.agentChatURL,
      note: 'Chat should be done directly with the agentChatURL, not through this endpoint',
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process chat request',
    }, { status: 500 });
  }
}

