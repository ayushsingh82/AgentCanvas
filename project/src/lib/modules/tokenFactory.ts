/**
 * Token Factory Module
 * Allows users to create and deploy custom tokens
 */

import { Module, ToolDefinition } from '@/types/module';

const tokenFactory: Module = {
  name: 'tokenFactory',
  description: 'Create and deploy custom ERC20 tokens with configurable supply and metadata',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Token name',
        required: true,
      },
      symbol: {
        type: 'string',
        description: 'Token symbol (e.g., USDT)',
        required: true,
      },
      totalSupply: {
        type: 'string',
        description: 'Total supply of tokens',
        required: true,
      },
      decimals: {
        type: 'number',
        description: 'Number of decimals (default: 18)',
        default: 18,
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., ethereum, polygon)',
        required: true,
      },
    },
    required: ['name', 'symbol', 'totalSupply', 'network'],
  },
  workflowSnippet: {
    id: 'token-factory-1',
    type: 'tool',
    name: 'Create Token',
    tool: 'tokenFactory_create',
    parameters: {},
  },
  validateInput: (input: Record<string, any>) => {
    const errors: string[] = [];
    
    if (!input.name || typeof input.name !== 'string') {
      errors.push('Token name is required and must be a string');
    }
    
    if (!input.symbol || typeof input.symbol !== 'string') {
      errors.push('Token symbol is required and must be a string');
    }
    
    if (!input.totalSupply || typeof input.totalSupply !== 'string') {
      errors.push('Total supply is required and must be a string');
    }
    
    if (!input.network || typeof input.network !== 'string') {
      errors.push('Network is required and must be a string');
    }
    
    if (input.decimals !== undefined && (typeof input.decimals !== 'number' || input.decimals < 0)) {
      errors.push('Decimals must be a non-negative number');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  generateWorkflow: (input: Record<string, any>) => {
    return {
      id: `token-factory-${Date.now()}`,
      type: 'tool',
      name: `Create Token: ${input.symbol}`,
      tool: 'tokenFactory_create',
      parameters: {
        name: input.name,
        symbol: input.symbol,
        totalSupply: input.totalSupply,
        decimals: input.decimals || 18,
        network: input.network,
      },
    };
  },
  getToolDefinition: (): ToolDefinition => {
    return {
      name: 'tokenFactory_create',
      description: 'Create and deploy a custom ERC20 token with configurable supply and metadata',
      inputSchema: tokenFactory.inputSchema,
      toolFunction: 'tokenFactory_create',
    };
  },
};

export default tokenFactory;

