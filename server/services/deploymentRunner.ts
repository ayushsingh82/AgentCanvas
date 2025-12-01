/**
 * Deployment Runner Service
 * Orchestrates the deployment process: status updates and NullShot agent deployment
 */

import { DeploymentJob } from '../types/deploymentJob';
import { updateJobStatus, saveAgentInfo } from './db';
import { NullShotAgentService } from './nullshotAgent';
import { logger } from './logger';

export class DeploymentRunner {
  private nullshotAgent: NullShotAgentService;

  constructor() {
    this.nullshotAgent = new NullShotAgentService();
  }

  /**
   * Run deployment for a job
   * Orchestrates: updateJobStatus("deploying"), call nullshotAgent.deploy(), updateJobStatus("deployed")
   * 
   * @param job - Deployment job to process
   */
  async runDeployment(job: DeploymentJob): Promise<void> {
    const { jobId } = job;

    try {
      logger.info(`Starting deployment runner for job ${jobId}`);

      // Step 1: Update status to "deploying"
      logger.debug(`Updating job ${jobId} status to "deploying"`);
      const deployingJob = await updateJobStatus(jobId, {
        status: 'deploying',
      });

      if (!deployingJob) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Step 2: Deploy using NullShot agent service
      logger.info(`Deploying agent for job ${jobId}`);
      const deploymentResult = await this.nullshotAgent.deploy(deployingJob);

      // Step 3: Handle deployment result
      if (deploymentResult.success) {
        // Deployment successful - save agent info and update status to "deployed"
        if (!deploymentResult.agentChatURL || !deploymentResult.agentInstanceId || !deploymentResult.workflowVersion) {
          throw new Error('Deployment succeeded but missing required fields');
        }

        logger.info(`Deployment successful for job ${jobId}`, {
          agentChatURL: deploymentResult.agentChatURL,
          agentInstanceId: deploymentResult.agentInstanceId,
        });

        await saveAgentInfo(jobId, {
          agentChatURL: deploymentResult.agentChatURL,
          agentInstanceId: deploymentResult.agentInstanceId,
          workflowVersion: deploymentResult.workflowVersion,
        });

        logger.info(`Job ${jobId} marked as deployed`);
        
        // Also update the main Agent document in the project database
        if (job.agentId) {
          try {
            const mongoose = require('mongoose');
            const AgentSchema = new mongoose.Schema({}, { strict: false });
            const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
            
            const updated = await Agent.findByIdAndUpdate(
              job.agentId,
              {
                $set: {
                  status: 'deployed',
                  agentChatURL: deploymentResult.agentChatURL,
                  workflow: job.workflowJSON,
                  deployedAt: new Date(),
                },
              },
              { new: true }
            );
            
            if (updated) {
              logger.info(`✅ Updated main Agent document ${job.agentId} for job ${jobId}`);
              logger.info(`   Status: deployed, URL: ${deploymentResult.agentChatURL}`);
            } else {
              logger.warn(`⚠️ Agent document ${job.agentId} not found - could not update`);
            }
          } catch (updateError) {
            logger.error(`❌ Could not update main Agent document: ${updateError}`);
            if (updateError instanceof Error) {
              logger.error(`   Error: ${updateError.message}`);
            }
          }
        } else {
          logger.warn(`⚠️ Job ${jobId} has no agentId - cannot update Agent document`);
        }
      } else {
        // Deployment failed - update status to "failed" with error message
        const errorMsg = deploymentResult.error || 'Unknown deployment error';
        logger.error(`❌ Deployment failed for job ${jobId}:`, errorMsg);
        logger.error(`Full error details:`, JSON.stringify(deploymentResult, null, 2));

        await updateJobStatus(jobId, {
          status: 'failed',
          errorMessage: errorMsg,
        });

        logger.info(`Job ${jobId} marked as failed`);
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during deployment';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`❌ Unexpected error during deployment for job ${jobId}:`, errorMessage);
      if (errorStack) {
        logger.error(`Error stack:`, errorStack);
      }

      try {
        await updateJobStatus(jobId, {
          status: 'failed',
          errorMessage: `${errorMessage}${errorStack ? '\n' + errorStack : ''}`,
        });
      } catch (updateError) {
        logger.error(`Failed to update job ${jobId} status after error:`, updateError);
      }
    }
  }
}

