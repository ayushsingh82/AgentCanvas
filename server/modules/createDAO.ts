/**
 * Create DAO Module
 * Creates and deploys DAO contracts using Coinbase AgentKit
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

export const createDAOModule: ModuleToolDefinition = {
  name: 'createDAO',
  description: 'Create and deploy a new DAO (Decentralized Autonomous Organization) contract on the blockchain. Supports governance, voting, and proposal management.',
  inputSchema: {
    type: 'object',
    properties: {
      daoName: {
        type: 'string',
        description: 'Name of the DAO',
      },
      votingPeriod: {
        type: 'number',
        description: 'Voting period in blocks (default: 1)',
      },
      quorum: {
        type: 'number',
        description: 'Quorum percentage required for proposals (default: 4)',
      },
      network: {
        type: 'string',
        description: 'Blockchain network (e.g., "base-sepolia", "base-mainnet", "ethereum")',
      },
    },
    required: ['daoName', 'network'],
  },
  toolFunction: 'createDAO',
};

/**
 * Get create DAO module tool definition
 */
export function getCreateDAOModule(): ModuleToolDefinition {
  return createDAOModule;
}


