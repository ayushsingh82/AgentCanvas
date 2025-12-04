/**
 * Make Transaction Module
 * Executes blockchain transactions (native token or ERC20 transfers)
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

export const makeTransactionModule: ModuleToolDefinition = {
  name: 'makeTransaction',
  description: 'Execute a blockchain transaction to send native tokens or ERC20 tokens to a recipient address.',
  inputSchema: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient address',
      },
      amount: {
        type: 'string',
        description: 'Amount to send (as string, e.g., "1.5" for native tokens or "1000" for ERC20)',
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
      },
      tokenAddress: {
        type: 'string',
        description: 'ERC20 token contract address (optional, omit for native token transfers)',
      },
    },
    required: ['to', 'amount', 'network'],
  },
  toolFunction: 'makeTransaction',
};

/**
 * Get make transaction module tool definition
 */
export function getMakeTransactionModule(): ModuleToolDefinition {
  return makeTransactionModule;
}


