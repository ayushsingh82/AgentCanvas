/**
 * Deployment Server
 * Main entry point for the long-running Node.js deployment server
 * Polls MongoDB every 5 seconds for pending deployment jobs and processes them
 */

// Load environment variables from .env file
import 'dotenv/config';

import { connectDB, getPendingJobs } from './services/db';
import { DeploymentRunner } from './services/deploymentRunner';
import { logger } from './services/logger';
import { DeploymentJob } from './types/deploymentJob';

// Polling interval in milliseconds (5 seconds)
const POLL_INTERVAL = 5000;

// Maximum concurrent deployments
const MAX_CONCURRENT_DEPLOYMENTS = 5;

class DeploymentServer {
  private deploymentRunner: DeploymentRunner;
  private isRunning: boolean = false;
  private activeDeployments: Set<string> = new Set();
  private pollTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.deploymentRunner = new DeploymentRunner();
  }

  /**
   * Start the deployment server
   */
  async start(): Promise<void> {
    logger.info('🚀 Starting Deployment Server...');
    logger.info(`📅 Server start time: ${new Date().toISOString()}`);

    try {
      // Connect to database
      logger.info('🔌 Connecting to MongoDB...');
      await connectDB();
      logger.info('✅ Database connected successfully');

      // Start polling loop
      this.isRunning = true;
      this.startPolling();

      logger.info(`✅ Deployment server started. Polling every ${POLL_INTERVAL / 1000} seconds`);
      logger.info(`📊 Max concurrent deployments: ${MAX_CONCURRENT_DEPLOYMENTS}`);
      logger.info('👂 Listening for deployment jobs...');

      // Handle graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to start deployment server:', error);
      if (error instanceof Error) {
        logger.error('Error message:', error.message);
        logger.error('Error stack:', error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Start polling loop for pending jobs
   */
  private startPolling(): void {
    logger.info('🔄 Starting polling loop...');
    
    // Check for existing pending jobs on startup (with a small delay to ensure DB is ready)
    setTimeout(() => {
      logger.info('🔍 Checking for existing pending jobs on startup...');
      this.poll();
    }, 1000);

    // Then poll every interval
    this.pollTimer = setInterval(() => {
      this.poll();
    }, POLL_INTERVAL);
    
    logger.info(`⏰ Polling every ${POLL_INTERVAL / 1000} seconds`);
  }

  /**
   * Poll for pending jobs and process them
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Check if we can process more jobs
      if (this.activeDeployments.size >= MAX_CONCURRENT_DEPLOYMENTS) {
        logger.debug(`Max concurrent deployments reached (${this.activeDeployments.size}/${MAX_CONCURRENT_DEPLOYMENTS}). Skipping poll.`);
        return;
      }

      // Get pending jobs (including any existing ones from previous runs)
      logger.debug('Querying database for pending jobs...');
      const pendingJobs = await getPendingJobs();
      logger.debug(`Query completed. Found ${pendingJobs.length} pending job(s)`);
      
      if (pendingJobs.length === 0) {
        return;
      }

      logger.info(`🔍 Found ${pendingJobs.length} pending job(s) (including existing):`, pendingJobs.map(j => `${j.jobId} (created: ${new Date(j.createdAt).toISOString()})`));

      // Process jobs (up to max concurrent)
      const availableSlots = MAX_CONCURRENT_DEPLOYMENTS - this.activeDeployments.size;
      const jobsToProcess = pendingJobs.slice(0, availableSlots);

      for (const job of jobsToProcess) {
        // Skip if already processing
        if (this.activeDeployments.has(job.jobId)) {
          continue;
        }

        // Process job asynchronously
        this.processJob(job);
      }
    } catch (error) {
      logger.error('Error during polling:', error);
    }
  }

  /**
   * Process a single deployment job
   * Handles both new jobs and existing pending jobs from previous runs
   * Also handles stuck "deploying" jobs that need to be retried
   */
  private async processJob(job: DeploymentJob): Promise<void> {
    const { jobId, createdAt, status } = job;
    const jobAge = Date.now() - new Date(createdAt).getTime();
    const jobAgeMinutes = Math.floor(jobAge / 60000);

    // If job is stuck in "deploying", reset it to "pending" first
    if (status === 'deploying') {
      logger.warn(`⚠️ Job ${jobId} is stuck in 'deploying' status. Resetting to 'pending' for retry...`);
      try {
        const { updateJobStatus } = await import('./services/db');
        await updateJobStatus(jobId, { status: 'pending' });
        logger.info(`✅ Job ${jobId} reset to 'pending' status`);
        // Update job object
        job.status = 'pending';
      } catch (error) {
        logger.error(`❌ Failed to reset job ${jobId} status:`, error);
        return;
      }
    }

    // Mark as active
    this.activeDeployments.add(jobId);
    
    if (jobAgeMinutes > 0) {
      logger.info(`🔄 Processing job ${jobId} (age: ${jobAgeMinutes} min, ${this.activeDeployments.size}/${MAX_CONCURRENT_DEPLOYMENTS} active)`);
    } else {
      logger.info(`🚀 Processing new job ${jobId} (${this.activeDeployments.size}/${MAX_CONCURRENT_DEPLOYMENTS} active)`);
    }

    try {
      // Run deployment
      await this.deploymentRunner.runDeployment(job);
    } catch (error) {
      logger.error(`❌ Error processing job ${jobId}:`, error);
      if (error instanceof Error) {
        logger.error(`Error details: ${error.message}`);
        logger.error(`Stack: ${error.stack}`);
      }
    } finally {
      // Remove from active set
      this.activeDeployments.delete(jobId);
      logger.info(`✅ Job ${jobId} completed. Active deployments: ${this.activeDeployments.size}`);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      this.isRunning = false;

      // Stop polling
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }

      // Wait for active deployments to complete
      if (this.activeDeployments.size > 0) {
        logger.info(`Waiting for ${this.activeDeployments.size} active deployment(s) to complete...`);
        
        // Wait up to 30 seconds for deployments to complete
        const maxWaitTime = 30000;
        const startTime = Date.now();
        
        while (this.activeDeployments.size > 0 && (Date.now() - startTime) < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (this.activeDeployments.size > 0) {
          logger.warn(`Forcefully shutting down with ${this.activeDeployments.size} active deployment(s)`);
        }
      }

      // Close database connection
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('✅ Database connection closed');
      } catch (error) {
        logger.error('Error closing database connection:', error);
      }

      logger.info('✅ Deployment server stopped');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Stop the deployment server
   */
  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

// Start the server
const server = new DeploymentServer();
server.start().catch((error) => {
  logger.error('Fatal error starting server:', error);
  process.exit(1);
});

