// Agent that monitors system health and alerts
export async function processMessage(
  sessionId: string, messages: AIUISDKMessage,
  platform: PlatformServices
): Promise<AgentResponse> {
  const { analytics } = platform;
  
  // Step 1: Collect current system health metrics
  const healthMetrics = await collectSystemHealthMetrics();
  // Returns: { cpu: 45.2, memory: 78.1, connections: 150, queueDepth: 5, errorRate: 0.02 }
  
  // Step 2: Write system metrics to multiple datasets
  await analytics.writeDataPoints('system_health', [
    {
      dimensions: {
        service: 'message_processing',
        region: 'global',
        environment: 'production'
      },
      metrics: {
        cpu_usage: healthMetrics.cpu,
        memory_usage: healthMetrics.memory,
        active_connections: healthMetrics.connections,
        queue_depth: healthMetrics.queueDepth,
        error_rate: healthMetrics.errorRate
      }
    },
    {
      dimensions: {
        service: 'storage',
        region: 'global',
        environment: 'production'
      },
      metrics: {
        storage_usage: healthMetrics.storageUsage,
        read_latency: healthMetrics.readLatency,    // milliseconds
        write_latency: healthMetrics.writeLatency,  // milliseconds
        throughput: healthMetrics.throughput        // requests per second
      }
    }
  ]);
  
  // Step 3: Run anomaly detection algorithms
  const anomalies = await detectAnomalies(healthMetrics);
  // Returns: [{ type: 'high_cpu', severity: 'warning', value: 95.2, threshold: 80 }]
  
  if (anomalies.length > 0) {
    // Step 4: Track alert events
    for (const anomaly of anomalies) {
      await analytics.writeDataPoint('system_alerts', {
        dimensions: {
          alert_type: anomaly.type,        // "high_cpu", "memory_leak", "queue_backup"
          severity: anomaly.severity,      // "info", "warning", "critical"
          service: anomaly.service
        },
        metrics: {
          alert_count: 1,
          value: anomaly.value,
          threshold: anomaly.threshold
        }
      });
    }
    
    // Step 5: Send alerts to operations team
    await sendOperationalAlert({
      anomalies,
      timestamp: Date.now(),
      systemMetrics: healthMetrics
    });
    
    return {
      message: `System health check complete. ${anomalies.length} anomalies detected and alerts sent.`,
      actions: anomalies.map(a => ({
        type: 'anomaly_detected',
        data: a
      }))
    };
  }
  
  return {
    message: "System health check complete. All metrics within normal ranges."
  };
}

// Real-time dashboard data aggregation
async function getDashboardData(platform: PlatformServices): Promise<DashboardData> {
  const { analytics } = platform;
  
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Query 1: Current system status (last 5 minutes)
  const currentMetrics = await analytics.query(`
    SELECT 
      AVG(cpu_usage) as avg_cpu,
      AVG(memory_usage) as avg_memory,
      MAX(queue_depth) as max_queue_depth,
      AVG(error_rate) as avg_error_rate,
      COUNT(*) as metric_count
    FROM system_health 
    WHERE timestamp >= ${now - 300000} -- Last 5 minutes
      AND service = 'message_processing'
  `);
  
  // Query 2: Hourly trends for charts
  const hourlyTrends = await analytics.query(`
    SELECT 
      toStartOfMinute(timestamp) as minute,
      AVG(cpu_usage) as cpu,
      AVG(memory_usage) as memory,
      AVG(error_rate) as error_rate
    FROM system_health 
    WHERE timestamp >= ${oneHourAgo}
      AND service = 'message_processing'
    GROUP BY minute
    ORDER BY minute ASC
  `);
  
  // Query 3: Active alerts summary
  const activeAlerts = await analytics.query(`
    SELECT 
      alert_type,
      severity,
      COUNT(*) as count,
      MAX(timestamp) as last_occurrence
    FROM system_alerts 
    WHERE timestamp >= ${oneHourAgo}
    GROUP BY alert_type, severity
    ORDER BY count DESC
  `);
  
  return {
    current: currentMetrics.data[0],
    trends: hourlyTrends.data,
    alerts: activeAlerts.data,
    lastUpdated: now
  };
}

