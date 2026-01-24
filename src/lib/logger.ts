/**
 * Structured logging utility.
 * Provides consistent, structured error logging with context.
 * Future enhancement: integrate with Sentry or other error monitoring.
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  component: string;
  [key: string]: unknown;
}

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    name?: string;
    stack?: string;
  };
}

function formatLog(log: StructuredLog): string {
  // In development, use a readable format
  if (process.env.NODE_ENV === "development") {
    const parts = [
      `[${log.timestamp}]`,
      `[${log.level.toUpperCase()}]`,
      `[${log.component}]`,
      log.message,
    ];
    return parts.join(" ");
  }

  // In production, use JSON for structured logging
  return JSON.stringify(log);
}

function createLogEntry(
  level: LogLevel,
  component: string,
  message: string,
  error?: unknown,
  additionalContext?: Record<string, unknown>
): StructuredLog {
  const log: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
  };

  if (additionalContext && Object.keys(additionalContext).length > 0) {
    log.context = additionalContext;
  }

  if (error) {
    if (error instanceof Error) {
      log.error = {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      };
    } else {
      log.error = {
        message: String(error),
      };
    }
  }

  return log;
}

/**
 * Creates a logger instance for a specific component.
 * @param component - Name of the component/module for context
 */
export function createLogger(component: string) {
  return {
    error(message: string, error?: unknown, context?: Record<string, unknown>) {
      const log = createLogEntry("error", component, message, error, context);
      console.error(formatLog(log));
      if (process.env.NODE_ENV === "development" && error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    },

    warn(message: string, context?: Record<string, unknown>) {
      const log = createLogEntry("warn", component, message, undefined, context);
      console.warn(formatLog(log));
    },

    info(message: string, context?: Record<string, unknown>) {
      const log = createLogEntry("info", component, message, undefined, context);
      console.info(formatLog(log));
    },

    debug(message: string, context?: Record<string, unknown>) {
      if (process.env.NODE_ENV === "development") {
        const log = createLogEntry("debug", component, message, undefined, context);
        console.debug(formatLog(log));
      }
    },
  };
}

// Pre-configured loggers for common components
export const loggers = {
  dashboard: createLogger("dashboard"),
  players: createLogger("players"),
  seasons: createLogger("seasons"),
  validation: createLogger("validation"),
};
