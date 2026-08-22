export type AuditActor = {
  actorType: "user" | "system";
  actorId: string;
};

export type AuditEvent = {
  id: string;
  organizationId: string;
  marketCode: string;
  actor: AuditActor;
  action: string;
  resourceType: string;
  resourceId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export type Logger = {
  fatal(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  debug(msg: string, ctx?: Record<string, unknown>): void;
  trace(msg: string, ctx?: Record<string, unknown>): void;
};

export function createLogger(
  level: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info",
): Logger {
  const rank: Record<LogLevel, number> = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  };
  const threshold = rank[level] ?? 3;

  const write =
    (method: LogLevel) => (msg: string, ctx?: Record<string, unknown>) => {
      if (rank[method] <= threshold) {
        const line = { level: method, msg, ...ctx };
        if (method === "fatal" || method === "error") {
          console.error(JSON.stringify(line));
        } else {
          console.log(JSON.stringify(line));
        }
      }
    };

  return {
    fatal: write("fatal"),
    error: write("error"),
    warn: write("warn"),
    info: write("info"),
    debug: write("debug"),
    trace: write("trace"),
  };
}
