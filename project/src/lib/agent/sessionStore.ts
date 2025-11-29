/**
 * Session Store
 * Manages agent sessions using file-based storage (can be replaced with Vercel KV)
 */

import { AgentSession, ChatMessage } from '@/types/agent';
import { promises as fs } from 'fs';
import path from 'path';

// In-memory store for development (will be replaced with Vercel KV in production)
const sessionStore = new Map<string, AgentSession>();
const chatHistoryStore = new Map<string, ChatMessage[]>();

// File-based storage path (for serverless, use Vercel KV instead)
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
 * Get session file path
 */
function getSessionFilePath(sessionId: string): string {
  return path.join(STORAGE_DIR, `session-${sessionId}.json`);
}

/**
 * Get chat history file path
 */
function getChatHistoryFilePath(sessionId: string): string {
  return path.join(STORAGE_DIR, `chat-${sessionId}.json`);
}

/**
 * Save session to file (fallback for serverless)
 * Note: In production, use Vercel KV instead
 */
async function saveSessionToFile(session: AgentSession) {
  try {
    await ensureStorageDir();
    const filePath = getSessionFilePath(session.sessionId);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2));
  } catch (error) {
    console.error('Failed to save session to file:', error);
    // Fallback to in-memory store
    sessionStore.set(session.sessionId, session);
  }
}

/**
 * Load session from file
 */
async function loadSessionFromFile(sessionId: string): Promise<AgentSession | null> {
  try {
    const filePath = getSessionFilePath(sessionId);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Try in-memory store
    return sessionStore.get(sessionId) || null;
  }
}

/**
 * Save chat history to file
 */
async function saveChatHistoryToFile(sessionId: string, messages: ChatMessage[]) {
  try {
    await ensureStorageDir();
    const filePath = getChatHistoryFilePath(sessionId);
    await fs.writeFile(filePath, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Failed to save chat history to file:', error);
    // Fallback to in-memory store
    chatHistoryStore.set(sessionId, messages);
  }
}

/**
 * Load chat history from file
 */
async function loadChatHistoryFromFile(sessionId: string): Promise<ChatMessage[]> {
  try {
    const filePath = getChatHistoryFilePath(sessionId);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Try in-memory store
    return chatHistoryStore.get(sessionId) || [];
  }
}

/**
 * Create or update a session
 */
export async function saveSession(session: AgentSession): Promise<void> {
  // In production, use Vercel KV:
  // await kv.set(`session:${session.sessionId}`, session);
  
  // For now, use file-based storage with in-memory fallback
  sessionStore.set(session.sessionId, session);
  await saveSessionToFile(session);
}

/**
 * Get a session by session ID
 */
export async function getSession(sessionId: string): Promise<AgentSession | null> {
  // In production, use Vercel KV:
  // return await kv.get(`session:${sessionId}`);
  
  return await loadSessionFromFile(sessionId);
}

/**
 * Get a session by user ID (returns most recent)
 */
export async function getSessionByUserId(userId: string): Promise<AgentSession | null> {
  // In production, use Vercel KV:
  // const sessions = await kv.get(`user-sessions:${userId}`);
  // return sessions?.[0] || null;
  
  // For file-based, search in-memory store
  for (const session of sessionStore.values()) {
    if (session.userId === userId) {
      return session;
    }
  }
  
  return null;
}

/**
 * Add a chat message to history
 */
export async function addChatMessage(sessionId: string, message: ChatMessage): Promise<void> {
  const history = await loadChatHistoryFromFile(sessionId);
  history.push(message);
  
  // In production, use Vercel KV:
  // await kv.set(`chat:${sessionId}`, history);
  
  chatHistoryStore.set(sessionId, history);
  await saveChatHistoryToFile(sessionId, history);
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  // In production, use Vercel KV:
  // return await kv.get(`chat:${sessionId}`) || [];
  
  return await loadChatHistoryFromFile(sessionId);
}

/**
 * Clear chat history for a session
 */
export async function clearChatHistory(sessionId: string): Promise<void> {
  // In production, use Vercel KV:
  // await kv.delete(`chat:${sessionId}`);
  
  chatHistoryStore.delete(sessionId);
  try {
    const filePath = getChatHistoryFilePath(sessionId);
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, ignore
  }
}

