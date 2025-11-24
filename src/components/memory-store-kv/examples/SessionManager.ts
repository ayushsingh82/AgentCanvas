// src/agents/SessionManager.ts
import { AiAgentSDK } from '@typescript-agent-framework/agent';

export class SessionManagerAgent extends AiAgentSDK {
  constructor(env: Env) {
    super(env);
  }
  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<AgentResponse> {
    const sessionId = message.metadata?.sessionId || `session_${Date.now()}`;
    
    // Get or create session state
    const sessionState = await this.getSessionState(sessionId);
    
    // Process message in context of session
    const updatedState = await this.processWithSession(message, sessionState);
    
    // Save updated session state
    await this.saveSessionState(sessionId, updatedState);
    
    return {
      message: updatedState.lastResponse,
      actions: [{
        type: 'session_updated',
        data: {
          sessionId,
          stepCount: updatedState.steps.length,
          currentFlow: updatedState.currentFlow
        }
      }]
    };
  }
  
  private async getSessionState(sessionId: string) {
    const { CACHE } = this.env;
    const sessionKey = `session:${sessionId}`;
    
    try {
      const cached = await CACHE.get(sessionKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Create new session
      return {
        id: sessionId,
        createdAt: Date.now(),
        steps: [],
        currentFlow: null,
        context: {},
        lastResponse: null
      };
    } catch (error) {
      console.error('Failed to get session state:', error);
      throw new Error('Session state unavailable');
    }
  }
  
  private async processWithSession(sessionId: string, messages: AIUISDKMessage, sessionState: any) {
    // Add current message to session
    sessionState.steps.push({
      type: 'user_message',
      content: message.content,
      timestamp: Date.now()
    });
    
    // Detect conversation flow
    if (message.content.toLowerCase().includes('booking')) {
      sessionState.currentFlow = 'booking';
      sessionState.context.booking = sessionState.context.booking || {};
    }
    
    // Generate contextual response
    let response = '';
    if (sessionState.currentFlow === 'booking') {
      response = await this.handleBookingFlow(message, sessionState);
    } else {
      response = `I understand. This is step ${sessionState.steps.length} of our conversation.`;
    }
    
    // Update session with response
    sessionState.steps.push({
      type: 'agent_response',
      content: response,
      timestamp: Date.now()
    });
    sessionState.lastResponse = response;
    sessionState.lastActivity = Date.now();
    
    return sessionState;
  }
  
  private async saveSessionState(sessionId: string, state: any) {
    const { CACHE } = this.env;
    const sessionKey = `session:${sessionId}`;
    
    try {
      // Cache session for 2 hours
      await CACHE.put(sessionKey, JSON.stringify(state), {
        expirationTtl: 7200
      });
      
      console.log(`Session ${sessionId} saved with ${state.steps.length} steps`);
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }
  
  private async handleBookingFlow(sessionId: string, messages: AIUISDKMessage, sessionState: any): Promise<string> {
    // Simple booking flow logic
    const booking = sessionState.context.booking;
    
    if (!booking.service) {
      booking.service = 'consultation';
      return 'Great! I\'ll help you book a consultation. What date works for you?';
    }
    
    if (!booking.date) {
      booking.date = 'pending';
      return 'Perfect! What time would you prefer?';
    }
    
    if (!booking.time) {
      booking.time = 'pending';
      sessionState.currentFlow = null; // Complete flow
      return 'Excellent! Your booking is confirmed. You\'ll receive a confirmation email shortly.';
    }
    
    return 'Let me help you with your booking.';
  }
}

