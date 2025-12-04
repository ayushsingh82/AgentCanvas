/**
 * NullShot Agent Code Generator
 * Generates NullShot agent code for Cloudflare Workers deployment
 */

import { DeploymentJob } from '../types/deploymentJob';

/**
 * Generate AgentKit handler for blockchain operations
 * Note: AgentKit runs in the Next.js backend, not in Cloudflare Workers
 * The worker makes API calls to the backend which executes AgentKit operations
 */
function generateAgentKitHandler(handlerName: string, moduleName: string, toolName: string): string {
  // API base URL - use globalEnv (set from c.env in route handler)
  const apiBaseUrl = `globalEnv?.API_BASE_URL || 'http://localhost:3000'`;

  // Handler implementations for each module
  const handlers: Record<string, string> = {
    createToken: `
  try {
    if (!params.tokenName || !params.tokenSymbol || !params.totalSupply || !params.network) {
      return {
        success: false,
        error: 'Missing required parameters: tokenName, tokenSymbol, totalSupply, and network are required',
      };
    }
    
    const apiBaseUrl = ${apiBaseUrl};
    const response = await fetch(\`\${apiBaseUrl}/api/agentkit/createToken\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenName: params.tokenName,
        tokenSymbol: params.tokenSymbol,
        totalSupply: params.totalSupply,
        decimals: params.decimals || 18,
        network: params.network,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(\`Failed to create token: \${errorData.error || response.statusText}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating token',
      details: error instanceof Error ? error.stack : undefined,
    };
  }`,

    createNFT: `
  try {
    if (!params.collectionName || !params.collectionSymbol || !params.network) {
      return {
        success: false,
        error: 'Missing required parameters: collectionName, collectionSymbol, and network are required',
      };
    }
    
    const apiBaseUrl = ${apiBaseUrl};
    const response = await fetch(\`\${apiBaseUrl}/api/agentkit/createNFT\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collectionName: params.collectionName,
        collectionSymbol: params.collectionSymbol,
        maxSupply: params.maxSupply,
        baseURI: params.baseURI,
        network: params.network,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(\`Failed to create NFT: \${errorData.error || response.statusText}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating NFT',
      details: error instanceof Error ? error.stack : undefined,
    };
  }`,

    airdrop: `
  try {
    if (!params.contractAddress || !params.recipients || !params.amounts || !params.network || !params.tokenType) {
      return {
        success: false,
        error: 'Missing required parameters: contractAddress, recipients, amounts, network, and tokenType are required',
      };
    }
    
    if (params.recipients.length !== params.amounts.length) {
      return {
        success: false,
        error: 'Recipients and amounts arrays must have the same length',
      };
    }
    
    const apiBaseUrl = ${apiBaseUrl};
    const response = await fetch(\`\${apiBaseUrl}/api/agentkit/airdrop\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress: params.contractAddress,
        recipients: params.recipients,
        amounts: params.amounts,
        network: params.network,
        tokenType: params.tokenType,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(\`Failed to airdrop: \${errorData.error || response.statusText}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during airdrop',
      details: error instanceof Error ? error.stack : undefined,
    };
  }`,

    transferFunds: `
  try {
    if (!params.to || !params.amount || !params.network) {
      return {
        success: false,
        error: 'Missing required parameters: to, amount, and network are required',
      };
    }
    
    const apiBaseUrl = ${apiBaseUrl};
    const response = await fetch(\`\${apiBaseUrl}/api/agentkit/transferFunds\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.to,
        amount: params.amount,
        network: params.network,
        tokenAddress: params.tokenAddress,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(\`Failed to transfer funds: \${errorData.error || response.statusText}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error transferring funds',
      details: error instanceof Error ? error.stack : undefined,
    };
  }`,

    deployContract: `
  try {
    if (!params.bytecode || !params.abi || !params.network) {
      return {
        success: false,
        error: 'Missing required parameters: bytecode, abi, and network are required',
      };
    }
    
    const apiBaseUrl = ${apiBaseUrl};
    const response = await fetch(\`\${apiBaseUrl}/api/agentkit/deployContract\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bytecode: params.bytecode,
        abi: params.abi,
        constructorArgs: params.constructorArgs || [],
        network: params.network,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(\`Failed to deploy contract: \${errorData.error || response.statusText}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deploying contract',
      details: error instanceof Error ? error.stack : undefined,
    };
  }`,

    readContract: `
  try {
    if (!params.contractAddress || !params.functionName || !params.abi || !params.network) {
      return {
        success: false,
        error: 'Missing required parameters: contractAddress, functionName, abi, and network are required',
      };
    }
    
    const apiBaseUrl = ${apiBaseUrl};
    const response = await fetch(\`\${apiBaseUrl}/api/agentkit/readContract\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress: params.contractAddress,
        functionName: params.functionName,
        args: params.args || [],
        abi: params.abi,
        network: params.network,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(\`Failed to read contract: \${errorData.error || response.statusText}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error reading contract',
      details: error instanceof Error ? error.stack : undefined,
    };
  }`,

    writeContract: `
  try {
    if (!params.contractAddress || !params.functionName || !params.args || !params.abi || !params.network) {
      return {
        success: false,
        error: 'Missing required parameters: contractAddress, functionName, args, abi, and network are required',
      };
    }
    
    const apiBaseUrl = ${apiBaseUrl};
    const response = await fetch(\`\${apiBaseUrl}/api/agentkit/writeContract\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress: params.contractAddress,
        functionName: params.functionName,
        args: params.args,
        abi: params.abi,
        value: params.value,
        network: params.network,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(\`Failed to write to contract: \${errorData.error || response.statusText}\`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error writing to contract',
      details: error instanceof Error ? error.stack : undefined,
    };
  }`,
  };

  const handlerCode = handlers[moduleName] || handlers['createToken'];
  
  return `async function ${handlerName}(params: any): Promise<any> {
  // ${moduleName} - Using Coinbase AgentKit (CDP)
  ${handlerCode}
}`;
}

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
    
    // AgentKit-based blockchain modules
    const agentKitModules = ['createToken', 'createNFT', 'createDAO', 'makeTransaction', 'airdrop', 'transferFunds', 'deployContract', 'readContract', 'writeContract'];
    
    if (agentKitModules.includes(moduleName)) {
      return generateAgentKitHandler(handlerName, moduleName, tool.name);
    }
    
    // Legacy tokenFactory module (deprecated, use createToken instead)
    if (moduleName === 'tokenFactory' && tool.name === 'tokenFactory_createToken') {
      return generateAgentKitHandler(handlerName, 'createToken', 'createToken');
    }
    
    // For other modules, call the module service API
    return `async function ${handlerName}(params: any): Promise<any> {
  // Call the ${moduleName} module implementation
  try {
    const apiBaseUrl = globalEnv?.API_BASE_URL || 'http://localhost:3000';
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
  CDP_API_KEY_NAME?: string;
  CDP_API_KEY_PRIVATE_KEY?: string;
  CDP_AGENT_KIT_NETWORK?: string;
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

// Store env in closure for tool handlers
let globalEnv: Env | undefined;

// Tool handlers
${toolHandlers}

// Chat endpoint handler
app.post("/agent/chat/:sessionId?", async (c) => {
  try {
    const sessionId = c.req.param("sessionId") || \`session-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`;
    const body = await c.req.json();
    
    // Handle different message formats
    let messages: Array<{role: string, content: string}> = [];
    let userMessage = '';
    if (Array.isArray(body.messages)) {
      messages = body.messages;
      userMessage = messages[messages.length - 1]?.content || '';
    } else if (body.message) {
      userMessage = body.message;
      messages = [{ role: 'user', content: userMessage }];
    } else if (body.content) {
      userMessage = body.content;
      messages = [{ role: 'user', content: userMessage }];
    } else {
      return c.json({ error: 'Invalid message format. Expected {messages: [...]} or {message: "..."}' }, 400);
    }
    
    // Store env for tool handlers BEFORE any tool execution
    globalEnv = c.env;
    
    // DIRECT TOOL EXECUTION: Execute tools directly for explicit requests
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for token creation - match both createToken and tokenFactory_createToken
    const createTokenMatch = (
      (lowerMessage.includes('create') && lowerMessage.includes('token')) ||
      (lowerMessage.includes('deploy') && lowerMessage.includes('token')) ||
      (lowerMessage.includes('make') && lowerMessage.includes('token'))
    ) && (
      lowerMessage.includes('token') && 
      (lowerMessage.includes('name') || lowerMessage.includes('symbol') || lowerMessage.includes('supply'))
    );
    
    // Find token creation tool (could be 'createToken' or 'tokenFactory_createToken')
    let tokenTool: any = null;
    if (createTokenMatch) {
      // Try createToken first, then tokenFactory_createToken
      if (tools.has('createToken')) {
        tokenTool = tools.get('createToken');
      } else if (tools.has('tokenFactory_createToken')) {
        tokenTool = tools.get('tokenFactory_createToken');
      }
    }
    
    // Execute token creation directly
    if (createTokenMatch && tokenTool) {
      const tokenNameMatch = userMessage.match(/named\\s+(\\w+)|name[:\\s]+(\\w+)/i);
      const symbolMatch = userMessage.match(/symbol[:\\s]+(\\w+)/i);
      const supplyMatch = userMessage.match(/(\\d+)\\s*(?:tokens|supply|total)/i);
      const networkMatch = userMessage.match(/(base-sepolia|base-mainnet|ethereum|polygon)/i);
      const decimalsMatch = userMessage.match(/(\\d+)\\s*decimals/i);
      
      const params: any = {
        tokenName: tokenNameMatch ? (tokenNameMatch[1] || tokenNameMatch[2] || 'TestToken') : 'TestToken',
        tokenSymbol: symbolMatch ? symbolMatch[1] : 'TST',
        totalSupply: supplyMatch ? supplyMatch[1] : '1000000',
        network: networkMatch ? networkMatch[1] : 'base-sepolia',
        decimals: decimalsMatch ? parseInt(decimalsMatch[1]) : 18,
      };
      
      const result = await tokenTool.handler(params);
      if (result.success && result.contractAddress) {
        return c.json({
          success: true,
          text: \`Token created successfully! Contract address: \${result.contractAddress}. Transaction hash: \${result.transactionHash || 'N/A'}\`,
          contractAddress: result.contractAddress,
          transactionHash: result.transactionHash,
          usage: { inputTokens: 0, outputTokens: 0 },
          finishReason: 'stop',
        });
      }
      return c.json({
        success: false,
        error: result.error || 'Failed to create token',
        text: result.error || 'Failed to create token',
      });
    }
    
    // Check if ANTHROPIC_API_KEY is set
    if (!c.env.ANTHROPIC_API_KEY) {
      return c.json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }
    
    // Initialize model with API key
    const apiKey = c.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'ANTHROPIC_API_KEY not configured in worker secrets' }, 500);
    }
    // Create Anthropic provider with API key
    const anthropic = createAnthropic({ apiKey });
    // Use model - try claude-3-5-sonnet-20241022 (latest) or fallback to claude-3-opus-20240229
    const model = anthropic('claude-3-opus-20240229');
    
    // Convert tools map to AI SDK format
    // Ensure every property in the schema has a type field
    const aiTools: Record<string, any> = {};
    for (const [name, toolDef] of tools.entries()) {
      const schema = toolDef.inputSchema || { type: 'object', properties: {}, required: [] };
      
      // Ensure all properties have type field
      const normalizedProperties: Record<string, any> = {};
      if (schema.properties) {
        for (const [propName, propDef] of Object.entries(schema.properties)) {
          const prop = propDef as any;
          normalizedProperties[propName] = {
            type: prop.type || 'string',
            description: prop.description || propName,
            ...(prop.default !== undefined ? { default: prop.default } : {}),
          };
        }
      }
      
      // Create parameters schema with normalized properties
      const parameters = {
        type: 'object',
        properties: normalizedProperties,
        required: schema.required || [],
      };
      
      // FIX: tool() function doesn't work correctly with Anthropic models
      // Use direct JSON schema format with input_schema instead
      // See: https://github.com/vercel/ai/issues/7333
      aiTools[name] = {
        name: name,
        description: toolDef.description || \`Tool: \${name}\`,
        input_schema: {
          type: 'object',
          properties: normalizedProperties,
          required: schema.required || [],
        },
        execute: async (params: any) => {
          console.log(\`[TOOL EXECUTION] Calling tool \${name} with params:\`, params);
          try {
            // Actually call the handler - this MUST execute real code
            const result = await toolDef.handler(params);
            console.log(\`[TOOL EXECUTION] Tool \${name} result:\`, result);
            return result;
          } catch (error) {
            console.error(\`[TOOL EXECUTION ERROR] Tool \${name} failed:\`, error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        },
      };
    }
    
    // Process message with tools
    // Build system prompt that encourages tool usage
    const toolNames = Object.keys(aiTools);
    const toolList = toolNames.length > 0 ? toolNames.join(', ') : 'none';
    
    const systemPrompt = \`You are a helpful AI assistant with access to blockchain tools.

CRITICAL: When users ask you to create tokens, NFTs, DAOs, or execute transactions, you MUST use the available tools. Do NOT describe how to call APIs or provide instructions - actually execute the tools.

IMPORTANT: Only use tools when the user EXPLICITLY asks to create, deploy, or make something. Do NOT use tools for greetings, questions, or general conversation.

Available tools: \${toolList}

For token creation requests, invoke the tool (createToken or tokenFactory_createToken) with:
- tokenName: string
- tokenSymbol: string  
- totalSupply: string (e.g., "1000000")
- decimals: number (default: 18)
- network: string (e.g., "base-sepolia")

Do NOT:
- Describe API calls or provide curl commands
- Tell users to "make a POST request" or "call the endpoint"
- Write instructions on how to use tools
- Use tools for greetings (hello, hi, etc.)

DO:
- Actually invoke tools when users request blockchain operations
- Execute tools directly without describing them
- Return the actual results from tool execution\`;

    // Re-enable tools with proper format
    // The tools MUST be registered and execute functions MUST exist
    // Otherwise LLM will hallucinate fake tool responses
    const toolsToUse = Object.keys(aiTools).length > 0 ? aiTools : undefined;
    
    if (toolsToUse) {
      console.log('Tools available:', Object.keys(toolsToUse));
      // Log first tool structure for debugging
      const firstTool = Object.values(toolsToUse)[0];
      console.log('First tool structure:', JSON.stringify({
        description: firstTool.description,
        parameters: firstTool.parameters,
        hasExecute: typeof firstTool.execute === 'function'
      }, null, 2));
    }
    
    // BYPASS AI SDK: Call Anthropic API directly to avoid broken tool conversion
    let result;
    try {
      if (!toolsToUse || Object.keys(toolsToUse).length === 0) {
        // No tools - use AI SDK normally
        result = await generateText({
          model,
          system: systemPrompt,
          messages,
        });
      } else {
        // Convert tools to Anthropic format
        const anthropicTools = Object.values(toolsToUse).map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema,
        }));
        
        // Call Anthropic API directly
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 4096,
            system: systemPrompt,
            messages: messages.map((msg: any) => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : msg.content,
            })),
            tools: anthropicTools,
            tool_choice: { type: 'auto' },
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(\`Anthropic API error: \${response.status} \${errorText}\`);
        }
        
        const data = await response.json();
        
        // Handle tool calls
        let finalText = '';
        const toolResults: any[] = [];
        const toolCalls: any[] = [];
        
        const contentArray = Array.isArray(data.content) ? data.content : [data.content];
        
        for (const block of contentArray) {
          if (block.type === 'text') {
            finalText += block.text;
          } else if (block.type === 'tool_use') {
            toolCalls.push(block);
            const tool = toolsToUse[block.name];
            if (tool && tool.execute) {
              const toolResult = await tool.execute(block.input);
              toolResults.push({
                tool_use_id: block.id,
                type: 'tool_result',
                content: JSON.stringify(toolResult),
              });
            }
          }
        }
        
        // If tools were called, make follow-up request
        if (toolResults.length > 0) {
          const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-opus-20240229',
              max_tokens: 4096,
              system: systemPrompt,
              messages: [
                ...messages.map((msg: any) => ({
                  role: msg.role,
                  content: typeof msg.content === 'string' ? msg.content : msg.content,
                })),
                { role: 'assistant', content: data.content },
                { role: 'user', content: toolResults },
              ],
            }),
          });
          
          if (finalResponse.ok) {
            const finalData = await finalResponse.json();
            finalText = '';
            for (const block of finalData.content || []) {
              if (block.type === 'text') {
                finalText += block.text;
              }
            }
          }
        }
        
        result = {
          text: finalText || 'Tool executed successfully. Check logs for details.',
          usage: data.usage || { inputTokens: 0, outputTokens: 0 },
          finishReason: data.stop_reason || 'stop',
          toolCalls: toolCalls,
        };
      }
    } catch (error) {
      console.error('Error with generateText:', error);
      throw error;
    }
    
    // Return JSON response
    return c.json({
      success: true,
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
      toolCalls: result.toolCalls || [],
      contractAddress: result.contractAddress,
      transactionHash: result.transactionHash,
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
  "compatibility_flags": ["nodejs_compat"],
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

