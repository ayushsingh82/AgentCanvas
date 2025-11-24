# Analytics Engine

Turn your agent data into actionable insights. Analytics Engine is a time-series database optimized for storing and querying metrics at massive scale. Perfect for tracking agent performance, user engagement, billing data, trading data, and generating real-time dashboards.

## Key Features

- **Time-Series Optimized**: Built for high-frequency metric ingestion with 90 day retention
- **SQL Querying**: Use familiar SQL to analyze your data
- **Real-Time Analytics**: Query data as soon as it's written
- **Cost Effective**: Pay only for data points written, not storage
- **Global Distribution**: Data available worldwide with low latency

**NOTE**: If you are looking for longer storage retention, consider SQL Database combined with caching techniques to achieve similar results.

## Getting Started

### Wrangler Configuration

First, add analytics in your wrangler.json:

```json
{
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS",
      "dataset": "agent_metrics"
    }
  ]
}
```

## TypeScript API Reference

You can access the analytics API via the env of the Agent or MCP Tool:

```typescript
// Example function that resides within any Agent or MCP Tool
function example() {
  // ANALYTICS can be named to anything and equals the binding in wrangler.json
  const { ANALYTICS } = this.env;
}
```

### Data Writing Methods

- `writeDataPoint(dataset: string, data: AnalyticsDataPoint): Promise<void>` - Writes a single data point to the specified dataset. Use for individual events or metrics.
- `writeDataPoints(dataset: string, data: AnalyticsDataPoint[]): Promise<void>` - Writes multiple data points in a single batch operation. More efficient for bulk data ingestion.

### Query Methods

- `query(sql: string): Promise<AnalyticsQueryResult>` - Executes a SQL query against your analytics data. Returns structured results with metadata.
- `getMetrics(dataset: string, options: MetricsOptions): Promise<MetricsResult>` - Predefined query helper for common metric aggregations with time ranges and grouping.
- `getTimeSeries(dataset: string, metric: string, options: TimeSeriesOptions): Promise<TimeSeriesResult>` - Specialized query for time-series data with automatic interval bucketing.

## Data Structures

```typescript
interface AnalyticsDataPoint {
  // Required fields
  timestamp?: number;           // Unix timestamp (defaults to now)
  
  // Optional dimensions (for grouping)
  dimensions?: {
    userId?: string;
    agentId?: string;
    messageType?: string;
    [key: string]: string | number | boolean;
  };
  
  // Metrics (numeric values)
  metrics?: {
    count?: number;
    duration?: number;
    tokens?: number;
    cost?: number;
    [key: string]: number;
  };
}

interface MetricsOptions {
  timeRange: {
    start: number;              // Unix timestamp
    end: number;                // Unix timestamp
  };
  dimensions?: string[];        // Group by these dimensions
  metrics?: string[];           // Include these metrics
  interval?: string;            // '1m', '5m', '1h', '1d'
}
```

## Limitations & Considerations

- **Data Point Size**: Maximum 25 fields per data point
- **String Length**: Maximum 256 characters per string field
- **Write Rate**: Up to 25,000 data points per minute per dataset
- **Retention**: Data retained for 3 months by default
- **Query Complexity**: Limited to 1000 result rows per query

## Related Services

- Memory Store (KV) - Cache analytics queries for faster dashboards
- SQL Database - Long-term storage for historical analytics
- Workflows - Orchestrate analytics aggregation and reporting

