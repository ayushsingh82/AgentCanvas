/**
 * Agent Runner
 * Handles NullShot agent execution and deployment
 */

import { Workflow, WorkflowExecutionResult } from '@/types/workflow';
import { AgentRunnerConfig, ChatMessage } from '@/types/agent';
import { saveSession, getSession, getSessionByUserId, addChatMessage, getChatHistory } from './sessionStore';
import { deployToCloudflare, DeploymentConfig } from './deployer';
import { ToolDefinition } from '@/types/module';

/**
 * NullShot Agent Runner
 * This is a stub implementation that will be replaced with actual NullShot integration
 */
class NullShotRunner {
  private agentInstances: Map<string, any> = new Map();
  
  /**
   * Initialize and deploy a NullShot agent instance to Cloudflare Workers
   */
  async initializeAgent(config: AgentRunnerConfig): Promise<{ agentInstanceId: string; agentChatURL: string }> {
    try {
      const agentInstanceId = `agent-${config.sessionId}-${Date.now()}`;
      
      // Extract tools from workflow
      const tools: ToolDefinition[] = (config.workflow as any)?.tools || [];
      
      if (tools.length === 0) {
        throw new Error('No tools found in workflow. Agent must have at least one module.');
      }
      
      // Get agent name from config or generate one
      const agentName = (config.workflow as any)?.metadata?.agentId?.replace('agent-', '') || 
                       `agent-${config.userId.substring(0, 8)}`;
      
      // Prepare deployment configuration
      const deploymentConfig: DeploymentConfig = {
        agentName,
        agentId: agentInstanceId,
        tools,
        apiKeys: {
          llmKey: config.mcpTools?.llmKey,
          cloudflareKey: config.mcpTools?.cloudflareKey,
          ...config.mcpTools,
        },
        systemPrompt: `You are a helpful AI assistant with access to specialized tools for blockchain operations.
You can help users deploy tokens, create NFTs, set up DAOs, transfer funds, execute airdrops, and create marketplaces.
Always confirm what you're doing before executing any blockchain operations.`,
        cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
      };
      
      // Deploy to Cloudflare Workers
      const deploymentResult = await deployToCloudflare(deploymentConfig);
      
      if (!deploymentResult.success) {
        // Fallback to placeholder URL if deployment fails
        console.warn('Cloudflare deployment failed, using placeholder URL:', deploymentResult.error);
        const baseURL = process.env.AGENT_BASE_URL || 'https://agent.nullshot.io';
        const agentChatURL = `${baseURL}/chat/${agentInstanceId}?session=${config.sessionId}`;
        
        this.agentInstances.set(agentInstanceId, {
          config,
          apiKeys: config.mcpTools,
          createdAt: new Date().toISOString(),
          deploymentStatus: 'failed',
        });
        
        return { agentInstanceId, agentChatURL };
      }
      
      // Store agent instance with deployment info
      this.agentInstances.set(agentInstanceId, {
        config,
        apiKeys: config.mcpTools,
        createdAt: new Date().toISOString(),
        deploymentStatus: 'deployed',
        workerName: deploymentResult.workerName,
        deploymentId: deploymentResult.deploymentId,
      });
      
      return {
        agentInstanceId,
        agentChatURL: deploymentResult.agentChatURL || '',
      };
    } catch (error) {
      console.error('Error initializing agent:', error);
      
      // Fallback to placeholder URL
      const agentInstanceId = `agent-${config.sessionId}-${Date.now()}`;
      const baseURL = process.env.AGENT_BASE_URL || 'https://agent.nullshot.io';
      const agentChatURL = `${baseURL}/chat/${agentInstanceId}?session=${config.sessionId}`;
      
      return { agentInstanceId, agentChatURL };
    }
  }
  
  /**
   * Run a workflow
   */
  async runWorkflow(workflow: Workflow, mcpTools?: Record<string, any>): Promise<WorkflowExecutionResult> {
    try {
      // TODO: Replace with actual NullShot workflow execution
      // const result = await NullShot.runWorkflow({
      //   workflow: workflow.nodes,
      //   tools: mcpTools,
      // });
      
      // Stub implementation
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Simulate workflow execution
      const outputs: Record<string, any> = {};
      for (const node of workflow.nodes) {
        outputs[node.id] = {
          tool: node.tool,
          parameters: node.parameters,
          result: `Executed ${node.name} successfully`,
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        success: true,
        outputs,
        executionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Send a chat message to the agent
   */
  async chat(
    agentInstanceId: string,
    message: string,
    sessionId: string
  ): Promise<{ response: string; error?: string }> {
    try {
      const agentInstance = this.agentInstances.get(agentInstanceId);
      if (!agentInstance) {
        return {
          response: '',
          error: 'Agent instance not found',
        };
      }
      
      // TODO: Replace with actual NullShot chat
      // const response = await agentInstance.chat(message);
      
      // Stub implementation
      const response = `Agent response to: "${message}". This is a stub response. Replace with actual NullShot chat integration.`;
      
      return { response };
    } catch (error) {
      return {
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Get agent instance
   */
  getAgentInstance(agentInstanceId: string) {
    return this.agentInstances.get(agentInstanceId);
  }
}

// Singleton instance
const runner = new NullShotRunner();

/**
 * Run a workflow using NullShot
 */
export async function runWorkflow(
  workflow: Workflow,
  mcpTools?: Record<string, any>
): Promise<WorkflowExecutionResult> {
  return await runner.runWorkflow(workflow, mcpTools);
}

/**
 * Initialize agent and create session
 */
export async function initializeAgent(config: AgentRunnerConfig): Promise<{
  agentInstanceId: string;
  agentChatURL: string;
  sessionId: string;
}> {
  const { agentInstanceId, agentChatURL } = await runner.initializeAgent(config);
  
  // Save session
  const session = {
    userId: config.userId,
    sessionId: config.sessionId,
    agentInstanceId,
    agentChatURL,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    context: {
      workflow: config.workflow,
    },
  };
  
  await saveSession(session);
  
  return {
    agentInstanceId,
    agentChatURL,
    sessionId: config.sessionId,
  };
}

/**
 * Chat with agent
 */
export async function chatWithAgent(
  userId: string,
  message: string,
  sessionId?: string
): Promise<{ response: string; sessionId: string; agentChatURL?: string; error?: string }> {
  // Get or create session
  let session = sessionId ? await getSession(sessionId) : await getSessionByUserId(userId);
  
  if (!session || !session.agentInstanceId) {
    return {
      response: '',
      sessionId: sessionId || '',
      error: 'No active agent session found. Please deploy an agent first.',
    };
  }
  
  // Add user message to history
  await addChatMessage(session.sessionId, {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  });
  
  // Get agent response
  const { response, error } = await runner.chat(
    session.agentInstanceId,
    message,
    session.sessionId
  );
  
  if (error) {
    return {
      response: '',
      sessionId: session.sessionId,
      agentChatURL: session.agentChatURL,
      error,
    };
  }
  
  // Add agent response to history
  await addChatMessage(session.sessionId, {
    role: 'assistant',
    content: response,
    timestamp: new Date().toISOString(),
  });
  
  // Update session last activity
  session.lastActivity = new Date().toISOString();
  await saveSession(session);
  
  return {
    response,
    sessionId: session.sessionId,
    agentChatURL: session.agentChatURL,
  };
}

