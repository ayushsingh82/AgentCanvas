// Agent that tracks its own performance metrics
export async function processMessage(
  sessionId: string, messages: AIUISDKMessage,
  platform: PlatformServices
): Promise<AgentResponse> {
  const { analytics, memoryStore } = platform;
  const startTime = Date.now();
  
  try {
    // Step 1: Track incoming message metrics
    await analytics.writeDataPoint('agent_metrics', {
      dimensions: {
        agentId: 'performance-monitor',
        userId: message.userId,
        messageType: detectMessageType(message.content), // "question", "command", "chat"
        source: message.metadata?.source || 'unknown'
      },
      metrics: {
        messages_received: 1,
        message_length: message.content.length
      }
    });
    
    // Step 2: Process the message (business logic)
    const response = await generateResponse(message.content);
    const processingTime = Date.now() - startTime;
    
    // Step 3: Track successful response metrics
    await analytics.writeDataPoint('agent_metrics', {
      dimensions: {
        agentId: 'performance-monitor',
        userId: message.userId,
        messageType: detectMessageType(message.content),
        success: 'true'
      },
      metrics: {
        responses_generated: 1,
        processing_time_ms: processingTime,
        response_length: response.length,
        tokens_consumed: await estimateTokens(message.content + response)
      }
    });
    
    // Step 4: Track user satisfaction if feedback provided
    if (message.metadata?.feedback) {
      await analytics.writeDataPoint('user_satisfaction', {
        dimensions: {
          agentId: 'performance-monitor',
          userId: message.userId,
          rating: message.metadata.feedback.rating.toString() // "1-5"
        },
        metrics: {
          satisfaction_score: message.metadata.feedback.rating,
          feedback_count: 1
        }
      });
    }
    
    return { message: response };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Step 5: Track error metrics for debugging
    await analytics.writeDataPoint('agent_metrics', {
      dimensions: {
        agentId: 'performance-monitor',
        userId: message.userId,
        messageType: detectMessageType(message.content),
        success: 'false',
        error_type: error.name || 'unknown' // "TimeoutError", "ValidationError", etc.
      },
      metrics: {
        errors_count: 1,
        processing_time_ms: processingTime
      }
    });
    
    throw error;
  }
}

// Analytics dashboard query agent
export async function generatePerformanceReport(
  timeRange: { start: number; end: number },
  platform: PlatformServices
): Promise<PerformanceReport> {
  const { analytics } = platform;
  
  // Query 1: Get overall performance metrics
  const performanceQuery = `
    SELECT 
      agentId,
      COUNT(*) as total_messages,
      AVG(processing_time_ms) as avg_processing_time,
      SUM(CASE WHEN success = 'true' THEN 1 ELSE 0 END) as successful_messages,
      SUM(CASE WHEN success = 'false' THEN 1 ELSE 0 END) as failed_messages,
      AVG(tokens_consumed) as avg_tokens
    FROM agent_metrics 
    WHERE timestamp >= ${timeRange.start} AND timestamp <= ${timeRange.end}
    GROUP BY agentId
    ORDER BY total_messages DESC
  `;
  
  const performance = await analytics.query(performanceQuery);
  
  // Query 2: Get hourly message trends
  const trendsQuery = `
    SELECT 
      agentId,
      toStartOfHour(timestamp) as hour,
      COUNT(*) as messages_count,
      AVG(processing_time_ms) as avg_processing_time
    FROM agent_metrics 
    WHERE timestamp >= ${timeRange.start} AND timestamp <= ${timeRange.end}
    GROUP BY agentId, hour
    ORDER BY hour ASC
  `;
  
  const trends = await analytics.query(trendsQuery);
  
  // Query 3: Get user satisfaction scores
  const satisfactionQuery = `
    SELECT 
      agentId,
      AVG(satisfaction_score) as avg_satisfaction,
      COUNT(*) as feedback_count
    FROM user_satisfaction 
    WHERE timestamp >= ${timeRange.start} AND timestamp <= ${timeRange.end}
    GROUP BY agentId
  `;
  
  const satisfaction = await analytics.query(satisfactionQuery);
  
  return {
    performance: performance.data,
    trends: trends.data,
    satisfaction: satisfaction.data,
    generatedAt: Date.now()
  };
}

