import { trace, context, SpanStatusCode, type Span } from "@opentelemetry/api";
import { randomUUID } from "crypto";

const TRACER_NAME = "credai-member-portal";

export function getTracer() {
  return trace.getTracer(TRACER_NAME);
}

/**
 * Wraps an async operation in an OpenTelemetry span.
 * Falls back gracefully if tracing is not initialized.
 */
export async function withSpan<T>(
  spanName: string,
  operation: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(spanName, async (span) => {
    if (attributes) {
      Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v));
    }
    try {
      const result = await operation(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Returns the trace ID from the active span context, or generates a fallback UUID.
 * Used to correlate log entries with distributed traces.
 */
export function getCurrentTraceId(): string {
  const spanContext = trace.getActiveSpan()?.spanContext();
  if (spanContext?.traceId) return spanContext.traceId;
  return randomUUID();
}

/**
 * Propagates a trace ID through arbitrary async context using AsyncLocalStorage semantics.
 * Call at the request boundary (middleware) to ensure all downstream logs share the trace ID.
 */
export function propagateTraceId(traceId: string) {
  return context.with(context.active(), async () => {
    return traceId;
  });
}
