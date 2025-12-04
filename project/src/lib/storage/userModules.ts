/**
 * User Modules Storage
 * Manages storage of user-selected modules
 */

import { SavedUserModules, UserModuleSelection } from '@/types/module';
import { promises as fs } from 'fs';
import path from 'path';

// In-memory store for development
const userModulesStore = new Map<string, SavedUserModules>();

// File-based storage path
const STORAGE_DIR = path.join(process.cwd(), '.data');

/**
 * Initialize storage directory
 */
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }
}

/**
 * Get user modules file path
 */
function getUserModulesFilePath(userId: string): string {
  return path.join(STORAGE_DIR, `user-modules-${userId}.json`);
}

/**
 * Save user modules
 */
export async function saveUserModules(
  userId: string,
  modules: UserModuleSelection[]
): Promise<void> {
  // In production, use Vercel KV:
  // await kv.set(`user-modules:${userId}`, { userId, modules, ... });
  
  const now = new Date().toISOString();
  const existing = await getUserModules(userId);
  
  const userModules: SavedUserModules = {
    userId,
    modules,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  
  // Save to in-memory store
  userModulesStore.set(userId, userModules);
  
  // Save to file
  try {
    await ensureStorageDir();
    const filePath = getUserModulesFilePath(userId);
    await fs.writeFile(filePath, JSON.stringify(userModules, null, 2));
  } catch (error) {
    console.error('Failed to save user modules to file:', error);
  }
}

/**
 * Get user modules
 */
export async function getUserModules(userId: string): Promise<SavedUserModules | null> {
  // In production, use Vercel KV:
  // return await kv.get(`user-modules:${userId}`);
  
  // Try in-memory store first
  if (userModulesStore.has(userId)) {
    return userModulesStore.get(userId) || null;
  }
  
  // Try file-based storage
  try {
    const filePath = getUserModulesFilePath(userId);
    const data = await fs.readFile(filePath, 'utf-8');
    const userModules = JSON.parse(data) as SavedUserModules;
    userModulesStore.set(userId, userModules);
    return userModules;
  } catch (error) {
    return null;
  }
}

