type LogLevel = "info" | "warn" | "error";

const SECRET_KEY_PATTERN = /token|key|secret|authorization|password/i;

/** Strips any field whose key looks like a credential before logging. */
function sanitize(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) return context;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    clean[key] = SECRET_KEY_PATTERN.test(key) ? "[redacted]" : value;
  }
  return clean;
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...sanitize(context),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => write("error", message, context),
};
