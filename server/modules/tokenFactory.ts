/**
 * Token Factory Module
 * Creates and deploys ERC20 tokens on blockchain
 * User provides: private key, RPC URL, token name, volume, and deployment details
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

export const tokenFactoryModule: ModuleToolDefinition = {
  name: 'tokenFactory_createToken',
  description: 'Create and deploy a new ERC20 token on the blockchain. User provides private key, RPC URL, token name, volume (total supply), and optional initial distribution details (first send address and amount).',
  inputSchema: {
    type: 'object',
    properties: {
      privateKey: {
        type: 'string',
        description: 'Private key of the wallet that will deploy the token (keep secure, starts with 0x)',
      },
      rpcUrl: {
        type: 'string',
        description: 'RPC URL of the blockchain network (e.g., https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY or https://polygon-rpc.com)',
      },
      tokenName: {
        type: 'string',
        description: 'Name of the token (e.g., "My Awesome Token")',
      },
      tokenSymbol: {
        type: 'string',
        description: 'Symbol of the token (e.g., "MAT")',
      },
      volume: {
        type: 'string',
        description: 'Total supply/volume of tokens to create (as string, e.g., "1000000")',
      },
      decimals: {
        type: 'number',
        description: 'Number of decimals for the token (default: 18)',
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "ethereum", "polygon", "bsc", "arbitrum")',
      },
      firstSendAddress: {
        type: 'string',
        description: 'Address to send initial tokens to after deployment (optional)',
      },
      firstSendAmount: {
        type: 'string',
        description: 'Amount of tokens to send to firstSendAddress (optional, e.g., "1000")',
      },
    },
    required: ['privateKey', 'rpcUrl', 'tokenName', 'tokenSymbol', 'volume', 'network'],
  },
  toolFunction: 'tokenFactory_createToken',
};

/**
 * Get token factory module tool definition
 */
export function getTokenFactoryModule(): ModuleToolDefinition {
  return tokenFactoryModule;
}

