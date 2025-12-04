/**
 * Airdrop Module
 * Distributes tokens or NFTs to multiple addresses using Coinbase AgentKit
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

export const airdropModule: ModuleToolDefinition = {
  name: 'airdrop',
  description: 'Distribute tokens or NFTs to multiple addresses in a single transaction using Coinbase AgentKit. Efficient batch distribution.',
  inputSchema: {
    type: 'object',
    properties: {
      contractAddress: {
        type: 'string',
        description: 'Address of the token or NFT contract',
      },
      recipients: {
        type: 'array',
        description: 'Array of recipient addresses',
        items: {
          type: 'string',
        },
      },
      amounts: {
        type: 'array',
        description: 'Array of amounts to send (for tokens) or token IDs (for NFTs). Must match recipients array length.',
        items: {
          type: 'string',
        },
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
      },
      tokenType: {
        type: 'string',
        description: 'Type of asset: "token" (ERC20) or "nft" (ERC721)',
        enum: ['token', 'nft'],
      },
    },
    required: ['contractAddress', 'recipients', 'amounts', 'network', 'tokenType'],
  },
  toolFunction: 'airdrop',
};

/**
 * Get airdrop module tool definition
 */
export function getAirdropModule(): ModuleToolDefinition {
  return airdropModule;
}

