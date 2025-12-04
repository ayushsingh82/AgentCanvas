/**
 * POST /api/runWorkflow
 * Run a workflow using NullShot agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { Workflow } from '@/types/workflow';
import { runWorkflow, initializeAgent } from '@/lib/agent/runner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, mcpTools } = body;
    
    if (!workflow) {
      return NextResponse.json({
        success: false,
        error: 'workflow is required',
      }, { status: 400 });
    }
    
    // Validate workflow structure
    if (!workflow.metadata || !workflow.nodes) {
      return NextResponse.json({
        success: false,
        error: 'Invalid workflow structure. Must include metadata and nodes.',
      }, { status: 400 });
    }
    
    // Initialize agent if not already initialized
    let agentChatURL = workflow.metadata.agentChatURL;
    
    if (!agentChatURL) {
      const { agentChatURL: newAgentChatURL } = await initializeAgent({
        userId: workflow.metadata.userId,
        sessionId: workflow.metadata.sessionId,
        workflow,
        mcpTools,
      });
      agentChatURL = newAgentChatURL;
    }
    
    // Run workflow
    const result = await runWorkflow(workflow as Workflow, mcpTools);
    
    return NextResponse.json({
      success: result.success,
      outputs: result.outputs,
      executionId: result.executionId,
      agentChatURL,
      error: result.error,
    }, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run workflow',
    }, { status: 500 });
  }
}

