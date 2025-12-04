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
    agentId: {
      type: String,
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
    apiKeys: {
      type: Schema.Types.Mixed,
      default: {},
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
  // Always initialize model first, even if connection exists
  if (!DeploymentJobModel) {
    DeploymentJobModel = (mongoose.models.DeploymentJob as Model<IDeploymentJob>) || 
                          mongoose.model<IDeploymentJob>('DeploymentJob', DeploymentJobSchema);
  }
  
  if (mongoose.connection.readyState === 1) {
    // Ensure model is ready even if connection exists
    if (!DeploymentJobModel) {
      DeploymentJobModel = mongoose.model<IDeploymentJob>('DeploymentJob', DeploymentJobSchema);
    }
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
 * This includes both new jobs and existing jobs that were left in pending state
 * Ordered by creation time (oldest first) - processes oldest jobs first
 */
export async function getPendingJobs(): Promise<DeploymentJob[]> {
  try {
    console.log('🔍 getPendingJobs() called');
    
    // Ensure model is initialized
    if (!DeploymentJobModel) {
      console.log('⚠️ Model not initialized, calling connectDB()...');
      await connectDB();
      console.log('✅ connectDB() completed');
    }
    
    // Double-check model exists
    if (!DeploymentJobModel) {
      console.error('❌ DeploymentJobModel is still not initialized after connectDB()');
      return [];
    }
    
    console.log('✅ Model initialized, querying database...');

    // Get ALL pending jobs, including ones that may have been left pending from previous runs
    const jobs = await DeploymentJobModel.find({ status: 'pending' })
      .sort({ createdAt: 1 }) // Process oldest first
      .lean()
      .exec();
    
    console.log('✅ Query completed, found', jobs.length, 'pending jobs');
    
    // Always check for jobs with other statuses for debugging
    const allJobs = await DeploymentJobModel.find({}).limit(10).sort({ createdAt: -1 }).lean().exec();
    console.log(`📊 Total jobs in database: ${allJobs.length}`);
    allJobs.forEach((j: any) => {
      const age = Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 1000 / 60);
      console.log(`  - ${j.jobId} | Status: ${j.status} | Age: ${age} min | Created: ${j.createdAt}`);
    });
    
    if (jobs.length > 0) {
      console.log(`📋 Found ${jobs.length} pending job(s) ready to process:`, jobs.map((j: any) => j.jobId));
    } else {
      console.log('📋 No pending jobs found - checking for stuck deploying jobs...');
      // Check for jobs stuck in "deploying" state for more than 10 minutes
      const stuckJobs = await DeploymentJobModel.find({ 
        status: 'deploying',
        updatedAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } // Older than 10 minutes
      }).lean().exec();
      
      if (stuckJobs.length > 0) {
        console.log(`⚠️ Found ${stuckJobs.length} potentially stuck deploying job(s):`);
        stuckJobs.forEach((j: any) => {
          const stuckFor = Math.floor((Date.now() - new Date(j.updatedAt).getTime()) / 1000 / 60);
          console.log(`  - ${j.jobId} | Stuck for: ${stuckFor} min | Updated: ${j.updatedAt}`);
        });
        // Return stuck jobs so they can be retried (they'll be reset to pending in processJob)
        const stuckJobsMapped = stuckJobs.map((j: any) => ({
          jobId: j.jobId,
          userId: j.userId,
          agentId: j.agentId,
          selectedModules: j.selectedModules,
          workflowJSON: j.workflowJSON,
          apiKeys: j.apiKeys || {},
          status: j.status as DeploymentJobStatus,
          createdAt: j.createdAt,
          updatedAt: j.updatedAt,
          agentChatURL: j.agentChatURL,
          agentInstanceId: j.agentInstanceId,
          workflowVersion: j.workflowVersion,
          deployedAt: j.deployedAt,
          errorMessage: j.errorMessage,
        }));
        // Return both pending and stuck jobs
        return [...jobs.map(job => ({
          jobId: job.jobId,
          userId: job.userId,
          agentId: job.agentId,
          selectedModules: job.selectedModules,
          workflowJSON: job.workflowJSON,
          apiKeys: job.apiKeys || {},
          status: job.status as DeploymentJobStatus,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          agentChatURL: job.agentChatURL,
          agentInstanceId: job.agentInstanceId,
          workflowVersion: job.workflowVersion,
          deployedAt: job.deployedAt,
          errorMessage: job.errorMessage,
        })), ...stuckJobsMapped];
      }
    }
    
    return jobs.map(job => ({
      jobId: job.jobId,
      userId: job.userId,
      agentId: job.agentId,
      selectedModules: job.selectedModules,
      workflowJSON: job.workflowJSON,
      apiKeys: job.apiKeys || {},
      status: job.status as DeploymentJobStatus,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      agentChatURL: job.agentChatURL,
      agentInstanceId: job.agentInstanceId,
      workflowVersion: job.workflowVersion,
      deployedAt: job.deployedAt,
      errorMessage: job.errorMessage,
    }));
  } catch (error) {
    console.error('❌ Error fetching pending jobs:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
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
    agentId: updated.agentId,
    selectedModules: updated.selectedModules,
    workflowJSON: updated.workflowJSON,
    apiKeys: updated.apiKeys || {},
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

