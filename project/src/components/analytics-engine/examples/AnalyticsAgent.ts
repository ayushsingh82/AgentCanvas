// src/agents/AnalyticsAgent.ts
import { AiAgentSDK } from '@typescript-agent-framework/core';

export class AnalyticsAgent extends AiAgentSDK {
  constructor(env: Env) {
    super(env);
  }
  
  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<AgentResponse> {
    const { ANALYTICS } = this.env;
    const startTime = Date.now();
    
    // Track message received
    await ANALYTICS.writeDataPoint('agent_metrics', {
      dimensions: {
        agentId: 'analytics-demo',
        userId: message.userId,
        messageType: 'user_message'
      },
      metrics: {
        messages_received: 1,
        message_length: message.content.length
      }
    });
    
    // Process the message
    const response = await this.generateResponse(message.content);
    const processingTime = Date.now() - startTime;
    
    // Track processing metrics
    await ANALYTICS.writeDataPoint('agent_metrics', {
      dimensions: {
        agentId: 'analytics-demo',
        userId: message.userId,
        success: 'true'
      },
      metrics: {
        processing_time_ms: processingTime,
        responses_generated: 1
      }
    });
    
    return { message: response };
  }
}

// Query recent performance metrics
async function getRecentMetrics(analytics: Analytics): Promise<any[]> {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  const query = `
    SELECT 
      agentId,
      COUNT(*) as total_messages,
      AVG(processing_time_ms) as avg_processing_time
    FROM agent_metrics 
    WHERE timestamp >= ${oneHourAgo}
      AND success = 'true'
    GROUP BY agentId
    ORDER BY total_messages DESC
  `;
  
  const result = await analytics.query(query);
  return result.data;
}

