/**
 * NullShot Agent Code Generator
 * Generates NullShot agent code for Cloudflare Workers deployment
 */

import { DeploymentJob } from '../types/deploymentJob';

export interface AgentCodeConfig {
  agentName: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: any;
    toolFunction: string;
  }>;
  systemPrompt?: string;
}

/**
 * Generate NullShot agent code for Cloudflare Workers
 * Based on NullShot framework documentation
 */
export function generateAgentCode(config: AgentCodeConfig): string {
  const { agentName, tools, systemPrompt } = config;
  
  // Generate tool handlers
  const toolHandlers = tools.map((tool) => {
    // Convert hello_greet to handleHelloGreet (PascalCase)
    const handlerName = `handle${tool.name.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`;
    const moduleName = tool.name.split('_')[0];
    
    // Special handling for hello module (test module)
    if (moduleName === 'hello' && tool.name === 'hello_greet') {
      return `async function ${handlerName}(params: any): Promise<any> {
  // Simple test tool - replies hello to each message
  const name = params.name || 'User';
  const message = params.message || '';
  const greeting = \`Hello, \${name}!\${message ? ' ' + message : ''}\`.trim();
  
  return {
    success: true,
    result: greeting,
    timestamp: new Date().toISOString(),
  };
}`;
    }
    
    // Special handling for tokenFactory module
    if (moduleName === 'tokenFactory' && tool.name === 'tokenFactory_createToken') {
      return `async function ${handlerName}(params: any): Promise<any> {
  // Token Factory - Create ERC20 token directly using ethers.js
  try {
    // Validate required parameters
    if (!params.privateKey || !params.rpcUrl || !params.tokenName || !params.tokenSymbol || !params.volume || !params.network) {
      return {
        success: false,
        error: 'Missing required parameters: privateKey, rpcUrl, tokenName, tokenSymbol, volume, and network are required',
      };
    }
    
    // Import ethers.js dynamically
    const { ethers } = await import('https://cdn.jsdelivr.net/npm/ethers@6.13.0/+esm');
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(params.rpcUrl);
    const wallet = new ethers.Wallet(params.privateKey, provider);
    
    // ERC20 Token Contract ABI (minimal - just constructor and standard functions)
    const tokenABI = [
      'constructor(string name, string symbol, uint256 totalSupply, uint8 decimals)',
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
    ];
    
    // ERC20 Token Contract Bytecode (simplified version)
    const tokenBytecode = '0x608060405234801561001057600080fd5b50604051610e8f380380610e8f833981810160405281019061003291906101a2565b81600090805190602001906100489291906100e9565b50806001908051906020019061005f9291906100e9565b5050506102b1565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106100ca57805160ff19168380011785556100f8565b828001600101855582156100f8579182015b828111156100f75782518255916020019190600101906100dc565b5b5090506101059190610109565b5090565b5b8082111561012257600081600090555060010161010a565b5090565b600080fd5b6000819050919050565b61013e8161012b565b811461014957600080fd5b50565b60008151905061015b81610135565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f84011261018657610185610161565b5b8235905067ffffffffffffffff8111156101a3576101a261015c565b5b6020830191508360208202830111156101bf576101be610157565b5b9250929050565b6000806000604084860312156101df576101de610136565b5b60006101ed8682870161014c565b935050602084013567ffffffffffffffff81111561020e5761020d610152565b5b61021a8682870161016b565b925092509250925092565b610eef806102296000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806306fdde03146037578063095ea7b314605257806318160ddd14606d575b600080fd5b603d6084565b6040516048919060a2565b60405180910390f35b606b60048036038101906067919060c8565b609a565b005b6073608e565b6040516078919060e4565b60405180910390f35b60005481565b6001816000016000828254019250508190555050565b6000819050919050565b609c816089565b82525050565b600060208201905060b560008301846095565b92915050565b600080fd5b600080fd5b600080fd5b60008083601f84011260d95760d860b9565b5b8235905067ffffffffffffffff81111560f65760f560b4565b5b6020830191508360208202830111156101145761011360af565b5b9250929050565b6000806000604084860312156101345761013360a6565b5b60006101428682870160a1565b935050602084013567ffffffffffffffff8111156101635761016260aa565b5b61016f8682870160be565b925092509250925092565b600081905092915050565b60006101908261017a565b61019a8185610185565b93506101aa8185602086016101b5565b80840191505092915050565b60006101c18284610185565b91508190509291505056fea2646970667358221220';
    
    // Deploy token contract
    const decimals = params.decimals || 18;
    const totalSupply = ethers.parseUnits(params.volume, decimals);
    
    const factory = new ethers.ContractFactory(tokenABI, tokenBytecode, wallet);
    const contract = await factory.deploy(
      params.tokenName,
      params.tokenSymbol,
      totalSupply,
      decimals
    );
    
    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    // Get deployment transaction
    const deployTx = contract.deploymentTransaction();
    const txHash = deployTx ? deployTx.hash : null;
    
    // Optional: Send initial tokens to firstSendAddress
    if (params.firstSendAddress && params.firstSendAmount) {
      const amount = ethers.parseUnits(params.firstSendAmount, decimals);
      const transferTx = await contract.transfer(params.firstSendAddress, amount);
      await transferTx.wait();
    }
    
    return {
      success: true,
      contractAddress: contractAddress,
      transactionHash: txHash,
      tokenName: params.tokenName,
      tokenSymbol: params.tokenSymbol,
      totalSupply: params.volume,
      decimals: decimals,
      network: params.network,
      message: \`Token \${params.tokenSymbol} (\${params.tokenName}) successfully deployed to \${params.network}\`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating token',
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}`;
    }
    
    // For other modules, call the module service API
    return `async function ${handlerName}(params: any): Promise<any> {
  // Call the ${moduleName} module implementation
  try {
    const apiBaseUrl = c.env.API_BASE_URL || 'https://api.yourdomain.com';
    const response = await fetch(\`\${apiBaseUrl}/modules/${moduleName}/execute\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: '${tool.name}',
        parameters: params,
      }),
    });
    
    if (!response.ok) {
      throw new Error(\`Failed to execute ${tool.name}: \${response.statusText}\`);
    }
    
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}`;
  }).join('\n\n');
  
  // Generate tool registrations
  // Note: NullShot framework handles tool registration via MCP or direct registration
  // For now, we'll store tools and use them in processMessage
  const toolRegistrations = tools.map((tool) => {
    // Convert hello_greet to handleHelloGreet (PascalCase)
    const handlerName = `handle${tool.name.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`;
    return `tools.set('${tool.name}', {
      name: '${tool.name}',
      description: '${tool.description}',
      inputSchema: ${JSON.stringify(tool.inputSchema, null, 6)},
      handler: async (params: any) => await ${handlerName}(params)
    });`;
  }).join('\n');
  
  // Generate system prompt based on available tools
  const hasHelloModule = tools.some(t => t.name === 'hello_greet');
  const hasTokenFactory = tools.some(t => t.name === 'tokenFactory_createToken');
  
  const defaultSystemPrompt = systemPrompt || (hasHelloModule 
    ? `You are a friendly AI assistant. You have access to a greeting tool that can say hello to users.
When users send messages, you can use the hello_greet tool to greet them warmly.
Be conversational and helpful.`
    : hasTokenFactory
    ? `You are a helpful AI assistant specialized in blockchain token creation. You have access to a token creation tool.
When users want to create a token, collect these required details:
- Private key (wallet that will deploy the token - keep secure)
- RPC URL (blockchain network endpoint)
- Token name (e.g., "My Awesome Token")
- Token symbol (e.g., "MAT")
- Volume (total supply as string, e.g., "1000000")
- Network (e.g., "ethereum", "polygon", "bsc", "arbitrum")

Optional details:
- Decimals (default: 18)
- First send address (address to receive initial tokens)
- First send amount (amount to send to first address)

Always confirm all token details before creating. Remind users to keep their private key secure.`
    : `You are a helpful AI assistant with access to ${tools.length} specialized tools:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Use these tools when users ask you to perform actions. Always confirm what you're doing before executing blockchain operations.`);

  return `import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { ExportedHandler } from "@cloudflare/workers-types";

interface Env {
  ANTHROPIC_API_KEY: string;
  API_BASE_URL?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for web applications
app.use("/agent/*", cors());

// Health check endpoint
app.get("/", (c) => c.text("${agentName} Agent is running!"));

// Tool registry
const tools = new Map<string, any>();

// Register tools
${toolRegistrations}

// Tool handlers
${toolHandlers}

// Chat endpoint handler
app.post("/agent/chat/:sessionId?", async (c) => {
  try {
    const sessionId = c.req.param("sessionId") || \`session-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`;
    const body = await c.req.json();
    
    // Handle different message formats
    let messages: Array<{role: string, content: string}> = [];
    if (Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (body.message) {
      messages = [{ role: 'user', content: body.message }];
    } else if (body.content) {
      messages = [{ role: 'user', content: body.content }];
    } else {
      return c.json({ error: 'Invalid message format. Expected {messages: [...]} or {message: "..."}' }, 400);
    }
    
    // Check if ANTHROPIC_API_KEY is set
    if (!c.env.ANTHROPIC_API_KEY) {
      return c.json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }
    
    // Initialize model with API key
    // In Cloudflare Workers, env vars are accessed via c.env
    const apiKey = c.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'ANTHROPIC_API_KEY not configured in worker secrets' }, 500);
    }
    // Create Anthropic provider with API key
    const anthropic = createAnthropic({ apiKey });
    // Use model - try claude-3-5-sonnet-20241022 (latest) or fallback to claude-3-opus-20240229
    const model = anthropic('claude-3-opus-20240229');
    
    // Convert tools map to AI SDK format
    // AI SDK expects tools as an object with function definitions
    const aiTools: Record<string, any> = {};
    for (const [name, tool] of tools.entries()) {
      const schema = tool.inputSchema || { type: 'object', properties: {} };
      if (!schema.type) {
        schema.type = 'object';
      }
      
      aiTools[name] = {
        description: tool.description || \`Tool: \${name}\`,
        parameters: schema,
        execute: tool.handler,
      };
    }
    
    // Process message
    // Note: Tools will be added once we fix the schema format
    // For now, agent responds to hello without tools
    const result = await generateText({
      model,
      system: 'You are a friendly AI assistant. When users greet you, respond warmly with hello.',
      messages,
    });
    
    // Return JSON response
    return c.json({
      success: true,
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    });
    
    // Return JSON response with the generated text
    return c.json({
      success: true,
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});
export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
`;
}

/**
 * Generate wrangler.jsonc configuration
 */
export function generateWranglerConfig(agentName: string, accountId?: string, workerName?: string): string {
  // Use provided workerName or generate from agentName
  const finalWorkerName = workerName || agentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  return `{
  "name": "${finalWorkerName}",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-19",
  "vars": {
    "AI_PROVIDER": "anthropic"
  },
${accountId ? `  "account_id": "${accountId}",\n` : ''}
}
`;
}

/**
 * Generate package.json for agent
 */
export function generatePackageJson(agentName: string): string {
  return `{
  "name": "${agentName.toLowerCase()}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "@ai-sdk/anthropic": "latest",
    "ai": "latest",
    "hono": "latest"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "latest",
    "wrangler": "latest",
    "typescript": "latest"
  }
}
`;
}

