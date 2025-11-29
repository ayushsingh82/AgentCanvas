/**
 * Agent Code Generator
 * Generates NullShot agent code for Cloudflare Workers deployment
 */

import { ToolDefinition } from '@/types/module';

export interface AgentCodeConfig {
  agentName: string;
  tools: ToolDefinition[];
  apiKeys: {
    llmKey?: string;
    cloudflareKey?: string;
    [key: string]: string | undefined;
  };
  systemPrompt?: string;
}

/**
 * Generate NullShot agent code for Cloudflare Workers
 */
export function generateAgentCode(config: AgentCodeConfig): string {
  const { agentName, tools, apiKeys, systemPrompt } = config;
  
  // Generate tool imports and registrations
  const toolImports = tools.map(tool => 
    `// Tool: ${tool.name} - ${tool.description}`
  ).join('\n');
  
  // Generate tool handler imports and implementations
  const toolHandlers = tools.map((tool) => {
    const toolName = tool.name;
    const moduleName = toolName.split('_')[0]; // e.g., 'tokenFactory' from 'tokenFactory_create'
    const handlerName = `handle${toolName.replace(/_/g, '')}`;
    
    // Special handling for hello module (test module)
    if (moduleName === 'hello' && toolName === 'hello_greet') {
      return `  async ${handlerName}(params: any): Promise<any> {
    // Simple test tool - just returns a greeting
    const name = params.name || 'User';
    const message = params.message || '';
    return {
      success: true,
      result: \`Hello, \${name}! \${message}\`.trim(),
      timestamp: new Date().toISOString(),
    };
  }`;
    }
    
    // For other modules, call the module service
    return `  async ${handlerName}(params: any): Promise<any> {
    // Call the ${moduleName} module implementation
    // In production, this would call your actual module service
    try {
      const response = await fetch(\`\${this.env.API_BASE_URL || 'https://api.yourdomain.com'}/modules/${moduleName}/execute\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: '${toolName}',
          parameters: params,
        }),
      });
      
      if (!response.ok) {
        throw new Error(\`Failed to execute ${toolName}: \${response.statusText}\`);
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
  
  const toolRegistrations = tools.map((tool) => {
    const handlerName = `handle${tool.name.replace(/_/g, '')}`;
    return `    // Register ${tool.name} tool
    this.registerTool({
      name: '${tool.name}',
      description: '${tool.description}',
      inputSchema: ${JSON.stringify(tool.inputSchema, null, 8)},
      handler: async (params: any) => {
        return await this.${handlerName}(params);
      }
    });`;
  }).join('\n\n');
  
  const defaultSystemPrompt = systemPrompt || `You are a helpful AI assistant with access to ${tools.length} specialized tools:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Use these tools when users ask you to perform actions. Always confirm what you're doing before executing.`;

  return `import { Hono } from "hono";
import { cors } from "hono/cors";
import { SimplePromptAgent } from "@nullshot/agent/agents";
import { anthropic } from "@ai-sdk/anthropic";
import type { AIUISDKMessage } from "@nullshot/agent/types";
import type { DurableObjectState, ExportedHandler } from "@cloudflare/workers-types";

interface Env {
  SIMPLE_PROMPT_AGENT: DurableObjectNamespace;
  ANTHROPIC_API_KEY: string;
  ${Object.keys(apiKeys).filter(k => k !== 'llmKey').map(k => `${k.toUpperCase()}: string;`).join('\n  ')}
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for web applications
app.use("/agent/*", cors());

// Health check endpoint
app.get("/", (c) => c.text("Agent ${agentName} is running!"));

/**
 * ${agentName} Agent
 * Generated agent with ${tools.length} registered tools
 */
class ${agentName}Agent extends SimplePromptAgent<Env> {
  constructor(state: DurableObjectState, env: Env, model: any) {
    super(state, env, model);
    this.registerTools();
  }

  private registerTools() {
${toolRegistrations}
  }

${toolHandlers}

  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<Response> {
    const result = await this.streamText(sessionId, {
      model: this.model,
      system: \`${defaultSystemPrompt.replace(/`/g, '\\`')}\`,
      messages: messages.messages,
      maxSteps: 10,
      experimental_toolCallStreaming: true,
    });

    return result.toDataStreamResponse();
  }
}

// Chat endpoint handler
app.post("/agent/chat/:sessionId?", async (c) => {
  const sessionId = c.req.param("sessionId") || crypto.randomUUID();
  const body = await c.req.json<AIUISDKMessage>();

  // Get Durable Object instance for this session
  const id = c.env.SIMPLE_PROMPT_AGENT.idFromName(sessionId);
  const stub = c.env.SIMPLE_PROMPT_AGENT.get(id);

  // Process the message through the agent
  return await stub.processMessage(sessionId, body);
});

export { ${agentName}Agent };
export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
`;
}

/**
 * Generate wrangler.jsonc configuration
 */
export function generateWranglerConfig(agentName: string, accountId?: string): string {
  const workerName = agentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  return `{
  "name": "${workerName}",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-19",
  "vars": {
    "AI_PROVIDER": "anthropic"
  },
  "durable_objects": {
    "bindings": [
      {
        "name": "SIMPLE_PROMPT_AGENT",
        "class_name": "${agentName}Agent",
        "script_name": "${workerName}"
      }
    ]
  }${accountId ? `,\n  "account_id": "${accountId}"` : ''}
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
    "@nullshot/agent": "latest",
    "@ai-sdk/anthropic": "latest",
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

