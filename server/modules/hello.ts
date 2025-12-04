/**
 * Hello Module
 * Simple test module that replies "hello" to each message
 * Perfect for first deployment testing
 */

export interface ModuleToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  toolFunction: string;
}

export const helloModule: ModuleToolDefinition = {
  name: 'hello_greet',
  description: 'A simple greeting tool that replies with hello. Use this for testing agent deployment.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name to greet (optional)',
      },
      message: {
        type: 'string',
        description: 'Additional message (optional)',
      },
    },
    required: [],
  },
  toolFunction: 'hello_greet',
};

/**
 * Get hello module tool definition
 */
export function getHelloModule(): ModuleToolDefinition {
  return helloModule;
}


