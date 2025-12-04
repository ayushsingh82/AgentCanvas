/**
 * Create NFT Module
 * Creates and deploys NFT collections using Coinbase AgentKit
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

export const createNFTModule: ModuleToolDefinition = {
  name: 'createNFT',
  description: 'Create and deploy a new NFT collection on the blockchain using Coinbase AgentKit. Supports ERC721 standard NFT contracts.',
  inputSchema: {
    type: 'object',
    properties: {
      collectionName: {
        type: 'string',
        description: 'Name of the NFT collection',
      },
      collectionSymbol: {
        type: 'string',
        description: 'Symbol of the NFT collection',
      },
      maxSupply: {
        type: 'string',
        description: 'Maximum supply of NFTs (as string, e.g., "10000" or "unlimited")',
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
      },
      baseURI: {
        type: 'string',
        description: 'Base URI for NFT metadata (optional)',
      },
    },
    required: ['collectionName', 'collectionSymbol', 'network'],
  },
  toolFunction: 'createNFT',
};

/**
 * Get create NFT module tool definition
 */
export function getCreateNFTModule(): ModuleToolDefinition {
  return createNFTModule;
}

