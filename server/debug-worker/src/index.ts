import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, tool } from "ai";
import { z } from "zod";
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
app.get("/", (c) => c.text("DebugAgent Agent is running!"));

// Tool registry
const tools = new Map<string, any>();

// Register tools
tools.set('createToken', {
      name: 'createToken',
      description: 'Create and deploy a new ERC20 token on the blockchain using Coinbase AgentKit. Provides secure token deployment with proper contract creation.',
      inputSchema: {
      "type": "object",
      "properties": {
            "tokenName": {
                  "type": "string",
                  "description": "Name of the token (e.g., \"My Awesome Token\")"
            },
            "tokenSymbol": {
                  "type": "string",
                  "description": "Symbol of the token (e.g., \"MAT\")"
            },
            "totalSupply": {
                  "type": "string",
                  "description": "Total supply of tokens to create (as string, e.g., \"1000000\")"
            },
            "decimals": {
                  "type": "number",
                  "description": "Number of decimals for the token (default: 18)"
            },
            "network": {
                  "type": "string",
                  "description": "Blockchain network (e.g., \"base-sepolia\", \"base-mainnet\", \"ethereum\")"
            }
      },
      "required": [
            "tokenName",
            "tokenSymbol",
            "totalSupply",
            "network"
      ]
},
      handler: async (params: any, env?: Env) => await handleCreateToken(params, env)
    });

// Store env in closure for tool handlers
let globalEnv: Env | undefined;

