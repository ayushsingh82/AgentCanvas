/**
 * Cloudflare Workers Deployment Service
 * Handles deployment of NullShot agents to Cloudflare Workers
 */

import { generateAgentCode, generateWranglerConfig, generatePackageJson } from './codeGenerator';
import { logger } from './logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface DeploymentConfig {
  agentName: string;
  agentId: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: any;
    toolFunction: string;
  }>;
  systemPrompt?: string;
  anthropicApiKey: string;
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
 * Deploy agent to Cloudflare Workers using Wrangler CLI
 * This creates a temporary directory, generates code, and deploys
 */
export async function deployToCloudflare(config: DeploymentConfig): Promise<DeploymentResult> {
  const { agentName, agentId, tools, systemPrompt, anthropicApiKey, cloudflareAccountId, cloudflareApiToken } = config;
  
  const workerName = `${agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${agentId.substring(0, 8)}`;
  const tempDir = path.join(os.tmpdir(), `agent-deploy-${agentId}-${Date.now()}`);
  
  try {
    logger.info(`Creating temporary deployment directory: ${tempDir}`);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    
    // Generate agent code
    logger.debug('Generating agent code...');
    const agentCode = generateAgentCode({
      agentName: `${agentName}Agent`,
      tools,
      systemPrompt,
    });
    
    const wranglerConfig = generateWranglerConfig(`${agentName}Agent`, cloudflareAccountId);
    const packageJson = generatePackageJson(agentName);
    
    // Write files
    await fs.writeFile(path.join(tempDir, 'src/index.ts'), agentCode);
    await fs.writeFile(path.join(tempDir, 'wrangler.jsonc'), wranglerConfig);
    await fs.writeFile(path.join(tempDir, 'package.json'), packageJson);
    
    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "esnext",
        lib: ["ES2022"],
        jsx: "react",
        moduleResolution: "bundler",
        types: ["@cloudflare/workers-types"],
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
      },
      include: ["src/**/*"],
    };
    await fs.writeFile(path.join(tempDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
    
    logger.info('Installing dependencies...');
    // Install dependencies
    try {
      await execAsync('npm install', { cwd: tempDir, timeout: 120000 });
    } catch (error) {
      logger.warn('npm install failed, trying with pnpm...');
      try {
        await execAsync('pnpm install', { cwd: tempDir, timeout: 120000 });
      } catch (pnpmError) {
        throw new Error('Failed to install dependencies. Make sure npm or pnpm is installed.');
      }
    }
    
    // Set Cloudflare credentials if provided
    if (cloudflareApiToken) {
      process.env.CLOUDFLARE_API_TOKEN = cloudflareApiToken;
    }
    if (cloudflareAccountId) {
      process.env.CLOUDFLARE_ACCOUNT_ID = cloudflareAccountId;
    }
    
    // Set Anthropic API key as secret
    logger.info('Setting Cloudflare secrets...');
    try {
      const setSecretCmd = `echo "${anthropicApiKey}" | npx wrangler secret put ANTHROPIC_API_KEY --name ${workerName}${cloudflareAccountId ? ` --account-id ${cloudflareAccountId}` : ''}`;
      await execAsync(setSecretCmd, { cwd: tempDir, timeout: 30000 });
    } catch (error) {
      logger.warn('Failed to set secret via CLI, will try during deployment');
    }
    
    // Deploy using Wrangler
    logger.info(`Deploying to Cloudflare Workers as: ${workerName}`);
    const deployCmd = `npx wrangler deploy --name ${workerName}${cloudflareAccountId ? ` --account-id ${cloudflareAccountId}` : ''}`;
    
    const { stdout, stderr } = await execAsync(deployCmd, { 
      cwd: tempDir, 
      timeout: 180000,
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID,
      }
    });
    
    logger.debug('Deployment output:', stdout);
    if (stderr) {
      logger.warn('Deployment warnings:', stderr);
    }
    
    // Extract deployment URL from output or construct it
    const agentChatURL = `https://${workerName}.${cloudflareAccountId ? `${cloudflareAccountId}.` : ''}workers.dev/agent/chat`;
    
    // Set secret after deployment if not set before
    if (anthropicApiKey) {
      try {
        const secretCmd = `echo "${anthropicApiKey}" | npx wrangler secret put ANTHROPIC_API_KEY --name ${workerName}${cloudflareAccountId ? ` --account-id ${cloudflareAccountId}` : ''}`;
        await execAsync(secretCmd, { timeout: 30000 });
      } catch (error) {
        logger.warn('Failed to set ANTHROPIC_API_KEY secret. You may need to set it manually in Cloudflare dashboard.');
      }
    }
    
    logger.info(`Deployment successful! Agent URL: ${agentChatURL}`);
    
    return {
      success: true,
      agentChatURL,
      workerName,
      deploymentId: `deploy-${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown deployment error';
    logger.error('Deployment failed:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      logger.debug('Cleaned up temporary directory');
    } catch (cleanupError) {
      logger.warn('Failed to cleanup temporary directory:', cleanupError);
    }
  }
}

