/**
 * POST /api/getUserModules
 * DEPRECATED: Use /api/agents/[id] instead
 * Get saved modules for a user (kept for backward compatibility)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentByIdAndWallet } from '@/lib/storage/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, agentId } = body;
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'userId is required and must be a string',
      }, { status: 400 });
    }
    
    if (!agentId) {
      return NextResponse.json({
        success: false,
        error: 'agentId is required. Please use /api/agents to get agent list.',
      }, { status: 400 });
    }
    
    const agent = await getAgentByIdAndWallet(agentId, userId);
    
    if (!agent) {
      return NextResponse.json({
        success: true,
        modules: [],
        message: 'Agent not found',
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: true,
      modules: agent.modules,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user modules',
    }, { status: 500 });
  }
}

