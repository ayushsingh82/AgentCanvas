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
      } else {
        // Deployment failed - update status to "failed" with error message
        logger.error(`Deployment failed for job ${jobId}:`, deploymentResult.error);

        await updateJobStatus(jobId, {
          status: 'failed',
          errorMessage: deploymentResult.error || 'Unknown deployment error',
        });

        logger.info(`Job ${jobId} marked as failed`);
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during deployment';
      logger.error(`Unexpected error during deployment for job ${jobId}:`, errorMessage);

      try {
        await updateJobStatus(jobId, {
          status: 'failed',
          errorMessage: errorMessage,
        });
      } catch (updateError) {
        logger.error(`Failed to update job ${jobId} status after error:`, updateError);
      }
    }
  }
}

