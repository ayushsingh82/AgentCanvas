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
    const handlerName = `handle${tool.name.replace(/_/g, '')}`;
    const moduleName = tool.name.split('_')[0];
    
    // Special handling for hello module (test module)
    if (moduleName === 'hello' && tool.name === 'hello_greet') {
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
    
    // For other modules, call the module service API
    return `  async ${handlerName}(params: any): Promise<any> {
    // Call the ${moduleName} module implementation
    try {
      const response = await fetch(\`\${this.env.API_BASE_URL || 'https://api.yourdomain.com'}/modules/${moduleName}/execute\`, {
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
    const handlerName = `handle${tool.name.replace(/_/g, '')}`;
    return `    this.tools.set('${tool.name}', {
      name: '${tool.name}',
      description: '${tool.description}',
      inputSchema: ${JSON.stringify(tool.inputSchema, null, 6)},
      handler: async (params: any) => await this.${handlerName}(params)
    });`;
  }).join('\n');
  
  const defaultSystemPrompt = systemPrompt || `You are a helpful AI assistant with access to ${tools.length} specialized tools:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Use these tools when users ask you to perform actions. Always confirm what you're doing before executing blockchain operations.`;

  return `import { Hono } from "hono";
import { cors } from "hono/cors";
import { SimplePromptAgent } from "@nullshot/agent/agents";
import { anthropic } from "@ai-sdk/anthropic";
import type { AIUISDKMessage } from "@nullshot/agent/types";
import type { DurableObjectState, ExportedHandler } from "@cloudflare/workers-types";

interface Env {
  SIMPLE_PROMPT_AGENT: DurableObjectNamespace;
  ANTHROPIC_API_KEY: string;
  API_BASE_URL?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for web applications
app.use("/agent/*", cors());

// Health check endpoint
app.get("/", (c) => c.text("${agentName} Agent is running!"));

/**
 * ${agentName} Agent
 * Generated agent with ${tools.length} registered tools
 */
class ${agentName}Agent extends SimplePromptAgent<Env> {
  private tools: Map<string, any> = new Map();

  constructor(state: DurableObjectState, env: Env, model: any) {
    super(state, env, model);
    this.registerTools();
  }

  private registerTools() {
    // Register tools for this agent instance
${toolRegistrations}
  }

${toolHandlers}

  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<Response> {
    const result = await this.streamText(sessionId, {
      model: this.model,
      system: \`${defaultSystemPrompt.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
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

  // Initialize model for this request
  const model = anthropic(c.env.ANTHROPIC_API_KEY);

  // Get Durable Object instance for this session
  const id = c.env.SIMPLE_PROMPT_AGENT.idFromName(sessionId);
  const stub = c.env.SIMPLE_PROMPT_AGENT.get(id);

  // Process the message through the agent
  // Note: The agent will use the model passed during construction
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

