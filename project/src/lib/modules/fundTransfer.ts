/**
 * Fund Transfer Module
 * Allows users to transfer funds between addresses
 */

import { Module, ToolDefinition } from '@/types/module';

const fundTransfer: Module = {
  name: 'fundTransfer',
  description: 'Transfer native tokens or ERC20 tokens between addresses',
  inputSchema: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient address',
        required: true,
      },
      amount: {
        type: 'string',
        description: 'Amount to transfer',
        required: true,
      },
      tokenAddress: {
        type: 'string',
        description: 'Token contract address (empty for native token)',
        required: false,
      },
      network: {
        type: 'string',
        description: 'Blockchain network',
        required: true,
      },
    },
    required: ['to', 'amount', 'network'],
  },
  workflowSnippet: {
    id: 'fund-transfer-1',
    type: 'tool',
    name: 'Transfer Funds',
    tool: 'fundTransfer_execute',
    parameters: {},
  },
  validateInput: (input: Record<string, any>) => {
    const errors: string[] = [];
    
    if (!input.to || typeof input.to !== 'string' || !input.to.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Recipient address is required and must be a valid Ethereum address');
    }
    
    if (!input.amount || typeof input.amount !== 'string') {
      errors.push('Amount is required and must be a string');
    }
    
    if (!input.network || typeof input.network !== 'string') {
      errors.push('Network is required and must be a string');
    }
    
    if (input.tokenAddress && !input.tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Token address must be a valid Ethereum address');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  generateWorkflow: (input: Record<string, any>) => {
    return {
      id: `fund-transfer-${Date.now()}`,
      type: 'tool',
      name: 'Transfer Funds',
      tool: 'fundTransfer_execute',
      parameters: {
        to: input.to,
        amount: input.amount,
        tokenAddress: input.tokenAddress || null,
        network: input.network,
      },
    };
  },
  getToolDefinition: (): ToolDefinition => {
    return {
      name: 'fundTransfer_execute',
      description: 'Transfer native tokens or ERC20 tokens between addresses',
      inputSchema: fundTransfer.inputSchema,
      toolFunction: 'fundTransfer_execute',
    };
  },
};

export default fundTransfer;

