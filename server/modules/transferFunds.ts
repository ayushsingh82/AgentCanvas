/**
 * Transfer Funds Module
 * Transfers native tokens (ETH, BASE, etc.) or ERC20 tokens using Coinbase AgentKit
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

export const transferFundsModule: ModuleToolDefinition = {
  name: 'transferFunds',
  description: 'Transfer native tokens (ETH, BASE, etc.) or ERC20 tokens to a recipient address using Coinbase AgentKit. Secure wallet-based transfers.',
  inputSchema: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient address',
      },
      amount: {
        type: 'string',
        description: 'Amount to transfer (as string, e.g., "1.5" for native tokens or "1000" for ERC20)',
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
      },
      tokenAddress: {
        type: 'string',
        description: 'ERC20 token contract address (optional, omit for native token transfer)',
      },
    },
    required: ['to', 'amount', 'network'],
  },
  toolFunction: 'transferFunds',
};

/**
 * Get transfer funds module tool definition
 */
export function getTransferFundsModule(): ModuleToolDefinition {
  return transferFundsModule;
}

