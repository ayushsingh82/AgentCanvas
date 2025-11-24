# Memory Store (KV)

Supercharge your agents with lightning-fast global memory store. Cloudflare KV is an eventually consistent key-value store that provides sub-10ms read latency across 330+ cities worldwide. Perfect for caching API responses, user preferences, and frequently accessed data to dramatically improve agent response times.

## Key Features

- **Global Replication**: Data is automatically replicated to edge locations worldwide
- **Eventually Consistent**: Writes propagate globally within 60 seconds
- **Low Latency**: Sub-10ms reads from the nearest edge location
- **High Availability**: 99.9% uptime SLA with automatic failover
- **Cost Effective**: Pay only for operations, not storage time
- **Expiration Support**: Automatic cleanup of cached data with TTL

## Getting Started

### Wrangler Configuration

First, add KV namespaces in your wrangler.json:

```json
{
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "your-cache-namespace-id",
      "preview_id": "your-preview-namespace-id" // optional for preview urls
    }
  ]
}
```

## TypeScript API Reference

You can access the KV API via the env of the Agent or MCP Tool

```typescript
// Example function that resides within any Agent or MCP Tool
function example() {
  // CACHE can be named to anything and equals the "binding" sent in wrangler.json
  const { CACHE } = this.env;
}
```

### Basic Operations

- `CACHE.get(key: string): Promise<string | null>` - Retrieve a value from the cache by key. Returns null if the key doesn't exist.
- `CACHE.put(key: string, value: string, options?: KVPutOptions): Promise<void>` - Store a value in the cache with optional expiration and metadata.
- `CACHE.delete(key: string): Promise<void>` - Remove a key-value pair from the cache.

### Advanced Operations

- `CACHE.list(options?: KVListOptions): Promise<KVListResult>` - List keys in the cache with optional filtering and pagination.
- `CACHE.getWithMetadata(key: string): Promise<KVValueWithMetadata>` - Retrieve a value along with its metadata and expiration information.

### Batch Operations

- `CACHE.getMultiple(keys: string[]): Promise<Record<string, string | null>>` - Retrieve multiple values in a single operation for better performance.
- `CACHE.putMultiple(entries: Array<{key: string, value: string, options?: KVPutOptions}>): Promise<void>` - Store multiple key-value pairs in a single operation.

## KV Options

```typescript
interface KVPutOptions {
  expiration?: number;          // Unix timestamp when key expires
  expirationTtl?: number;       // Seconds until key expires
  metadata?: Record<string, any>; // Additional metadata (max 1024 bytes)
}

interface KVListOptions {
  prefix?: string;              // List keys with this prefix
  limit?: number;               // Max keys to return (default: 1000)
  cursor?: string;              // Pagination cursor
}

interface KVValueWithMetadata {
  value: string | null;
  metadata: Record<string, any> | null;
}
```

## Limitations & Considerations

- **Value Size**: Maximum 25 MB per value (use compression for large data)
- **Key Size**: Maximum 512 bytes per key
- **List Operations**: Maximum 1,000 keys per list operation
- **Eventual Consistency**: Writes may take up to 60 seconds to propagate globally
- **Rate Limits**: 1,000 operations per second per key
- **No Transactions**: KV doesn't support atomic multi-key operations

## Related Services

- Analytics Storage - Track cache hit rates and performance metrics
- Cache - HTTP response caching at the edge
- Databases - Primary data storage for complex queries
- Workflows - Orchestrate cache warming and cleanup

