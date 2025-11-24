# Queues

Orchestrate complex agent workflows with bulletproof message queuing. Cloudflare Queues enables your AI agents to process tasks asynchronously, handle workload spikes, and coordinate multi-step workflows with guaranteed delivery and automatic retries.

## Key Features

- **Guaranteed Delivery**: Messages are delivered at least once with automatic retries
- **Dead Letter Queues**: Failed messages are automatically moved to DLQ for debugging
- **Batch Processing**: Handle up to 100 messages per batch for efficiency
- **Delay Scheduling**: Schedule messages for future processing
- **Global Distribution**: Queues available in all Cloudflare edge locations

## Getting Started

### Wrangler Configuration

First, add queues in your wrangler.json:

```json
{
  "queues": {
    "producers": [
      {
        "queue": "document-processing",
        "binding": "DOCUMENT_QUEUE"
      }
    ],
    "consumers": [
      {
        "queue": "document-processing",
        "max_batch_size": 10,
        "max_batch_timeout": 5000,
        "max_retries": 10,
        "dead_letter_queue": "unique-queue-name",
        "max_concurrency": 5
      }
    ]
  }
}
```

## TypeScript API Reference

You can access queue bindings via the env of your Agent or MCP Tool:

```typescript
// Example function that resides within any Agent or MCP Tool
function example() {
  // TASK_QUEUE can be named to anything and equals the "binding" set in wrangler.json
  const { TASK_QUEUE } = this.env;
}
```

### Queue Producer Methods

- `send(message: QueueMessage): Promise<void>` - Sends a single message to the queue. The message will be delivered to consumers with guaranteed delivery and automatic retries.
- `sendBatch(messages: QueueMessage[]): Promise<void>` - Sends multiple messages to the queue in a single API call for improved efficiency. Can send up to 100 messages at once.
- `sendDelayed(message: QueueMessage, delaySeconds: number): Promise<void>` - Schedules a message for future delivery. The message will be delivered after the specified delay.

### Queue Consumer Interface

- `queue(batch: MessageBatch, env: Env): Promise<void>` - Consumer function that processes batches of messages from the queue. This function is automatically called and must be placed at the index of your project.

## TypeScript Interfaces

```typescript
interface QueueMessage {
  body: any;                    // Message payload (JSON serializable)
  id?: string;                  // Optional message ID
  timestamp?: number;           // Message timestamp
  contentType?: string;         // Content type hint
  metadata?: Record<string, any>; // Additional metadata
}

interface MessageBatch<T = any> {
  queue: string;                // Queue name
  messages: Array<{
    id: string;
    body: T;
    timestamp: number;
    attempts: number;
    metadata?: Record<string, any>;
    
    // Message control methods
    ack(): void;                // Mark message as successfully processed
    retry(delaySeconds?: number): void; // Retry message after delay
    abandon(): void;            // Send to dead letter queue
  }>;
}

interface QueueBinding {
  send(message: QueueMessage): Promise<void>;
  sendBatch(messages: QueueMessage[]): Promise<void>;
  sendDelayed(message: QueueMessage, delaySeconds: number): Promise<void>;
}
```

## Limitations

- **Message Size**: Maximum 128 KB per message and 25GB total backlog size
- **Batch Size**: Maximum 100 messages per batch and 256 KB Total
- **Retention**: Messages retained for 14 days maximum
- **Visibility Timeout**: 12 hours maximum processing time and 100 retries
- **Producer Rate Limits**: 5,000 messages/second per queue
- **Dead Letter Queue**: Maximum 3 redirections before permanent failure

## Related Services

- Memory Store (KV) - Store queue state and processing flags
- Analytics Engine - Track queue metrics and performance
- Workflows - Orchestrate complex multi-queue workflows

