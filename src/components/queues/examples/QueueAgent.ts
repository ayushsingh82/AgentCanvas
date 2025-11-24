// src/agents/QueueAgent.ts
import { AiAgentSDK } from '@typescript-agent-framework/core';

export class QueueAgent extends AiAgentSDK {
  constructor(env: Env) {
    super(env);
  }
  
  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<AgentResponse> {
    const { DOCUMENT_QUEUE } = this.env;
    
    if (message.content.includes('process document')) {
      const documentUrl = this.extractDocumentUrl(message.content);
      
      // Send document processing task to queue
      await DOCUMENT_QUEUE.send({
        body: {
          documentUrl,
          userId: message.userId,
          taskId: crypto.randomUUID(),
          priority: 'normal',
          createdAt: Date.now()
        }
      });
      
      return {
        message: 'Document processing task queued successfully!',
        actions: [{
          type: 'task_queued',
          data: { taskType: 'document_processing' }
        }]
      };
    }
    
    return { message: 'Send me a document to process!' };
  }
  
  private extractDocumentUrl(content: string): string {
    // Extract document URL from message content
    const urlMatch = content.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : '';
  }
}

