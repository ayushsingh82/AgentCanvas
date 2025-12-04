/**
 * Hello Module (Test Module)
 * Simple test module for deployment testing
 */

import { Module, ToolDefinition } from '@/types/module';

const hello: Module = {
  name: 'hello',
  description: 'A simple test module that responds with a greeting. Use this for testing agent deployment.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name to greet',
        required: false,
      },
      message: {
        type: 'string',
        description: 'Custom message to include',
        required: false,
      },
    },
    required: [],
  },
  workflowSnippet: {
    id: 'hello-1',
    type: 'tool',
    name: 'Say Hello',
    tool: 'hello_greet',
    parameters: {},
  },
  validateInput: (input: Record<string, any>) => {
    // No validation needed for test module
    return {
      valid: true,
    };
  },
  generateWorkflow: (input: Record<string, any>) => {
    return {
      id: `hello-${Date.now()}`,
      type: 'tool',
      name: 'Say Hello',
      tool: 'hello_greet',
      parameters: {
        name: input.name || 'User',
        message: input.message || '',
      },
    };
  },
  getToolDefinition: (): ToolDefinition => {
    return {
      name: 'hello_greet',
      description: 'A simple greeting tool for testing. Returns a friendly hello message.',
      inputSchema: hello.inputSchema,
      toolFunction: 'hello_greet',
    };
  },
};

export default hello;

