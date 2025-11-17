import type { Node } from 'reactflow';

export interface NodeData {
  label?: string;
  description?: string;
  config?: Record<string, any>;
}

export type WorkflowNode = Node<NodeData>;

