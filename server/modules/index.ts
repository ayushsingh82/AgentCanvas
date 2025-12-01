/**
 * Module Registry
 * Central registry for all available modules
 */

import { getHelloModule, ModuleToolDefinition } from './hello';
import { getTokenFactoryModule } from './tokenFactory';

// Registry of all available modules
const moduleRegistry: Record<string, () => ModuleToolDefinition> = {
  hello: getHelloModule,
  tokenFactory: getTokenFactoryModule,
  // Add more modules here as they are created
  // nftFactory: getNftFactoryModule,
  // etc.
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

