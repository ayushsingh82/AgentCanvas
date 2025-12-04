/**
 * Create Token Module
 * Creates and deploys ERC20 tokens using Coinbase AgentKit
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

export const createTokenModule: ModuleToolDefinition = {
  name: 'createToken',
  description: 'Create and deploy a new ERC20 token on the blockchain using Coinbase AgentKit. Provides secure token deployment with proper contract creation.',
  inputSchema: {
    type: 'object',
    properties: {
      tokenName: {
        type: 'string',
        description: 'Name of the token (e.g., "My Awesome Token")',
      },
      tokenSymbol: {
        type: 'string',
        description: 'Symbol of the token (e.g., "MAT")',
      },
      totalSupply: {
        type: 'string',
        description: 'Total supply of tokens to create (as string, e.g., "1000000")',
      },
      decimals: {
        type: 'number',
        description: 'Number of decimals for the token (default: 18)',
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
      },
    },
    required: ['tokenName', 'tokenSymbol', 'totalSupply', 'network'],
  },
  toolFunction: 'createToken',
};

/**
 * Get create token module tool definition
 */
export function getCreateTokenModule(): ModuleToolDefinition {
  return createTokenModule;
}

