/**
 * Module Registry
 * Central registry for all available modules
 */

import { getHelloModule, ModuleToolDefinition } from './hello';
import { getTokenFactoryModule } from './tokenFactory';
import { getCreateTokenModule } from './createToken';
import { getCreateNFTModule } from './createNFT';
import { getCreateDAOModule } from './createDAO';
import { getMakeTransactionModule } from './makeTransaction';
import { getAirdropModule } from './airdrop';
import { getTransferFundsModule } from './transferFunds';
import { getDeployContractModule } from './deployContract';
import { getReadContractModule } from './readContract';
import { getWriteContractModule } from './writeContract';

// Registry of all available modules
const moduleRegistry: Record<string, () => ModuleToolDefinition> = {
  hello: getHelloModule,
  tokenFactory: getTokenFactoryModule,
  createToken: getCreateTokenModule,
  createNFT: getCreateNFTModule,
  createDAO: getCreateDAOModule,
  makeTransaction: getMakeTransactionModule,
  airdrop: getAirdropModule,
  transferFunds: getTransferFundsModule,
  deployContract: getDeployContractModule,
  readContract: getReadContractModule,
  writeContract: getWriteContractModule,
};

/**
 * Get all available modules
 */
export function getAllModules(): ModuleToolDefinition[] {
  return Object.values(moduleRegistry).map(getter => getter());
}

/**
 * Get a module by name
 */
export function getModule(name: string): ModuleToolDefinition | undefined {
  const getter = moduleRegistry[name];
  return getter ? getter() : undefined;
}

/**
 * Get module names
 */
export function getModuleNames(): string[] {
  return Object.keys(moduleRegistry);
}

export default moduleRegistry;

