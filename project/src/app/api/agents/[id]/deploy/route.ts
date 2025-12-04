/**
 * POST /api/agents/[id]/deploy
 * Deploy an agent (generate workflow and get agentChatURL)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentByIdAndWallet, agentToMetadata } from '@/lib/storage/agents';
import { buildWorkflow } from '@/lib/workflow/builder';
import connectDB from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { walletAddress } = body;
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'walletAddress is required',
      }, { status: 400 });
    }
    
    // Get agent
    const agent = await getAgentByIdAndWallet(id, walletAddress);
    
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
    
    // Create deployment job in MongoDB for the deployment server to pick up
    await connectDB();
    
    // Fetch stored API keys if agent doesn't have them
    let apiKeys = agent.apiKeys || {};
    if (!apiKeys.llmKey && !apiKeys.ANTHROPIC_API_KEY) {
      try {
        const ApiKeysSchema = new mongoose.Schema({}, { strict: false });
        const ApiKeys = mongoose.models.ApiKeys || mongoose.model('ApiKeys', ApiKeysSchema);
        const storedKeys = await ApiKeys.findOne({ walletAddress });
        
        if (storedKeys) {
          apiKeys = {
            ...apiKeys,
            llmKey: storedKeys.anthropicApiKey,
            ANTHROPIC_API_KEY: storedKeys.anthropicApiKey,
            cloudflareAccountId: storedKeys.cloudflareAccountId,
            cloudflareApiToken: storedKeys.cloudflareApiToken,
          };
        }
      } catch (error) {
        console.warn('Could not fetch stored API keys:', error);
        // Continue with empty apiKeys - deployment server will use env vars
      }
    }
    
    const DeploymentJobSchema = new mongoose.Schema({
      jobId: { type: String, required: true, unique: true, index: true },
      userId: { type: String, required: true, index: true },
      agentId: { type: String, index: true }, // Reference to Agent document
      selectedModules: {
        type: [{
          moduleName: { type: String, required: true },
          order: { type: Number },
        }],
        required: true,
      },
      workflowJSON: { type: mongoose.Schema.Types.Mixed, required: true },
      status: {
        type: String,
        enum: ['pending', 'deploying', 'deployed', 'failed'],
        default: 'pending',
        index: true,
      },
      apiKeys: { type: mongoose.Schema.Types.Mixed, default: {} },
      agentChatURL: { type: String },
      agentInstanceId: { type: String },
      workflowVersion: { type: String },
      deployedAt: { type: Date },
      errorMessage: { type: String },
    }, { timestamps: true });
    
    const DeploymentJob = mongoose.models.DeploymentJob || mongoose.model('DeploymentJob', DeploymentJobSchema);
    
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const deploymentJob = new DeploymentJob({
      jobId,
      userId: walletAddress,
      agentId: id, // Reference to Agent document
      selectedModules: agent.modules,
      workflowJSON: {
        ...workflow,
        tools, // Include tool definitions for server
      },
      status: 'pending',
      apiKeys, // Use fetched keys or empty (deployment server will use env vars)
    });
    
    await deploymentJob.save();
    
    // Return job ID - deployment server will pick it up automatically
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Deployment job created. The deployment server will process it shortly.',
      status: 'pending',
      agentId: id,
    }, { status: 202 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deploy agent',
    }, { status: 500 });
  }
}

