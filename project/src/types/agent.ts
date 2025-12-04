/**
 * Agent type definitions
 */

export interface AgentSession {
  userId: string;
  sessionId: string;
  agentInstanceId?: string;
  agentChatURL?: string;
  createdAt: string;
  lastActivity: string;
  context?: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  agentChatURL?: string;
  error?: string;
}

export interface AgentRunnerConfig {
  userId: string;
  sessionId: string;
  workflow: any;
  mcpTools?: Record<string, any>;
}

/**
 * Agent metadata and configuration
 */
export interface AgentMetadata {
  name: string;
  description?: string;
  tags?: string[];
  walletAddress: string; // User's wallet address
  agentChatURL?: string;
  status: 'draft' | 'deployed' | 'archived';
  apiKeys?: {
    llmKey?: string;
    cloudflareKey?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
}

export interface CreateAgentRequest {
  walletAddress: string;
  name: string;
  description?: string;
  tags?: string[];
  modules: Array<{
    moduleName: string;
    input: Record<string, any>;
    order?: number;
  }>;
  apiKeys?: {
    llmKey?: string;
    cloudflareKey?: string;
    [key: string]: string | undefined;
  };
}
