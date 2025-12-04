// src/mcp/AnalyticsMCPServer.ts
import { MCPServerDO } from '@typescript-agent-framework/mcp';

export class AnalyticsMCPServer extends MCPServerDO<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }
  protected configureServer() {
    return {
      'track-event': async ({ event, dimensions, metrics }: { 
        event: string; 
        dimensions?: Record<string, string>; 
        metrics?: Record<string, number> 
      }) => {
        const { ANALYTICS } = this.env;
        
        await ANALYTICS.writeDataPoint('mcp_events', {
          dimensions: {
            event_type: event,
            source: 'mcp-server',
            ...dimensions
          },
          metrics: {
            event_count: 1,
            ...metrics
          }
        });
        
        return {
          success: true,
          message: `Tracked event: ${event}`,
          timestamp: Date.now()
        };
      },
      
      'query-metrics': async ({ sql }: { sql: string }) => {
        const { ANALYTICS } = this.env;
        
        const result = await ANALYTICS.query(sql);
        return {
          success: true,
          data: result.data,
          rowCount: result.data.length
        };
      }
    };
  }
}

