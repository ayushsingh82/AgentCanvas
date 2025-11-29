// Document processing agent with multi-stage pipeline
import { AiAgentSDK } from '@typescript-agent-framework/core';

interface DocumentProcessingRequest {
  pipelineId: string;
  userId: string;
  documentUrl: string;
  stage: 'download' | 'ocr' | 'analyze' | 'complete';
}

export class DocumentProcessingAgent extends AiAgentSDK {
  constructor(env: Env) {
    super(env);
  }
  
  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<AgentResponse> {
    const { DOCUMENT_QUEUE } = this.env;
    
    const documentUrl = this.extractDocumentUrl(message.content);
    if (!documentUrl) {
      return { message: "Please provide a document to process." };
    }
    
    // Start document processing pipeline
    const pipelineId = crypto.randomUUID();
    
    await DOCUMENT_QUEUE.send({
      body: {
        pipelineId,
        userId: message.userId,
        documentUrl,
        stage: 'download',
        startedAt: Date.now(),
        requestedBy: message.userId
      }
    });
    
    return {
      message: `Document processing started! Pipeline ID: ${pipelineId}`,
      actions: [{
        type: 'pipeline_started',
        data: { pipelineId, stage: 'download' }
      }]
    };
  }
  
  private extractDocumentUrl(content: string): string {
    const urlMatch = content.match(/https?:\/\/[^\s]+\.pdf/i);
    return urlMatch ? urlMatch[0] : '';
  }
}

// Queue consumer for document processing
export default {
  async queue(batch: MessageBatch<DocumentProcessingRequest>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const { pipelineId, userId, documentUrl, stage } = message.body;
        const { DOCUMENT_QUEUE, STORAGE } = env;
        
        switch (stage) {
          case 'download':
            // Download document
            const documentData = await this.downloadDocument(documentUrl);
            const documentKey = `documents/${pipelineId}/original.pdf`;
            await STORAGE.put(documentKey, documentData);
            
            // Send to OCR stage
            await DOCUMENT_QUEUE.send({
              body: {
                ...message.body,
                stage: 'ocr',
                documentKey
              }
            });
            break;
        }
        message.ack(); // Mark as successfully processed
        
      } catch (error) {
        console.error('Document processing error:', error);
        
        // Retry up to 3 times with exponential backoff
        if (message.attempts < 3) {
          message.retry(Math.pow(2, message.attempts) * 30); // 30s, 60s, 120s
        } else {
          message.abandon(); // Send to dead letter queue
        }
      }
    }
  }
};

