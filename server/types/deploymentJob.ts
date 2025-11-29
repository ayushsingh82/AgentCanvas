/**
 * Deployment Job Type Definitions
 */

export type DeploymentJobStatus = 'pending' | 'deploying' | 'deployed' | 'failed';

export interface DeploymentJob {
  jobId: string;
  userId: string;
  selectedModules: Array<{
    moduleName: string;
    input?: Record<string, any>;
    order?: number;
  }>;
  workflowJSON: any; // Complete workflow object
  status: DeploymentJobStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Fields set after deployment
  agentChatURL?: string;
  agentInstanceId?: string;
  workflowVersion?: string;
  deployedAt?: Date;
  errorMessage?: string;
}

export interface CreateDeploymentJobRequest {
  userId: string;
  selectedModules: Array<{
    moduleName: string;
    input?: Record<string, any>;
    order?: number;
  }>;
  workflowJSON: any;
}

export interface UpdateJobStatusRequest {
  status: DeploymentJobStatus;
  agentChatURL?: string;
  agentInstanceId?: string;
  workflowVersion?: string;
  deployedAt?: Date;
  errorMessage?: string;
}

