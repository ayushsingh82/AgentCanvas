// Agent that runs A/B tests and tracks results
export async function processMessage(
  sessionId: string, messages: AIUISDKMessage,
  platform: PlatformServices
): Promise<AgentResponse> {
  const { analytics, memoryStore } = platform;
  
  // Step 1: Determine which test variants to use
  const activeTests = await getActiveTests(); // ["response_style_test", "greeting_test"]
  const userVariants = await assignTestVariants(message.userId, activeTests);
  // Example: { "response_style_test": "formal", "greeting_test": "friendly" }
  
  const startTime = Date.now();
  
  // Step 2: Track test exposure events
  for (const [testId, variant] of Object.entries(userVariants)) {
    await analytics.writeDataPoint('ab_test_exposure', {
      dimensions: {
        test_id: testId,
        variant: variant, // "control", "variant_a", "variant_b"
        userId: message.userId,
        messageType: detectMessageType(message.content)
      },
      metrics: {
        exposures: 1
      }
    });
  }
  
  // Step 3: Generate response using assigned test variants
  const response = await generateResponseWithVariants(message.content, userVariants);
  const processingTime = Date.now() - startTime;
  
  // Step 4: Track response metrics for each active test
  for (const [testId, variant] of Object.entries(userVariants)) {
    await analytics.writeDataPoint('ab_test_metrics', {
      dimensions: {
        test_id: testId,
        variant: variant,
        userId: message.userId,
        success: 'true'
      },
      metrics: {
        response_time_ms: processingTime,
        response_length: response.length,
        responses: 1
      }
    });
  }
  
  return { 
    message: response,
    actions: [{
      type: 'ab_test_tracking',
      data: { userVariants, processingTime }
    }]
  };
}

