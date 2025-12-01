/**
 * NullShot Agent Service
 * Encapsulates NullShot agent creation, tool loading, workflow execution, and agentChatURL generation
 */

import { DeploymentJob } from '../types/deploymentJob';
import { logger } from './logger';
import { deployToCloudflare, DeploymentConfig } from './cloudflareDeployer';
import { getModule } from '../modules';

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
      const selectedModules = job.selectedModules;

      if (!workflow || selectedModules.length === 0) {
        throw new Error('Workflow or selectedModules not found in job');
      }
      
      // Get API keys from job (passed from backend)
      const apiKeys = job.apiKeys || {};

      // Load tool definitions from module registry
      logger.debug(`Loading tools for ${selectedModules.length} modules...`);
      const deploymentTools = selectedModules.map(module => {
        const moduleDef = getModule(module.moduleName);
        if (!moduleDef) {
          throw new Error(`Module "${module.moduleName}" not found in registry`);
        }
        return {
          name: moduleDef.name,
          description: moduleDef.description,
          inputSchema: moduleDef.inputSchema,
          toolFunction: moduleDef.toolFunction,
        };
      });

      logger.debug(`Deploying agent with ${deploymentTools.length} tools:`, deploymentTools.map((t: { name: string; description: string }) => `${t.name} - ${t.description}`));

      // Generate unique agent name from job (keep it short for Cloudflare worker name limits)
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6); // 4 chars only
      // Short agent name - will be used as prefix, final worker name generated in deployer
      const agentName = `ag${job.jobId.substring(4, 8)}${randomSuffix}`.replace(/[^a-zA-Z0-9]/g, '');
      const agentInstanceId = `agent-${job.jobId}-${timestamp}`;
      const workflowVersion = `v${timestamp}`;

      // Get API keys from job, stored user keys, or environment
      logger.info('🔑 Retrieving API keys...');
      
      // First try to get from job apiKeys (but ignore placeholder values)
      let anthropicApiKey = apiKeys.llmKey || apiKeys.ANTHROPIC_API_KEY;
      let cloudflareAccountId = apiKeys.cloudflareAccountId;
      let cloudflareApiToken = apiKeys.cloudflareApiToken;
      
      // Ignore placeholder values like "your-key", "your-api-key", etc.
      // Note: "sk-ant-api03-" is the START of valid Anthropic keys, so we check for exact matches or short placeholders
      const placeholderValues = ['your-key', 'your-api-key', 'your_key', 'your_api_key', 'placeholder', 'example'];
      const isPlaceholder = anthropicApiKey && (
        anthropicApiKey.length < 20 || // Too short to be a real key
        placeholderValues.some(placeholder => anthropicApiKey.toLowerCase() === placeholder.toLowerCase() || anthropicApiKey.toLowerCase().startsWith(placeholder.toLowerCase() + '-'))
      );
      if (isPlaceholder) {
        logger.warn(`⚠️ Ignoring placeholder API key from job: ${anthropicApiKey}`);
        anthropicApiKey = undefined;
      }
      
      const keySource: string[] = [];
      if (anthropicApiKey) {
        keySource.push('job.apiKeys');
        logger.info(`📦 Found ANTHROPIC_API_KEY in job.apiKeys: ${anthropicApiKey.substring(0, 10)}... (length: ${anthropicApiKey.length})`);
      } else {
        logger.info(`⚠️ No valid ANTHROPIC_API_KEY in job.apiKeys (or placeholder detected)`);
      }
      if (cloudflareAccountId && cloudflareApiToken) {
        logger.info(`📦 Found Cloudflare credentials in job.apiKeys`);
      }
      
      // If not in job, try to get from stored user keys
      if (!anthropicApiKey || !cloudflareAccountId || !cloudflareApiToken) {
        try {
          logger.info(`🔍 Checking stored API keys for user: ${job.userId.substring(0, 10)}...`);
          const mongoose = require('mongoose');
          const ApiKeysSchema = new mongoose.Schema({}, { strict: false });
          const ApiKeys = mongoose.models.ApiKeys || mongoose.model('ApiKeys', ApiKeysSchema);
          const storedKeys = await ApiKeys.findOne({ walletAddress: job.userId });
          
          if (storedKeys) {
            logger.info('✅ Found stored API keys in database');
            if (!anthropicApiKey && storedKeys.anthropicApiKey) {
              // Check if stored key is also a placeholder
              const storedKey = storedKeys.anthropicApiKey;
              const placeholderValues = ['your-key', 'your-api-key', 'your_key', 'your_api_key', 'placeholder', 'example'];
              const isPlaceholder = storedKey.length < 20 || // Too short to be a real key
                placeholderValues.some(placeholder => storedKey.toLowerCase() === placeholder.toLowerCase() || storedKey.toLowerCase().startsWith(placeholder.toLowerCase() + '-'));
              if (isPlaceholder) {
                logger.warn(`⚠️ Stored ANTHROPIC_API_KEY is also a placeholder, ignoring`);
              } else {
                anthropicApiKey = storedKey;
                keySource.push('storedKeys.anthropicApiKey');
                logger.info(`📦 Retrieved ANTHROPIC_API_KEY from stored keys: ${anthropicApiKey.substring(0, 10)}... (length: ${anthropicApiKey.length})`);
              }
            }
            if (!cloudflareAccountId && storedKeys.cloudflareAccountId) {
              cloudflareAccountId = storedKeys.cloudflareAccountId;
              logger.info(`📦 Retrieved Cloudflare Account ID from stored keys`);
            }
            if (!cloudflareApiToken && storedKeys.cloudflareApiToken) {
              cloudflareApiToken = storedKeys.cloudflareApiToken;
              logger.info(`📦 Retrieved Cloudflare API Token from stored keys`);
            }
          } else {
            logger.info('⚠️ No stored API keys found in database for this user');
          }
        } catch (error) {
          logger.warn('❌ Could not fetch stored API keys:', error);
        }
      }
      
      // Fallback to environment variables
      if (!anthropicApiKey) {
        const envKey = process.env.ANTHROPIC_API_KEY;
        if (envKey) {
          // Also check if env var is a placeholder
          const placeholderValues = ['your-key', 'your-api-key', 'your_key', 'your_api_key', 'placeholder', 'example'];
          const isPlaceholder = envKey.length < 20 || // Too short to be a real key
            placeholderValues.some(placeholder => envKey.toLowerCase() === placeholder.toLowerCase() || envKey.toLowerCase().startsWith(placeholder.toLowerCase() + '-'));
          if (isPlaceholder) {
            logger.warn(`⚠️ Environment ANTHROPIC_API_KEY is also a placeholder, ignoring`);
          } else {
            anthropicApiKey = envKey;
            keySource.push('process.env.ANTHROPIC_API_KEY');
            logger.info(`📦 Retrieved ANTHROPIC_API_KEY from environment: ${anthropicApiKey.substring(0, 10)}... (length: ${anthropicApiKey.length})`);
          }
        } else {
          logger.warn(`⚠️ No ANTHROPIC_API_KEY in environment variables`);
        }
      }
      if (!cloudflareAccountId) {
        cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        if (cloudflareAccountId) {
          logger.info(`📦 Retrieved Cloudflare Account ID from environment`);
        }
      }
      if (!cloudflareApiToken) {
        cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
        if (cloudflareApiToken) {
          logger.info(`📦 Retrieved Cloudflare API Token from environment`);
        }
      }
      
      if (!anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY not found in job apiKeys, stored keys, or environment');
      }
      
      // Log final API key info (first 10 chars only for security)
      logger.info(`✅ Final ANTHROPIC_API_KEY source: ${keySource.join(' -> ')}`);
      logger.info(`🔑 Using ANTHROPIC_API_KEY: ${anthropicApiKey.substring(0, 10)}...${anthropicApiKey.substring(anthropicApiKey.length - 4)} (length: ${anthropicApiKey.length})`);
      logger.info(`🔑 API Key starts with: ${anthropicApiKey.substring(0, 20)}`);
      logger.info(`🔑 API Key ends with: ...${anthropicApiKey.substring(anthropicApiKey.length - 10)}`);
      
      // Cloudflare credentials are optional - will use environment if not provided
      if (!cloudflareAccountId || !cloudflareApiToken) {
        logger.warn('Cloudflare credentials not found in stored keys or job. Using environment variables.');
      }

      // Tools are already loaded from module registry above

      // Generate system prompt (codeGenerator will customize for hello module)
      const hasHelloModule = deploymentTools.some(t => t.name === 'hello_greet');
      const systemPrompt = hasHelloModule
        ? `You are a friendly AI assistant. You have access to a greeting tool that can say hello to users.
When users send messages, you can use the hello_greet tool to greet them warmly.
Be conversational and helpful.`
        : `You are a helpful AI assistant with access to ${deploymentTools.length} specialized blockchain tools:
${deploymentTools.map((t: { name: string; description: string }) => `- ${t.name}: ${t.description}`).join('\n')}

Use these tools when users ask you to perform blockchain operations. Always confirm what you're doing before executing any transactions.`;

      // Deploy to Cloudflare Workers
      logger.info('Deploying to Cloudflare Workers...');
      // Deploy to Cloudflare (each deployment creates a NEW worker with unique name)
      const deploymentConfig: DeploymentConfig = {
        agentName,
        agentId: `${agentInstanceId}-${Date.now()}`, // Ensure unique ID for each deployment
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

