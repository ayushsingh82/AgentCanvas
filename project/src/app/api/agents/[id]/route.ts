/**
 * GET /api/agents/[id]
 * Get agent by ID
 * PUT /api/agents/[id]
 * Update agent
 * DELETE /api/agents/[id]
 * Delete agent
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAgentByIdAndWallet,
  updateAgent,
  deleteAgent,
  agentToMetadata,
} from '@/lib/storage/agents';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'walletAddress query parameter is required',
      }, { status: 400 });
    }
    
    const agent = await getAgentByIdAndWallet(params.id, walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      agent: {
        id: agent._id.toString(),
        ...agentToMetadata(agent),
        modules: agent.modules,
        workflow: agent.workflow,
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agent',
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { walletAddress, ...updates } = body;
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'walletAddress is required',
      }, { status: 400 });
    }
    
    const agent = await updateAgent(params.id, walletAddress, updates);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found or unauthorized',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      agent: {
        id: agent._id.toString(),
        ...agentToMetadata(agent),
        modules: agent.modules,
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update agent',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'walletAddress query parameter is required',
      }, { status: 400 });
    }
    
    const deleted = await deleteAgent(params.id, walletAddress);
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found or unauthorized',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully',
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete agent',
    }, { status: 500 });
  }
}

