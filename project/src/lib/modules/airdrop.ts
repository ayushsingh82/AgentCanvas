/**
 * Airdrop Module
 * Allows users to distribute tokens to multiple addresses
 */

import { Module, ToolDefinition } from '@/types/module';

const airdrop: Module = {
  name: 'airdrop',
  description: 'Distribute tokens to multiple addresses in a single transaction',
  inputSchema: {
    type: 'object',
    properties: {
      tokenAddress: {
        type: 'string',
        description: 'Token contract address',
        required: true,
      },
      recipients: {
        type: 'array',
        description: 'Array of recipient addresses and amounts',
        required: true,
        items: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            amount: { type: 'string' },
          },
        },
      },
      network: {
        type: 'string',
        description: 'Blockchain network',
        required: true,
      },
    },
    required: ['tokenAddress', 'recipients', 'network'],
  },
  workflowSnippet: {
    id: 'airdrop-1',
    type: 'tool',
    name: 'Execute Airdrop',
    tool: 'airdrop_execute',
    parameters: {},
  },
  validateInput: (input: Record<string, any>) => {
    const errors: string[] = [];
    
    if (!input.tokenAddress || typeof input.tokenAddress !== 'string' || !input.tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Token address is required and must be a valid Ethereum address');
    }
    
    if (!Array.isArray(input.recipients) || input.recipients.length === 0) {
      errors.push('Recipients is required and must be a non-empty array');
    } else {
      input.recipients.forEach((recipient: any, index: number) => {
        if (!recipient.address || !recipient.address.match(/^0x[a-fA-F0-9]{40}$/)) {
          errors.push(`Recipient ${index + 1}: address must be a valid Ethereum address`);
        }
        if (!recipient.amount || typeof recipient.amount !== 'string') {
          errors.push(`Recipient ${index + 1}: amount is required and must be a string`);
        }
      });
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
      id: `airdrop-${Date.now()}`,
      type: 'tool',
      name: 'Execute Airdrop',
      tool: 'airdrop_execute',
      parameters: {
        tokenAddress: input.tokenAddress,
        recipients: input.recipients,
        network: input.network,
      },
    };
  },
  getToolDefinition: (): ToolDefinition => {
    return {
      name: 'airdrop_execute',
      description: 'Distribute tokens to multiple addresses in a single transaction',
      inputSchema: airdrop.inputSchema,
      toolFunction: 'airdrop_execute',
    };
  },
};

export default airdrop;

