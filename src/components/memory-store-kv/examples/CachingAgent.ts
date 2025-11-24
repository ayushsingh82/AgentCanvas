// src/agents/CachingAgent.ts
import { AiAgentSDK } from '@typescript-agent-framework/agent';

export class CachingAgent extends AiAgentSDK {
  constructor(env: Env) {
    super(env);
  }
  
  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<AgentResponse> {
    const sessionId = message.metadata?.sessionId || 'default';
    
    // Use cached responses to improve performance
    const cachedResponse = await this.getCachedResponse(message.content);
    if (cachedResponse) {
      return {
        message: cachedResponse,
        actions: [{
          type: 'cache_hit',
          data: { cached: true }
        }]
      };
    }
    
    // Generate new response and cache it
    const result = await this.streamText(sessionId, {
      model: this.model,
      system: 'You are a helpful assistant that provides informative responses.',
      messages: [{ role: 'user', content: message.content }],
      maxSteps: 5,
    });
    const response = result.text;
    
    // Cache the response for similar questions
    await this.cacheResponse(message.content, response);
    
    return result.toDataStreamResponse();
  }
  
  private async getCachedResponse(question: string): Promise<string | null> {
    try {
      const { CACHE } = this.env;
      const cacheKey = this.generateCacheKey(question);
      
      const cached = await CACHE.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for question: ${question.substring(0, 50)}...`);
        return cached;
      }
      
      return null;
    } catch (error) {
      console.error('Cache read failed:', error);
      return null;
    }
  }
  
  private async cacheResponse(question: string, response: string): Promise<void> {
    try {
      const { CACHE } = this.env;
      const cacheKey = this.generateCacheKey(question);
      
      // Cache for 1 hour
      await CACHE.put(cacheKey, response, {
        expirationTtl: 3600
      });
      
      console.log(`Cached response for: ${question.substring(0, 50)}...`);
    } catch (error) {
      console.error('Cache write failed:', error);
    }
  }
  
  private generateCacheKey(question: string): string {
    // Simple hash of the question for cache key
    const hash = question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
    return `response:${hash}`;
  }
}

