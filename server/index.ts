/**
 * Deployment Server
 * Main entry point for the long-running Node.js deployment server
 * Polls MongoDB every 5 seconds for pending deployment jobs and processes them
 */

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

    try {
      // Connect to database
      await connectDB();
      logger.info('✅ Database connected');

      // Start polling loop
      this.isRunning = true;
      this.startPolling();

      logger.info(`✅ Deployment server started. Polling every ${POLL_INTERVAL / 1000} seconds`);
      logger.info(`📊 Max concurrent deployments: ${MAX_CONCURRENT_DEPLOYMENTS}`);

      // Handle graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to start deployment server:', error);
      process.exit(1);
    }
  }

  /**
   * Start polling loop for pending jobs
   */
  private startPolling(): void {
    // Poll immediately on start
    this.poll();

    // Then poll every interval
    this.pollTimer = setInterval(() => {
      this.poll();
    }, POLL_INTERVAL);
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

      // Get pending jobs
      const pendingJobs = await getPendingJobs();
      
      if (pendingJobs.length === 0) {
        logger.debug('No pending jobs found');
        return;
      }

      logger.info(`Found ${pendingJobs.length} pending job(s)`);

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
   */
  private async processJob(job: DeploymentJob): Promise<void> {
    const { jobId } = job;

    // Mark as active
    this.activeDeployments.add(jobId);
    logger.info(`Processing job ${jobId} (${this.activeDeployments.size}/${MAX_CONCURRENT_DEPLOYMENTS} active)`);

    try {
      // Run deployment
      await this.deploymentRunner.runDeployment(job);
    } catch (error) {
      logger.error(`Error processing job ${jobId}:`, error);
    } finally {
      // Remove from active set
      this.activeDeployments.delete(jobId);
      logger.debug(`Job ${jobId} completed. Active deployments: ${this.activeDeployments.size}`);
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

