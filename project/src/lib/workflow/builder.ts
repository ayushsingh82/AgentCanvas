/**
 * Workflow Builder
 * Registers modules as available tools for the agent
 * Tools are capabilities, not pre-configured actions
 * Parameters come from chat conversation when agent uses the tool
 */

import { Workflow } from '@/types/workflow';
import { UserModuleSelection, ToolDefinition } from '@/types/module';
import { getModule } from '@/lib/modules';

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique agent ID
 */
function generateAgentId(userId: string): string {
  return `agent-${userId}-${Date.now()}`;
}

/**
 * Generate agent chat URL
 * This URL allows direct access to the agent instance
 */
function generateAgentChatURL(agentId: string, sessionId: string): string {
  // In production, this would be the actual NullShot agent URL
  // For now, we'll generate a placeholder URL structure
  const baseURL = process.env.AGENT_BASE_URL || 'https://agent.nullshot.io';
  return `${baseURL}/chat/${agentId}?session=${sessionId}`;
}

/**
 * Build workflow from user module selections
 * This registers modules as available tools for the agent
 * Tools are capabilities - parameters come from chat conversation
 */
export function buildWorkflow(
  userId: string,
  moduleSelections: UserModuleSelection[]
): { workflow: Workflow; errors: string[]; tools: ToolDefinition[] } {
  const errors: string[] = [];
  const tools: ToolDefinition[] = [];
  
  // Register each module as an available tool
  for (let i = 0; i < moduleSelections.length; i++) {
    const selection = moduleSelections[i];
    const module = getModule(selection.moduleName);
    
    if (!module) {
      errors.push(`Module "${selection.moduleName}" not found`);
      continue;
    }
    
    // Get tool definition (no input validation needed - tools are capabilities)
    const toolDefinition = module.getToolDefinition();
    tools.push(toolDefinition);
  }
  
  if (errors.length > 0) {
    return { workflow: {} as Workflow, errors, tools: [] };
  }
  
  // Generate metadata
  const sessionId = generateSessionId();
  const agentId = generateAgentId(userId);
  const agentChatURL = generateAgentChatURL(agentId, sessionId);
  
  // Workflow now contains tool definitions for agent registration
  // The agent will use these tools based on chat conversation
  const workflow: Workflow = {
    metadata: {
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      agentId,
      agentChatURL,
    },
    // Store tools as nodes for compatibility, but they represent tool registrations
    nodes: tools.map((tool, index) => ({
      id: `tool-${index}`,
      type: 'tool',
      name: tool.name,
      tool: tool.toolFunction,
      parameters: {}, // Empty - parameters come from chat
    })),
    // Store tool definitions for agent initialization
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      toolFunction: tool.toolFunction,
    })),
  };
  
  return { workflow, errors: [], tools };
}

/**
 * Validate workflow structure
 */
export function validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!workflow.metadata) {
    errors.push('Workflow metadata is required');
  } else {
    if (!workflow.metadata.userId) {
      errors.push('Workflow metadata must include userId');
    }
    if (!workflow.metadata.sessionId) {
      errors.push('Workflow metadata must include sessionId');
    }
  }
  
  // Workflow should have either nodes (for compatibility) or tools (for agent registration)
  if ((!workflow.nodes || workflow.nodes.length === 0) && (!workflow.tools || workflow.tools.length === 0)) {
    errors.push('Workflow must have at least one tool registered');
  }
  
  // Validate tool definitions if present
  if (workflow.tools) {
    workflow.tools.forEach((tool, index) => {
      if (!tool.name) {
        errors.push(`Tool ${index}: name is required`);
      }
      if (!tool.toolFunction) {
        errors.push(`Tool ${index}: toolFunction is required`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

