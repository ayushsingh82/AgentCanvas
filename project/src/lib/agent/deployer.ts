/**
 * Cloudflare Workers Deployment Utility
 * Handles deployment of NullShot agents to Cloudflare Workers
 */

import { generateAgentCode, generateWranglerConfig, generatePackageJson } from './codeGenerator';
import { ToolDefinition } from '@/types/module';

export interface DeploymentConfig {
  agentName: string;
  agentId: string;
  tools: ToolDefinition[];
  apiKeys: {
    llmKey?: string;
    cloudflareKey?: string;
    [key: string]: string | undefined;
  };
  systemPrompt?: string;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
}

export interface DeploymentResult {
  success: boolean;
  agentChatURL?: string;
  workerName?: string;
  error?: string;
  deploymentId?: string;
}

/**
 * Deploy agent to Cloudflare Workers using Cloudflare API
 */
export async function deployToCloudflare(config: DeploymentConfig): Promise<DeploymentResult> {
  try {
    const { agentName, agentId, tools, apiKeys, systemPrompt, cloudflareAccountId, cloudflareApiToken } = config;
    
    if (!cloudflareAccountId || !cloudflareApiToken) {
      return {
        success: false,
        error: 'Cloudflare account ID and API token are required for deployment. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.',
      };
    }
    
    // Generate agent code
    const agentCode = generateAgentCode({
      agentName: `${agentName}Agent`,
      tools,
      apiKeys,
      systemPrompt,
    });
    
    const workerName = `${agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${agentId.substring(0, 8)}`;
    
    // Deploy using Cloudflare Workers API
    // Step 1: Create/Update Worker script
    const scriptResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/workers/scripts/${workerName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/javascript',
        },
        body: agentCode,
      }
    );
    
    if (!scriptResponse.ok) {
      const errorText = await scriptResponse.text();
      throw new Error(`Failed to upload worker script: ${errorText}`);
    }
    
    // Step 2: Set environment variables (secrets)
    if (apiKeys.llmKey) {
      const secretResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/workers/scripts/${workerName}/secrets`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${cloudflareApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'ANTHROPIC_API_KEY',
            text: apiKeys.llmKey,
            type: 'secret_text',
          }),
        }
      );
      
      if (!secretResponse.ok) {
        console.warn('Failed to set ANTHROPIC_API_KEY secret');
      }
    }
    
    // Step 3: Publish worker
    const publishResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/workers/scripts/${workerName}/deployments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy: 'percentage',
          versions: [{ version_id: 'latest', percentage: 100 }],
        }),
      }
    );
    
    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      throw new Error(`Failed to publish worker: ${errorText}`);
    }
    
    const agentChatURL = `https://${workerName}.${cloudflareAccountId}.workers.dev/agent/chat`;
    
    return {
      success: true,
      agentChatURL,
      workerName,
      deploymentId: `deploy-${Date.now()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deploy agent',
    };
  }
}

/**
 * Alternative: Deploy using Wrangler CLI (requires file system access)
 * This would be used if running deployment from a server with file system access
 */
export async function deployWithWrangler(
  config: DeploymentConfig,
  projectPath: string
): Promise<DeploymentResult> {
  try {
    // This would require:
    // 1. Creating a temporary directory
    // 2. Writing generated files
    // 3. Running wrangler deploy command
    // 4. Cleaning up temporary files
    
    // For serverless environments, use deployToCloudflare instead
    
    throw new Error('Wrangler deployment requires file system access. Use deployToCloudflare for serverless environments.');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deploy with Wrangler',
    };
  }
}

/**
 * Generate deployment package (files ready for deployment)
 */
export function generateDeploymentPackage(config: DeploymentConfig): {
  'src/index.ts': string;
  'wrangler.jsonc': string;
  'package.json': string;
} {
  const { agentName, tools, apiKeys, systemPrompt } = config;
  
  return {
    'src/index.ts': generateAgentCode({
      agentName: `${agentName}Agent`,
      tools,
      apiKeys,
      systemPrompt,
    }),
    'wrangler.jsonc': generateWranglerConfig(`${agentName}Agent`),
    'package.json': generatePackageJson(agentName),
  };
}

