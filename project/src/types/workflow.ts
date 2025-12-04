/**
 * Workflow type definitions
 */

import { ModuleWorkflowSnippet } from './module';

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  tool: string;
  parameters: Record<string, any>;
  next?: string[];
}

export interface WorkflowMetadata {
  userId: string;
  sessionId: string;
  timestamp: string;
  agentId?: string;
  agentChatURL?: string;
}

export interface Workflow {
  metadata: WorkflowMetadata;
  nodes: WorkflowNode[];
  edges?: Array<{
    from: string;
    to: string;
  }>;
  // Tool definitions for agent registration (capabilities, not pre-filled actions)
  tools?: Array<{
    name: string;
    description: string;
    inputSchema: any;
    toolFunction: string;
  }>;
}

export interface WorkflowExecutionResult {
  success: boolean;
  outputs?: Record<string, any>;
  error?: string;
  executionId?: string;
}

