import pino from "pino";

const REDACTED_PATHS = [
  "*.email",
  "*.firmName",
  "*.firmAddress",
  "*.phone",
  "*.phoneNumber",
  "*.pan",
  "*.panNumber",
  "*.gstin",
  "*.aadhaar",
  "*.password",
  "*.totpSecret",
  "*.recoveryCodes",
  "email",
  "firmName",
  "firmAddress",
  "phone",
  "phoneNumber",
  "pan",
  "panNumber",
  "gstin",
  "aadhaar",
  "password",
  "totpSecret",
  "recoveryCodes",
];

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  redact: {
    paths: REDACTED_PATHS,
    censor: "[REDACTED]",
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        // Production: structured JSON for log aggregation
        formatters: {
          level(label) {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

export function createContextLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export function logError(err: unknown, context?: Record<string, unknown>) {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error({ ...context, err: { message: error.message, stack: error.stack } }, error.message);
}
