/**
 * Module Registry
 * Central registry for all available modules
 */

import { Module } from '@/types/module';
import tokenFactory from './tokenFactory';
import nftFactory from './nftFactory';
import daoFactory from './daoFactory';
import fundTransfer from './fundTransfer';
import airdrop from './airdrop';
import marketplace from './marketplace';
import hello from './hello';

// Registry of all available modules
const moduleRegistry: Record<string, Module> = {
  hello, // Test module - simple greeting for deployment testing
  tokenFactory,
  nftFactory,
  daoFactory,
  fundTransfer,
  airdrop,
  marketplace,
};

/**
 * Get all available modules
 */
export function getAllModules(): Module[] {
  return Object.values(moduleRegistry);
}

/**
 * Get a module by name
 */
export function getModule(name: string): Module | undefined {
  return moduleRegistry[name];
}

/**
 * Get module metadata (without implementation details)
 */
export function getModuleMetadata(name: string) {
  const module = moduleRegistry[name];
  if (!module) return undefined;
  
  return {
    name: module.name,
    description: module.description,
    inputSchema: module.inputSchema,
  };
}

/**
 * Get all module metadata
 */
export function getAllModuleMetadata() {
  return getAllModules().map(module => ({
    name: module.name,
    description: module.description,
    inputSchema: module.inputSchema,
  }));
}

export default moduleRegistry;

