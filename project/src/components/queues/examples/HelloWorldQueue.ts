// src/queues/HelloWorldQueue.ts
export default {  
  // Queue consumer function within your Agent or MCP Tool index
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        console.log('Processing message:', message.body);
        
        // Process the message
        const { message: content, timestamp, requestId } = message.body;
        console.log(`Hello World: ${content} (${requestId})`);
        
        // Acknowledge successful processing
        message.ack();
      } catch (error) {
        console.error('Message processing failed:', error);
        message.retry();
      }
    }
  }
};

