// Sentry initialization — loaded on server startup and in the browser.
// Actual Sentry SDK configuration (@sentry/nextjs) is injected via:
//   - sentry.client.config.ts  (browser)
//   - sentry.server.config.ts  (Node.js server)
//   - sentry.edge.config.ts    (Edge runtime)
// This module exports helpers so the rest of the codebase does not import @sentry/nextjs directly.

import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Avoid sending PII — strip user email, names from events
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        // Keep only user.id for correlation
      }
      return event;
    },
    integrations: [],
  });
}

/**
 * Captures an exception and associates it with a trace ID for log correlation.
 * Never includes PII in the extra context.
 */
export function captureException(
  err: unknown,
  context?: { traceId?: string; userId?: string; extra?: Record<string, unknown> },
) {
  Sentry.withScope((scope) => {
    if (context?.traceId) scope.setTag("trace_id", context.traceId);
    if (context?.userId) scope.setUser({ id: context.userId });
    if (context?.extra) {
      Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
    }
    Sentry.captureException(err);
  });
}

export function captureMessage(
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info",
) {
  Sentry.captureMessage(message, level);
}
