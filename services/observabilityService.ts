// services/observabilityService.ts

/**
 * This service simulates a client for an observability platform like Sentry or Datadog.
 * It provides a centralized place for logging errors, info, and performance metrics.
 * In a real production app, you would replace the mock `SentryClient` with the actual
 * SDK, but the rest of the app's code that calls this service would not need to change.
 */
class SentryClient {
  private isInitialized = false;

  init() {
    // In a real app, this is where you would configure the SDK with a DSN key.
    // Sentry.init({ dsn: "YOUR_DSN_HERE" });
    this.isInitialized = true;
    console.log("[Observability] Client Initialized.");
  }

  captureException(error: Error, context?: Record<string, any>) {
    if (!this.isInitialized) return;
    console.error("[Observability] Error Captured:", {
      error: error.message,
      stack: error.stack,
      context,
    });
    // Real implementation: Sentry.captureException(error, { extra: context });
  }

  captureMessage(message: string) {
    if (!this.isInitialized) return;
    console.log(`[Observability] Info Logged: "${message}"`);
    // Real implementation: Sentry.captureMessage(message);
  }
}

const mockClient = new SentryClient();
const performanceTimers = new Map<string, number>();

export const observabilityService = {
  init: () => {
    mockClient.init();
  },

  logError: (error: Error, context?: Record<string, any>) => {
    mockClient.captureException(error, context);
  },

  logInfo: (message: string) => {
    mockClient.captureMessage(message);
  },
  
  startPerformanceMeasure: (name: string) => {
    performanceTimers.set(name, Date.now());
  },
  
  endPerformanceMeasure: (name: string) => {
    const startTime = performanceTimers.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`[Observability] Performance: "${name}" took ${duration}ms.`);
      performanceTimers.delete(name);
      // Real implementation might send this to the monitoring service
      // Sentry.metrics.distribution('performance.chat.response_time', duration);
    }
  },
};