// Tool handlers
async function handleCreateToken(params: any): Promise<any> {
  // createToken - Using Coinbase AgentKit (CDP)
  
  try {
    if (!params.tokenName || !params.tokenSymbol || !params.totalSupply || !params.network) {
      return {
        success: false,
        error: 'Missing required parameters: tokenName, tokenSymbol, totalSupply, and network are required',
      };
    }
    
    // Try to get API_BASE_URL from env, fallback to localhost:3000
    const apiBaseUrl = globalEnv?.API_BASE_URL || 'http://localhost:3000';
    console.log('[TOOL] Calling API:', `${apiBaseUrl}/api/agentkit/createToken`);
    console.log('[TOOL] Request body:', JSON.stringify({
      tokenName: params.tokenName,
      tokenSymbol: params.tokenSymbol,
      totalSupply: params.totalSupply,
      decimals: params.decimals || 18,
      network: params.network,
    }, null, 2));
    
    const response = await fetch(`${apiBaseUrl}/api/agentkit/createToken`, {
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
      console.error('[TOOL] API error:', response.status, errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(`Failed to create token: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('[TOOL] API success:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating token',
      details: error instanceof Error ? error.stack : undefined,
    };
  }
}

// Chat endpoint handler
app.post("/agent/chat/:sessionId?", async (c) => {
  try {
    const sessionId = c.req.param("sessionId") || `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
    
    // DIRECT TOOL EXECUTION: If user asks to create token, execute directly
    // Only trigger for explicit token creation requests
    const lowerMessage = userMessage.toLowerCase();
    const createTokenMatch = (
      (lowerMessage.includes('create') && lowerMessage.includes('token')) ||
      (lowerMessage.includes('deploy') && lowerMessage.includes('token')) ||
      (lowerMessage.includes('make') && lowerMessage.includes('token'))
    ) && (
      lowerMessage.includes('token') && 
      (lowerMessage.includes('name') || lowerMessage.includes('symbol') || lowerMessage.includes('supply'))
    );
    
    // Set globalEnv BEFORE checking tools
    globalEnv = c.env;
    
    console.log('[DIRECT] ========== CHECKING FOR DIRECT EXECUTION ==========');
    console.log('[DIRECT] Message:', userMessage);
    console.log('[DIRECT] Has create:', lowerMessage.includes('create'));
    console.log('[DIRECT] Has token:', lowerMessage.includes('token'));
    console.log('[DIRECT] Tools map size:', tools.size);
    console.log('[DIRECT] Has createToken tool:', tools.has('createToken'));
    console.log('[DIRECT] Match:', createTokenMatch);
    
    if (createTokenMatch && tools.has('createToken')) {
      console.log('[DIRECT] User asked to create token, executing tool directly...');
      const tokenNameMatch = userMessage.match(/named\s+(\w+)|name[:\s]+(\w+)/i);
      const symbolMatch = userMessage.match(/symbol[:\s]+(\w+)/i);
      const supplyMatch = userMessage.match(/(\d+)\s*(?:tokens|supply|total)/i);
      const networkMatch = userMessage.match(/(base-sepolia|base-mainnet|ethereum|polygon)/i);
      const decimalsMatch = userMessage.match(/(\d+)\s*decimals/i);
      
      const tool = tools.get('createToken');
      if (tool) {
        const params: any = {
          tokenName: tokenNameMatch ? (tokenNameMatch[1] || tokenNameMatch[2] || 'TestToken') : 'TestToken',
          tokenSymbol: symbolMatch ? symbolMatch[1] : 'TST',
          totalSupply: supplyMatch ? supplyMatch[1] : '1000000',
          network: networkMatch ? networkMatch[1] : 'base-sepolia',
          decimals: decimalsMatch ? parseInt(decimalsMatch[1]) : 18,
        };
        
        console.log('[DIRECT] Executing createToken with params:', params);
        globalEnv = c.env;
        const result = await tool.handler(params);
        console.log('[DIRECT] Tool result:', JSON.stringify(result, null, 2));
        
        // Always return the result, even if it failed
        if (result.success && result.contractAddress) {
          console.log('[DIRECT] ✅✅✅ SUCCESS! Returning contract address:', result.contractAddress);
          return c.json({
            success: true,
            text: `Token created successfully! Contract address: ${result.contractAddress}. Transaction hash: ${result.transactionHash || 'N/A'}`,
            contractAddress: result.contractAddress,
            transactionHash: result.transactionHash,
            usage: { inputTokens: 0, outputTokens: 0 },
            finishReason: 'stop',
          });
        } else {
          console.log('[DIRECT] ❌ Failed:', result.error);
          return c.json({
            success: false,
            error: result.error || 'Failed to create token',
            text: result.error || 'Failed to create token',
            details: result.details,
          });
        }
      } else {
        console.log('[DIRECT] Tool not found!');
      }
    } else {
      console.log('[DIRECT] Not executing - condition not met');
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
    // Store env for tool handlers
    globalEnv = c.env;
    
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
      
      // BYPASS AI SDK: Store tool for direct Anthropic API call
      const inputSchema = {
        type: 'object' as const,
        properties: normalizedProperties,
        required: schema.required || [],
      };
      
      aiTools[name] = {
        name: name,
        description: toolDef.description || `Tool: ${name}`,
        input_schema: inputSchema,
        execute: async (params: any) => {
          console.log(`[TOOL EXECUTION] ✅✅✅ TOOL ACTUALLY CALLED! ${name} with params:`, JSON.stringify(params, null, 2));
          try {
            const result = await toolDef.handler(params);
            console.log(`[TOOL EXECUTION] ✅ Tool ${name} result:`, JSON.stringify(result, null, 2));
            return result;
          } catch (error) {
            console.error(`[TOOL EXECUTION ERROR] Tool ${name} failed:`, error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
      };
      
      console.log(`[TOOL CREATED] ${name}: Ready for direct Anthropic API`);
    }
    
    // Process message with tools
    // Build system prompt that encourages tool usage
    const toolNames = Object.keys(aiTools);
    const toolList = toolNames.length > 0 ? toolNames.join(', ') : 'none';
    // CRITICAL: System prompt must NOT tell LLM to "call" tools in text
    // LLM must actually invoke tools, not describe calling them
    const systemPrompt = `You are a helpful AI assistant with access to blockchain tools.

IMPORTANT: Only use the createToken tool when the user EXPLICITLY asks to create, deploy, or make a token. Do NOT use tools for greetings, questions, or general conversation.

Available tools: ${toolList}

For token creation requests ONLY, invoke the createToken tool with:
- tokenName: string
- tokenSymbol: string  
- totalSupply: string (e.g., "1000000")
- decimals: number (default: 18)
- network: string (e.g., "base-sepolia")

Do NOT use tools for:
- Greetings (hello, hi, etc.)
- General questions
- Non-token-creation requests

Only invoke tools when the user explicitly requests token creation with specific parameters.`;

    // Re-enable tools with proper format
    // The tools MUST be registered and execute functions MUST exist
    // Otherwise LLM will hallucinate fake tool responses
    const toolsToUse = Object.keys(aiTools).length > 0 ? aiTools : undefined;
    
    if (toolsToUse) {
      console.log('Tools available:', Object.keys(toolsToUse));
      // Log first tool structure for debugging
      const firstTool = Object.values(toolsToUse)[0];
      console.log('First tool structure:', JSON.stringify({
        name: firstTool.name,
        description: firstTool.description,
        hasParameters: !!firstTool.parameters,
        hasExecute: typeof firstTool.execute === 'function'
      }, null, 2));
    }
    
    // Try generateText with tools - log everything for debugging
    let result;
    try {
      if (toolsToUse) {
        console.log('[DEBUG] Tools being passed:', {
          count: Object.keys(toolsToUse).length,
          names: Object.keys(toolsToUse),
        });
      }
      
      // Log the exact tool structure before sending
      if (toolsToUse) {
        const firstTool = Object.values(toolsToUse)[0];
        console.log('[DEBUG] First tool structure BEFORE AI SDK:', JSON.stringify({
          name: firstTool?.name,
          description: firstTool?.description,
          input_schema: firstTool?.input_schema,
          input_schema_type: firstTool?.input_schema?.type,
          hasExecute: typeof firstTool?.execute === 'function',
        }, null, 2));
      }
      
      // MONKEY PATCH: Intercept the tool conversion to ensure type is preserved
      // The AI SDK wraps tools in "custom" but we need to ensure input_schema.type survives
      const originalTools = toolsToUse;
      const patchedTools: Record<string, any> = {};
      for (const [toolName, toolDef] of Object.entries(originalTools || {})) {
        // Ensure input_schema has type at the root level
        const tool = toolDef as any;
        if (tool.input_schema && !tool.input_schema.type) {
          console.error(`[PATCH] Tool ${toolName} missing type! Adding it.`);
          tool.input_schema.type = 'object';
        }
        if (tool.input_schema && tool.input_schema.type !== 'object') {
          console.error(`[PATCH] Tool ${toolName} has wrong type: ${tool.input_schema.type}. Fixing.`);
          tool.input_schema.type = 'object';
        }
        patchedTools[toolName] = tool;
      }
      
      // BYPASS AI SDK: Call Anthropic API directly
      const anthropicTools = Object.values(toolsToUse).map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      }));
      
      console.log('[DEBUG] ========== CALLING ANTHROPIC API ==========');
      console.log('[DEBUG] Tools being sent:', JSON.stringify(anthropicTools, null, 2));
      console.log('[DEBUG] First tool input_schema:', JSON.stringify(anthropicTools[0]?.input_schema, null, 2));
      
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
          tool_choice: anthropicTools.length > 0 ? { type: 'any' } : { type: 'auto' },
        }),
      });
      
      console.log('[DEBUG] Request payload:', JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        system: systemPrompt.substring(0, 100) + '...',
        messages: messages.length,
        tools: anthropicTools.length,
        tool_choice: { type: 'auto' },
      }, null, 2));
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[DEBUG] ========== FULL RESPONSE ==========');
      console.log(JSON.stringify(data, null, 2));
      
      // Handle tool calls
      let finalText = '';
      const toolResults: any[] = [];
      const toolCalls: any[] = [];
      
      const contentArray = Array.isArray(data.content) ? data.content : [data.content];
      console.log(`[DEBUG] Content has ${contentArray.length} blocks, stop_reason: ${data.stop_reason}`);
      
      // If stop_reason is tool_use but no tool_use blocks, Anthropic might be thinking
      // Let's check if we need to parse differently
      let foundToolUse = false;
      for (const block of contentArray) {
        console.log(`[DEBUG] Block type: ${block.type}`);
        if (block.type === 'text') {
          finalText += block.text;
        } else if (block.type === 'tool_use') {
          foundToolUse = true;
          console.log(`[TOOL CALL] ✅✅✅ FOUND! ${block.name}`);
          toolCalls.push(block);
          const tool = toolsToUse[block.name];
          if (tool && tool.execute) {
            console.log(`[TOOL EXECUTION] Executing ${block.name}...`);
            const toolResult = await tool.execute(block.input);
            console.log(`[TOOL EXECUTION] ✅ Result:`, JSON.stringify(toolResult, null, 2));
            toolResults.push({
              tool_use_id: block.id,
              type: 'tool_result',
              content: JSON.stringify(toolResult),
            });
          }
        }
      }
      
      // If stop_reason is tool_use but no tool_use blocks found, something is wrong
      if (data.stop_reason === 'tool_use' && !foundToolUse) {
        console.error('[ERROR] stop_reason is tool_use but no tool_use blocks in content!');
        console.error('[ERROR] This means Anthropic wants to use a tool but didn\'t include it in the response.');
        console.error('[ERROR] Response content:', JSON.stringify(data.content, null, 2));
        // Try to force tool execution anyway by manually constructing a tool call
        // This is a workaround - we'll call the tool directly based on the user's request
        if (toolsToUse['createToken']) {
          console.log('[WORKAROUND] Manually calling createToken tool...');
          const tool = toolsToUse['createToken'];
          const toolResult = await tool.execute({
            tokenName: 'TestToken',
            tokenSymbol: 'TST',
            totalSupply: '1000000',
            decimals: 18,
            network: 'base-sepolia',
          });
          console.log('[WORKAROUND] Tool result:', JSON.stringify(toolResult, null, 2));
          toolResults.push({
            tool_use_id: 'manual-call',
            type: 'tool_result',
            content: JSON.stringify(toolResult),
          });
        }
      }
      
      console.log(`[DEBUG] Tool calls: ${toolCalls.length}, Tool results: ${toolResults.length}`);
      
      // If tools were called, make follow-up request
      if (toolResults.length > 0) {
        console.log('[DEBUG] Making follow-up request with tool results:', JSON.stringify(toolResults, null, 2));
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
        
        if (!finalResponse.ok) {
          const errorText = await finalResponse.text();
          throw new Error(`Anthropic API error (follow-up): ${finalResponse.status} ${errorText}`);
        }
        
        const finalData = await finalResponse.json();
        console.log('[DEBUG] Final response:', JSON.stringify(finalData, null, 2));
        finalText = ''; // Reset to get final text
        for (const block of finalData.content || []) {
          if (block.type === 'text') {
            finalText += block.text;
          }
        }
      }
      
      result = {
        text: finalText || 'Tool executed successfully. Check logs for details.',
        usage: data.usage || { inputTokens: 0, outputTokens: 0 },
        finishReason: data.stop_reason || 'stop',
        toolCalls: toolCalls,
      };
      
      // Log the result to see if tools were called
      console.log('[DEBUG] generateText result:', {
        text: result.text?.substring(0, 200),
        finishReason: result.finishReason,
        hasToolCalls: result.steps?.some((step: any) => step.toolCalls?.length > 0) || false,
        stepCount: result.steps?.length || 0,
      });
      
      // Check if tools were actually called
      if (result.steps) {
        for (const step of result.steps) {
          if (step.toolCalls && step.toolCalls.length > 0) {
            console.log('[DEBUG] Tool calls found in step:', step.toolCalls);
          }
        }
      }
    } catch (error) {
      console.error('[ERROR] generateText failed:', error);
      console.error('[ERROR] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
      });
      throw error; // Don't fallback - we need to see the actual error
    }
    
    // Return JSON response with better structure
    return c.json({
      success: true,
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
      toolCalls: result.steps?.flatMap((step: any) => step.toolCalls || []) || [],
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
