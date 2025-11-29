/**
 * Module type definitions
 */

export interface ModuleInputSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
    default?: any;
    [key: string]: any;
  }>;
  required?: string[];
}

export interface ModuleWorkflowSnippet {
  id: string;
  type: string;
  name: string;
  tool: string;
  parameters: Record<string, any>;
  next?: string[];
}

export interface Module {
  name: string;
  description: string;
  inputSchema: ModuleInputSchema;
  workflowSnippet: ModuleWorkflowSnippet | ModuleWorkflowSnippet[];
  validateInput: (input: Record<string, any>) => { valid: boolean; errors?: string[] };
  generateWorkflow: (input: Record<string, any>) => ModuleWorkflowSnippet | ModuleWorkflowSnippet[];
  // Get tool definition for agent registration (no input parameters needed)
  getToolDefinition: () => ToolDefinition;
}

export interface UserModuleSelection {
  moduleName: string;
  // Input is optional - modules are capabilities/tools, not pre-configured actions
  // Parameters will come from chat conversation when agent uses the tool
  input?: Record<string, any>;
  order?: number;
}

/**
 * Tool definition for agent registration
 * This is what gets registered with the agent so it can use the tool during chat
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ModuleInputSchema;
  toolFunction: string; // The actual tool function name (e.g., 'tokenFactory_create')
}

export interface SavedUserModules {
  userId: string;
  modules: UserModuleSelection[];
  createdAt: string;
  updatedAt: string;
}

