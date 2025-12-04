/**
 * DAO Factory Module
 * Allows users to create decentralized autonomous organizations
 */

import { Module, ToolDefinition } from '@/types/module';

const daoFactory: Module = {
  name: 'daoFactory',
  description: 'Create and deploy DAOs with governance tokens and voting mechanisms',
  inputSchema: {
    type: 'object',
    properties: {
      daoName: {
        type: 'string',
        description: 'Name of the DAO',
        required: true,
      },
      governanceToken: {
        type: 'string',
        description: 'Address of governance token (optional, will create if not provided)',
        required: false,
      },
      votingPeriod: {
        type: 'number',
        description: 'Voting period in blocks',
        required: true,
      },
      quorum: {
        type: 'string',
        description: 'Quorum percentage (e.g., "4" for 4%)',
        required: true,
      },
      network: {
        type: 'string',
        description: 'Blockchain network',
        required: true,
      },
    },
    required: ['daoName', 'votingPeriod', 'quorum', 'network'],
  },
  workflowSnippet: {
    id: 'dao-factory-1',
    type: 'tool',
    name: 'Create DAO',
    tool: 'daoFactory_create',
    parameters: {},
  },
  validateInput: (input: Record<string, any>) => {
    const errors: string[] = [];
    
    if (!input.daoName || typeof input.daoName !== 'string') {
      errors.push('DAO name is required and must be a string');
    }
    
    if (!input.votingPeriod || typeof input.votingPeriod !== 'number' || input.votingPeriod <= 0) {
      errors.push('Voting period is required and must be a positive number');
    }
    
    if (!input.quorum || typeof input.quorum !== 'string') {
      errors.push('Quorum is required and must be a string');
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
      id: `dao-factory-${Date.now()}`,
      type: 'tool',
      name: `Create DAO: ${input.daoName}`,
      tool: 'daoFactory_create',
      parameters: {
        daoName: input.daoName,
        governanceToken: input.governanceToken || null,
        votingPeriod: input.votingPeriod,
        quorum: input.quorum,
        network: input.network,
      },
    };
  },
  getToolDefinition: (): ToolDefinition => {
    return {
      name: 'daoFactory_create',
      description: 'Create and deploy a DAO with governance tokens and voting mechanisms',
      inputSchema: daoFactory.inputSchema,
      toolFunction: 'daoFactory_create',
    };
  },
};

export default daoFactory;

