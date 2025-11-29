/**
 * NFT Factory Module
 * Allows users to create and deploy NFT collections
 */

import { Module, ToolDefinition } from '@/types/module';

const nftFactory: Module = {
  name: 'nftFactory',
  description: 'Create and deploy NFT collections with customizable metadata and supply',
  inputSchema: {
    type: 'object',
    properties: {
      collectionName: {
        type: 'string',
        description: 'NFT collection name',
        required: true,
      },
      symbol: {
        type: 'string',
        description: 'Collection symbol',
        required: true,
      },
      maxSupply: {
        type: 'number',
        description: 'Maximum number of NFTs in collection',
        required: true,
      },
      baseURI: {
        type: 'string',
        description: 'Base URI for NFT metadata',
        required: false,
      },
      network: {
        type: 'string',
        description: 'Blockchain network',
        required: true,
      },
    },
    required: ['collectionName', 'symbol', 'maxSupply', 'network'],
  },
  workflowSnippet: {
    id: 'nft-factory-1',
    type: 'tool',
    name: 'Create NFT Collection',
    tool: 'nftFactory_create',
    parameters: {},
  },
  validateInput: (input: Record<string, any>) => {
    const errors: string[] = [];
    
    if (!input.collectionName || typeof input.collectionName !== 'string') {
      errors.push('Collection name is required and must be a string');
    }
    
    if (!input.symbol || typeof input.symbol !== 'string') {
      errors.push('Collection symbol is required and must be a string');
    }
    
    if (!input.maxSupply || typeof input.maxSupply !== 'number' || input.maxSupply <= 0) {
      errors.push('Max supply is required and must be a positive number');
    }
    
    if (!input.network || typeof input.network !== 'string') {
      errors.push('Network is required and must be a string');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  generateWorkflow: (input: Record<string, any>) => {
    return {
      id: `nft-factory-${Date.now()}`,
      type: 'tool',
      name: `Create NFT Collection: ${input.collectionName}`,
      tool: 'nftFactory_create',
      parameters: {
        collectionName: input.collectionName,
        symbol: input.symbol,
        maxSupply: input.maxSupply,
        baseURI: input.baseURI || '',
        network: input.network,
      },
    };
  },
  getToolDefinition: (): ToolDefinition => {
    return {
      name: 'nftFactory_create',
      description: 'Create and deploy an NFT collection with customizable metadata and supply',
      inputSchema: nftFactory.inputSchema,
      toolFunction: 'nftFactory_create',
    };
  },
};

export default nftFactory;

