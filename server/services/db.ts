/**
 * Database Service
 * Handles MongoDB operations for deployment jobs
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { DeploymentJob, DeploymentJobStatus, UpdateJobStatusRequest } from '../types/deploymentJob';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

// Deployment Job MongoDB Model
export interface IDeploymentJob extends Document {
  jobId: string;
  userId: string;
  selectedModules: Array<{
    moduleName: string;
    input?: Record<string, any>;
    order?: number;
  }>;
  workflowJSON: any;
  status: DeploymentJobStatus;
  createdAt: Date;
  updatedAt: Date;
  agentChatURL?: string;
  agentInstanceId?: string;
  workflowVersion?: string;
  deployedAt?: Date;
  errorMessage?: string;
}

const DeploymentJobSchema = new Schema<IDeploymentJob>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    selectedModules: {
      type: [
        {
          moduleName: { type: String, required: true },
          input: { type: Schema.Types.Mixed, default: {} },
          order: { type: Number },
        },
      ],
      required: true,
    },
    workflowJSON: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'deploying', 'deployed', 'failed'],
      default: 'pending',
      index: true,
    },
    agentChatURL: {
      type: String,
    },
    agentInstanceId: {
      type: String,
    },
    workflowVersion: {
      type: String,
    },
    deployedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster pending job queries
DeploymentJobSchema.index({ status: 1, createdAt: 1 });

let DeploymentJobModel: Model<IDeploymentJob>;

/**
 * Initialize database connection
 */
export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  try {
    await mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB');
    
    // Initialize model
    DeploymentJobModel = mongoose.models.DeploymentJob || 
      mongoose.model<IDeploymentJob>('DeploymentJob', DeploymentJobSchema);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get all pending deployment jobs
 * Ordered by creation time (oldest first)
 */
export async function getPendingJobs(): Promise<DeploymentJob[]> {
  if (!DeploymentJobModel) {
    await connectDB();
  }

  const jobs = await DeploymentJobModel.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .lean()
    .exec();

  return jobs.map(job => ({
    jobId: job.jobId,
    userId: job.userId,
    selectedModules: job.selectedModules,
    workflowJSON: job.workflowJSON,
    status: job.status as DeploymentJobStatus,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    agentChatURL: job.agentChatURL,
    agentInstanceId: job.agentInstanceId,
    workflowVersion: job.workflowVersion,
    deployedAt: job.deployedAt,
    errorMessage: job.errorMessage,
  }));
}

/**
 * Update deployment job status
 */
export async function updateJobStatus(
  jobId: string,
  updates: UpdateJobStatusRequest
): Promise<DeploymentJob | null> {
  if (!DeploymentJobModel) {
    await connectDB();
  }

  const updateData: any = {
    status: updates.status,
    updatedAt: new Date(),
  };

  if (updates.agentChatURL !== undefined) {
    updateData.agentChatURL = updates.agentChatURL;
  }

  if (updates.agentInstanceId !== undefined) {
    updateData.agentInstanceId = updates.agentInstanceId;
  }

  if (updates.workflowVersion !== undefined) {
    updateData.workflowVersion = updates.workflowVersion;
  }

  if (updates.deployedAt !== undefined) {
    updateData.deployedAt = updates.deployedAt;
  }

  if (updates.errorMessage !== undefined) {
    updateData.errorMessage = updates.errorMessage;
  }

  const updated = await DeploymentJobModel.findOneAndUpdate(
    { jobId },
    { $set: updateData },
    { new: true }
  ).lean().exec();

  if (!updated) {
    return null;
  }

  return {
    jobId: updated.jobId,
    userId: updated.userId,
    selectedModules: updated.selectedModules,
    workflowJSON: updated.workflowJSON,
    status: updated.status as DeploymentJobStatus,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    agentChatURL: updated.agentChatURL,
    agentInstanceId: updated.agentInstanceId,
    workflowVersion: updated.workflowVersion,
    deployedAt: updated.deployedAt,
    errorMessage: updated.errorMessage,
  };
}

/**
 * Save agent deployment information
 * Alias for updateJobStatus with deployed status
 */
export async function saveAgentInfo(
  jobId: string,
  agentInfo: {
    agentChatURL: string;
    agentInstanceId: string;
    workflowVersion: string;
  }
): Promise<DeploymentJob | null> {
  return await updateJobStatus(jobId, {
    status: 'deployed',
    agentChatURL: agentInfo.agentChatURL,
    agentInstanceId: agentInfo.agentInstanceId,
    workflowVersion: agentInfo.workflowVersion,
    deployedAt: new Date(),
  });
}

