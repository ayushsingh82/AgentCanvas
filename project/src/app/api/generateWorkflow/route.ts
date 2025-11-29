/**
 * POST /api/generateWorkflow
 * Generate workflow JSON from agent modules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentByIdAndWallet } from '@/lib/storage/agents';
import { buildWorkflow } from '@/lib/workflow/builder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, agentId } = body;
    
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
    
    // Get agent
    const agent = await getAgentByIdAndWallet(agentId, walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found or unauthorized',
      }, { status: 404 });
    }
    
    if (!agent.modules || agent.modules.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No modules found for agent. Please add modules first.',
      }, { status: 404 });
    }
    
    // Build workflow
    const { workflow, errors } = buildWorkflow(walletAddress, agent.modules);
    
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate workflow',
        errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      workflow,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate workflow',
    }, { status: 500 });
  }
}

