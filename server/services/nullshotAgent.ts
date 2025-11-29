/**
 * NullShot Agent Service
 * Encapsulates NullShot agent creation, tool loading, workflow execution, and agentChatURL generation
 */

import { DeploymentJob } from '../types/deploymentJob';
import { logger } from './logger';
import { deployToCloudflare, DeploymentConfig } from './cloudflareDeployer';

export interface DeployAgentResult {
  success: boolean;
  agentChatURL?: string;
  agentInstanceId?: string;
  workflowVersion?: string;
  error?: string;
}

/**
 * NullShot Agent Service
 * Handles agent deployment using NullShot framework
 */
export class NullShotAgentService {
  /**
   * Deploy an agent using NullShot framework
   * 
   * @param job - Deployment job containing workflow and modules
   * @returns Deployment result with agentChatURL and instance ID
   */
  async deploy(job: DeploymentJob): Promise<DeployAgentResult> {
    try {
      logger.info(`Starting deployment for job ${job.jobId}`);

      // Extract workflow and tools from job
      const workflow = job.workflowJSON;
      const tools = workflow?.tools || [];
      const selectedModules = job.selectedModules;

      if (!workflow || tools.length === 0) {
        throw new Error('Workflow or tools not found in job');
      }

      logger.debug(`Deploying agent with ${tools.length} tools:`, tools.map((t: { name?: string; toolFunction?: string; tool?: string }) => t.name || t.toolFunction || t.tool || 'unknown'));

      // Generate agent name from job
      const agentName = `Agent${job.jobId.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '')}`;
      const agentInstanceId = `agent-${job.jobId}-${Date.now()}`;
      const workflowVersion = `v${Date.now()}`;

      // Get API keys from environment or job metadata
      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
      }

      const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (!cloudflareAccountId || !cloudflareApiToken) {
        throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables are required');
      }

      // Prepare tools for deployment
      const deploymentTools = tools.map((tool: any) => ({
        name: tool.name || tool.toolFunction,
        description: tool.description || `Tool for ${tool.name || tool.toolFunction}`,
        inputSchema: tool.inputSchema || {},
        toolFunction: tool.toolFunction || tool.name,
      }));

      // Generate system prompt
      const systemPrompt = `You are a helpful AI assistant with access to ${deploymentTools.length} specialized blockchain tools:
${deploymentTools.map((t: { name: string; description: string }) => `- ${t.name}: ${t.description}`).join('\n')}

Use these tools when users ask you to perform blockchain operations. Always confirm what you're doing before executing any transactions.`;

      // Deploy to Cloudflare Workers
      logger.info('Deploying to Cloudflare Workers...');
      const deploymentConfig: DeploymentConfig = {
        agentName,
        agentId: agentInstanceId,
        tools: deploymentTools,
        systemPrompt,
        anthropicApiKey,
        cloudflareAccountId,
        cloudflareApiToken,
      };

      const deploymentResult = await deployToCloudflare(deploymentConfig);

      if (!deploymentResult.success) {
        throw new Error(deploymentResult.error || 'Deployment failed');
      }

      logger.info(`Deployment successful for job ${job.jobId}`, {
        agentInstanceId,
        agentChatURL: deploymentResult.agentChatURL,
        workflowVersion,
        workerName: deploymentResult.workerName,
      });

      return {
        success: true,
        agentChatURL: deploymentResult.agentChatURL,
        agentInstanceId,
        workflowVersion,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown deployment error';
      logger.error(`Deployment failed for job ${job.jobId}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

