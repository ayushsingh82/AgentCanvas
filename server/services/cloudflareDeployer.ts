/**
 * Cloudflare Workers Deployment Service
 * Handles deployment of NullShot agents to Cloudflare Workers
 */

import { generateAgentCode, generateWranglerConfig, generatePackageJson } from './codeGenerator';
import { logger } from './logger';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';
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
  cdpApiKeyName?: string;
  cdpApiKeyPrivateKey?: string;
  cdpAgentKitNetwork?: string;
  apiBaseUrl?: string;
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
  const { agentName, agentId, tools, systemPrompt, anthropicApiKey, cloudflareAccountId, cloudflareApiToken, cdpApiKeyName, cdpApiKeyPrivateKey, cdpAgentKitNetwork, apiBaseUrl } = config;
  
  // Generate unique worker name (max 54 chars for Cloudflare)
  // Format: ag-{short-timestamp}-{random}
  const timestamp = Date.now().toString(36); // Base36 for shorter representation
  const randomSuffix = Math.random().toString(36).substring(2, 6); // 4 chars
  const workerName = `ag-${timestamp}-${randomSuffix}`.substring(0, 54); // Ensure max 54 chars
  const tempDir = path.join(os.tmpdir(), `agent-deploy-${agentId}-${Date.now()}`);
  
  try {
    logger.info(`Creating temporary deployment directory: ${tempDir}`);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    
    // Generate agent code
    logger.debug('Generating agent code...');
    // Use a simple name for the agent class (not the worker name)
    const agentClassName = `Agent${Date.now().toString(36)}`;
    const agentCode = generateAgentCode({
      agentName: agentClassName,
      tools,
      systemPrompt,
    });
    
    const wranglerConfig = generateWranglerConfig(agentClassName, cloudflareAccountId, workerName);
    const packageJson = generatePackageJson(workerName);
    
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
    
    // Deploy using Wrangler first (secrets must be set after deployment)
    logger.info(`Deploying to Cloudflare Workers as: ${workerName}`);
    const deployCmd = `npx wrangler deploy --name ${workerName}`;
    
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
    
    // Extract deployment URL from wrangler output
    // Workers are deployed to: https://{worker-name}.{subdomain}.workers.dev
    // First, try to get the subdomain from API
    let subdomain = 'workers.dev'; // Default fallback
    let agentChatURL = `https://${workerName}.workers.dev/agent/chat`;
    
    try {
      // Try to get subdomain from Cloudflare API
      if (cloudflareAccountId && cloudflareApiToken) {
        const subdomainResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/workers/subdomain`,
          {
            headers: {
              'Authorization': `Bearer ${cloudflareApiToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (subdomainResponse.ok) {
          const subdomainData = await subdomainResponse.json() as { success?: boolean; result?: { subdomain?: string } };
          if (subdomainData.success && subdomainData.result?.subdomain) {
            subdomain = subdomainData.result.subdomain;
            agentChatURL = `https://${workerName}.${subdomain}.workers.dev/agent/chat`;
            logger.info(`Using subdomain: ${subdomain}`);
          }
        }
      }
    } catch (error) {
      logger.warn('Could not fetch subdomain, using default format');
    }
    
    // Try to extract URL from stdout as fallback
    const urlMatch = stdout.match(/https?:\/\/[^\s]+\.workers\.dev/i);
    if (urlMatch) {
      const baseUrl = urlMatch[0];
      agentChatURL = `${baseUrl}/agent/chat`;
      logger.info(`Extracted deployment URL from output: ${baseUrl}`);
    }
    
    logger.info(`Final agent URL: ${agentChatURL}`);
    
    // Set ANTHROPIC_API_KEY secret AFTER deployment (required for worker to work)
    if (anthropicApiKey) {
      logger.info('🔐 Setting ANTHROPIC_API_KEY secret...');
      logger.info(`🔑 API Key to set: ${anthropicApiKey.substring(0, 10)}...${anthropicApiKey.substring(anthropicApiKey.length - 4)} (length: ${anthropicApiKey.length})`);
      logger.info(`🔑 API Key full value (for debugging): ${anthropicApiKey}`);
      
      try {
        // Write API key to a temporary file to avoid shell escaping issues
        const secretFile = path.join(tempDir, '.secret_key');
        logger.info(`📝 Writing API key to temp file: ${secretFile}`);
        await fs.writeFile(secretFile, anthropicApiKey, { encoding: 'utf8', mode: 0o600 });
        
        // Verify what we wrote
        const writtenKey = await fs.readFile(secretFile, 'utf8');
        logger.info(`✅ Written key matches: ${writtenKey === anthropicApiKey}`);
        logger.info(`📝 Written key: ${writtenKey.substring(0, 10)}...${writtenKey.substring(writtenKey.length - 4)} (length: ${writtenKey.length})`);
        
        // Use the file to pipe the secret value (more reliable than echo)
        const secretCmd = `cat "${secretFile}" | npx wrangler secret put ANTHROPIC_API_KEY --name ${workerName}`;
        logger.info(`🚀 Executing: cat "${secretFile}" | npx wrangler secret put ANTHROPIC_API_KEY --name ${workerName}`);
        
        const secretResult = await execAsync(secretCmd, { 
          cwd: tempDir, 
          timeout: 30000,
          env: {
            ...process.env,
            CLOUDFLARE_API_TOKEN: cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN,
            CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID,
          }
        });
        
        // Clean up secret file immediately
        await fs.unlink(secretFile).catch(() => {});
        
        logger.info('✅ ANTHROPIC_API_KEY secret set successfully via cat method');
        logger.info('📋 Secret command stdout:', secretResult.stdout);
        if (secretResult.stderr) {
          logger.info('📋 Secret command stderr:', secretResult.stderr);
        }
      } catch (error) {
        logger.error('❌ Failed to set ANTHROPIC_API_KEY secret via cat method:', error);
        if (error instanceof Error) {
          logger.error('❌ Error message:', error.message);
          logger.error('❌ Error stack:', error.stack);
        }
        if ((error as any).stdout) {
          logger.error('❌ Command stdout:', (error as any).stdout);
        }
        if ((error as any).stderr) {
          logger.error('❌ Command stderr:', (error as any).stderr);
        }
        logger.error(`❌ API Key that failed: ${anthropicApiKey.substring(0, 10)}...${anthropicApiKey.substring(anthropicApiKey.length - 4)} (length: ${anthropicApiKey.length})`);
        
        // Try alternative method: Use wrangler with explicit stdin via spawn
        logger.info('🔄 Trying alternative method: Wrangler with explicit stdin (spawn)...');
        logger.info(`🔑 API Key for spawn: ${anthropicApiKey.substring(0, 10)}...${anthropicApiKey.substring(anthropicApiKey.length - 4)} (length: ${anthropicApiKey.length})`);
        try {
          // Use spawn instead of exec for better control
          const secretFile = path.join(tempDir, '.secret_key_spawn');
          await fs.writeFile(secretFile, anthropicApiKey, { encoding: 'utf8', mode: 0o600 });
          logger.info(`📝 Written API key to spawn temp file: ${secretFile}`);
          
          // Verify what we wrote
          const writtenKey = await fs.readFile(secretFile, 'utf8');
          logger.info(`✅ Written key matches for spawn: ${writtenKey === anthropicApiKey}`);
          
          await new Promise<void>((resolve, reject) => {
            logger.info(`🚀 Spawning: npx wrangler secret put ANTHROPIC_API_KEY --name ${workerName}`);
            const wrangler = spawn('npx', ['wrangler', 'secret', 'put', 'ANTHROPIC_API_KEY', '--name', workerName], {
              cwd: tempDir,
              stdio: ['pipe', 'pipe', 'pipe'],
              env: {
                ...process.env,
                CLOUDFLARE_API_TOKEN: cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN,
                CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID,
              }
            });
            
            // Read file synchronously for spawn
            const keyData = readFileSync(secretFile);
            logger.info(`📤 Sending key data to wrangler stdin (length: ${keyData.length})`);
            wrangler.stdin.write(keyData);
            wrangler.stdin.end();
            
            let stdout = '';
            let stderr = '';
            
            wrangler.stdout.on('data', (data: Buffer) => {
              const output = data.toString();
              stdout += output;
              logger.info('📥 Wrangler stdout:', output);
            });
            
            wrangler.stderr.on('data', (data: Buffer) => {
              const output = data.toString();
              stderr += output;
              logger.warn('⚠️ Wrangler stderr:', output);
            });
            
            wrangler.on('close', (code: number) => {
              fs.unlink(secretFile).catch(() => {});
              logger.info(`🔚 Wrangler process closed with code: ${code}`);
              if (code === 0) {
                logger.info('✅ ANTHROPIC_API_KEY secret set via spawn method');
                logger.info('📋 Spawn stdout:', stdout);
                resolve();
              } else {
                logger.error(`❌ Wrangler spawn failed with code ${code}`);
                logger.error('❌ Spawn stderr:', stderr);
                reject(new Error(`Wrangler spawn failed with code ${code}: ${stderr}`));
              }
            });
            
            wrangler.on('error', (err: Error) => {
              logger.error('❌ Wrangler spawn error:', err);
              reject(err);
            });
          });
        } catch (spawnError) {
          logger.error('❌ Spawn method also failed:', spawnError);
          if (spawnError instanceof Error) {
            logger.error('❌ Spawn error message:', spawnError.message);
            logger.error('❌ Spawn error stack:', spawnError.stack);
          }
          logger.warn('⚠️ You must set ANTHROPIC_API_KEY manually in Cloudflare dashboard');
          logger.warn(`   Worker name: ${workerName}`);
          logger.warn(`   Secret name: ANTHROPIC_API_KEY`);
          logger.warn(`   API Key to set: ${anthropicApiKey.substring(0, 10)}...${anthropicApiKey.substring(anthropicApiKey.length - 4)}`);
          logger.warn(`   Dashboard: https://dash.cloudflare.com -> Workers & Pages -> ${workerName} -> Settings -> Variables`);
          throw new Error('Failed to set ANTHROPIC_API_KEY secret. Please set it manually in Cloudflare dashboard.');
        }
      }
    } else {
      logger.warn('⚠️ No ANTHROPIC_API_KEY provided - agent will not work without it');
    }
    
    // Set CDP secrets if provided (for AgentKit modules)
    if (cdpApiKeyName && cdpApiKeyPrivateKey) {
      logger.info('🔐 Setting CDP secrets for AgentKit...');
      
      // Set CDP_API_KEY_NAME
      try {
        const cdpNameFile = path.join(tempDir, '.cdp_name');
        await fs.writeFile(cdpNameFile, cdpApiKeyName, { encoding: 'utf8', mode: 0o600 });
        const cdpNameCmd = `cat "${cdpNameFile}" | npx wrangler secret put CDP_API_KEY_NAME --name ${workerName}`;
        await execAsync(cdpNameCmd, { 
          cwd: tempDir, 
          timeout: 30000,
          env: {
            ...process.env,
            CLOUDFLARE_API_TOKEN: cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN,
            CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID,
          }
        });
        logger.info('✅ CDP_API_KEY_NAME secret set successfully');
      } catch (error) {
        logger.warn('⚠️ Failed to set CDP_API_KEY_NAME secret:', error);
      }
      
      // Set CDP_API_KEY_PRIVATE_KEY
      try {
        const cdpKeyFile = path.join(tempDir, '.cdp_key');
        await fs.writeFile(cdpKeyFile, cdpApiKeyPrivateKey, { encoding: 'utf8', mode: 0o600 });
        const cdpKeyCmd = `cat "${cdpKeyFile}" | npx wrangler secret put CDP_API_KEY_PRIVATE_KEY --name ${workerName}`;
        await execAsync(cdpKeyCmd, { 
          cwd: tempDir, 
          timeout: 30000,
          env: {
            ...process.env,
            CLOUDFLARE_API_TOKEN: cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN,
            CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID,
          }
        });
        logger.info('✅ CDP_API_KEY_PRIVATE_KEY secret set successfully');
      } catch (error) {
        logger.warn('⚠️ Failed to set CDP_API_KEY_PRIVATE_KEY secret:', error);
      }
      
      // Set CDP_AGENT_KIT_NETWORK if provided (optional)
      if (cdpAgentKitNetwork) {
        try {
          const cdpNetworkFile = path.join(tempDir, '.cdp_network');
          await fs.writeFile(cdpNetworkFile, cdpAgentKitNetwork, { encoding: 'utf8', mode: 0o600 });
          const cdpNetworkCmd = `cat "${cdpNetworkFile}" | npx wrangler secret put CDP_AGENT_KIT_NETWORK --name ${workerName}`;
          await execAsync(cdpNetworkCmd, { 
            cwd: tempDir, 
            timeout: 30000,
            env: {
              ...process.env,
              CLOUDFLARE_API_TOKEN: cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN,
              CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID,
            }
          });
          logger.info('✅ CDP_AGENT_KIT_NETWORK secret set successfully');
        } catch (error) {
          logger.warn('⚠️ Failed to set CDP_AGENT_KIT_NETWORK secret:', error);
        }
      }
    } else {
      logger.warn('⚠️ No CDP credentials provided - AgentKit modules will not work without CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY');
    }
    
    // Set API_BASE_URL secret if provided (for backend API calls)
    if (apiBaseUrl) {
      logger.info('🔗 Setting API_BASE_URL secret...');
      try {
        const apiBaseUrlFile = path.join(tempDir, '.api_base_url');
        await fs.writeFile(apiBaseUrlFile, apiBaseUrl, { encoding: 'utf8', mode: 0o600 });
        const apiBaseUrlCmd = `cat "${apiBaseUrlFile}" | npx wrangler secret put API_BASE_URL --name ${workerName}`;
        await execAsync(apiBaseUrlCmd, { 
          cwd: tempDir, 
          timeout: 30000,
          env: {
            ...process.env,
            CLOUDFLARE_API_TOKEN: cloudflareApiToken || process.env.CLOUDFLARE_API_TOKEN,
            CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID,
          }
        });
        logger.info(`✅ API_BASE_URL secret set successfully: ${apiBaseUrl}`);
        await fs.unlink(apiBaseUrlFile).catch(() => {});
      } catch (error) {
        logger.warn('⚠️ Failed to set API_BASE_URL secret:', error);
        logger.warn('⚠️ Agent will fallback to localhost:3000 (may not work from Cloudflare Workers)');
      }
    } else {
      logger.warn('⚠️ No API_BASE_URL provided - agent will use localhost:3000 (may not work from Cloudflare Workers)');
      logger.warn('⚠️ Set API_BASE_URL environment variable or pass it in job.apiKeys to point to your deployed backend');
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

