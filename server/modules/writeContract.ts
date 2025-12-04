/**
 * Write Contract Module
 * Writes data to smart contracts (sends transactions) using Coinbase AgentKit
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

export const writeContractModule: ModuleToolDefinition = {
  name: 'writeContract',
  description: 'Write data to a smart contract by sending a transaction using Coinbase AgentKit. Executes state-changing functions.',
  inputSchema: {
    type: 'object',
    properties: {
      contractAddress: {
        type: 'string',
        description: 'Address of the contract to write to',
      },
      functionName: {
        type: 'string',
        description: 'Name of the function to call (must be a state-changing function)',
      },
      args: {
        type: 'array',
        description: 'Arguments to pass to the function',
        items: {},
      },
      abi: {
        type: 'array',
        description: 'Contract ABI (Application Binary Interface) as JSON array',
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
      },
      value: {
        type: 'string',
        description: 'Amount of native token to send with transaction (optional, e.g., "0.1")',
      },
    },
    required: ['contractAddress', 'functionName', 'args', 'abi', 'network'],
  },
  toolFunction: 'writeContract',
};

/**
 * Get write contract module tool definition
 */
export function getWriteContractModule(): ModuleToolDefinition {
  return writeContractModule;
}

