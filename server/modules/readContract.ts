/**
 * Read Contract Module
 * Reads data from smart contracts using Coinbase AgentKit
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

export const readContractModule: ModuleToolDefinition = {
  name: 'readContract',
  description: 'Read data from a smart contract using Coinbase AgentKit. Calls view/pure functions without sending transactions.',
  inputSchema: {
    type: 'object',
    properties: {
      contractAddress: {
        type: 'string',
        description: 'Address of the contract to read from',
      },
      functionName: {
        type: 'string',
        description: 'Name of the function to call (must be a view or pure function)',
      },
      args: {
        type: 'array',
        description: 'Arguments to pass to the function (optional)',
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
    },
    required: ['contractAddress', 'functionName', 'abi', 'network'],
  },
  toolFunction: 'readContract',
};

/**
 * Get read contract module tool definition
 */
export function getReadContractModule(): ModuleToolDefinition {
  return readContractModule;
}

