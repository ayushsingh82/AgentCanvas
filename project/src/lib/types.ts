import type { Node } from 'reactflow';

export interface NodeData {
  label?: string;
  description?: string;
  config?: Record<string, unknown>;
}

export type WorkflowNode = Node<NodeData>;

