/**
 * Deploy Contract Module
 * Deploys custom smart contracts using Coinbase AgentKit
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

export const deployContractModule: ModuleToolDefinition = {
  name: 'deployContract',
  description: 'Deploy a custom smart contract to the blockchain using Coinbase AgentKit. Supports any Solidity contract bytecode.',
  inputSchema: {
    type: 'object',
    properties: {
      bytecode: {
        type: 'string',
        description: 'Compiled contract bytecode (0x prefixed hex string)',
      },
      abi: {
        type: 'array',
        description: 'Contract ABI (Application Binary Interface) as JSON array',
      },
      constructorArgs: {
        type: 'array',
        description: 'Constructor arguments for the contract (optional)',
        items: {},
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
      },
    },
    required: ['bytecode', 'abi', 'network'],
  },
  toolFunction: 'deployContract',
};

/**
 * Get deploy contract module tool definition
 */
export function getDeployContractModule(): ModuleToolDefinition {
  return deployContractModule;
}

