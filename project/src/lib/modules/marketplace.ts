/**
 * Marketplace Module
 * Allows users to create NFT marketplaces
 */

import { Module, ToolDefinition } from '@/types/module';

const marketplace: Module = {
  name: 'marketplace',
  description: 'Create and deploy NFT marketplace with listing and trading capabilities',
  inputSchema: {
    type: 'object',
    properties: {
      marketplaceName: {
        type: 'string',
        description: 'Name of the marketplace',
        required: true,
      },
      feePercentage: {
        type: 'string',
        description: 'Marketplace fee percentage (e.g., "2.5" for 2.5%)',
        required: true,
      },
      feeRecipient: {
        type: 'string',
        description: 'Address to receive marketplace fees',
        required: true,
      },
      network: {
        type: 'string',
        description: 'Blockchain network',
        required: true,
      },
    },
    required: ['marketplaceName', 'feePercentage', 'feeRecipient', 'network'],
  },
  workflowSnippet: {
    id: 'marketplace-1',
    type: 'tool',
    name: 'Create Marketplace',
    tool: 'marketplace_create',
    parameters: {},
  },
  validateInput: (input: Record<string, any>) => {
    const errors: string[] = [];
    
    if (!input.marketplaceName || typeof input.marketplaceName !== 'string') {
      errors.push('Marketplace name is required and must be a string');
    }
    
    if (!input.feePercentage || typeof input.feePercentage !== 'string') {
      errors.push('Fee percentage is required and must be a string');
    }
    
    if (!input.feeRecipient || typeof input.feeRecipient !== 'string' || !input.feeRecipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Fee recipient is required and must be a valid Ethereum address');
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
      id: `marketplace-${Date.now()}`,
      type: 'tool',
      name: `Create Marketplace: ${input.marketplaceName}`,
      tool: 'marketplace_create',
      parameters: {
        marketplaceName: input.marketplaceName,
        feePercentage: input.feePercentage,
        feeRecipient: input.feeRecipient,
        network: input.network,
      },
    };
  },
  getToolDefinition: (): ToolDefinition => {
    return {
      name: 'marketplace_create',
      description: 'Create and deploy an NFT marketplace with listing and trading capabilities',
      inputSchema: marketplace.inputSchema,
      toolFunction: 'marketplace_create',
    };
  },
};

export default marketplace;

