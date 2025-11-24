// Best Practices Examples for Analytics Engine

// ✅ Good: Use consistent dimension names and optimize for queries
const standardDimensions = {
  userId: message.userId,
  agentId: 'my-agent',
  environment: 'production',
  version: '1.0.0'
};

// ✅ Good: Batch data points for better performance
const dataPoints = messages.map(msg => ({
  dimensions: {
    ...standardDimensions,
    messageType: detectType(msg.content)
  },
  metrics: {
    processing_time: msg.processingTime,
    tokens_used: msg.tokensUsed
  }
}));
await analytics.writeDataPoints('agent_metrics', dataPoints);

// ✅ Good: Handle analytics failures gracefully
async function safeWriteMetrics(analytics: Analytics, dataset: string, data: AnalyticsDataPoint) {
  try {
    await analytics.writeDataPoint(dataset, data);
  } catch (error) {
    console.error('Analytics write failed:', error);
    // Don't fail the main operation
  }
}

// ✅ Good: Retry logic for transient failures
async function writeMetricsWithRetry(analytics: Analytics, dataset: string, data: AnalyticsDataPoint) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await analytics.writeDataPoint(dataset, data);
      return; // Success
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`Analytics write failed after ${maxRetries} attempts:`, error);
        return; // Give up gracefully
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// ✅ Good: Use time range filters and appropriate aggregations
const optimizedQuery = `
  SELECT 
    agentId,
    toStartOfHour(timestamp) as hour,
    COUNT(*) as message_count,
    AVG(processing_time) as avg_processing_time
  FROM agent_metrics 
  WHERE timestamp >= ${startTime} 
    AND timestamp <= ${endTime}
    AND agentId IN ('agent1', 'agent2') -- Filter early
  GROUP BY agentId, hour
  ORDER BY hour ASC
  LIMIT 1000
`;

// ✅ Good: Validate data before writing
async function validateAndWrite(analytics: Analytics, dataset: string, data: AnalyticsDataPoint) {
  // Check required fields
  if (!data.dimensions?.agentId) {
    console.warn('Missing required agentId dimension');
    return;
  }
  
  // Validate dimension cardinality
  if (Object.keys(data.dimensions).length > 20) {
    console.warn('Too many dimensions, truncating');
    data.dimensions = Object.fromEntries(
      Object.entries(data.dimensions).slice(0, 20)
    );
  }
  
  await safeWriteMetrics(analytics, dataset, data);
}

