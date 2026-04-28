type LogLevel = "info" | "warn" | "error";

interface LogContext {
  stage?: string;
  user_id?: string;
  date_kst?: string;
  [k: string]: unknown;
}

function log(level: LogLevel, msg: string | LogContext, ctx?: LogContext): void {
  const obj = typeof msg === "string"
    ? { ts: new Date().toISOString(), level, msg, ...ctx }
    : { ts: new Date().toISOString(), level, ...msg };
  // stdout (Routines audit log에 잡힘)
  process.stdout.write(JSON.stringify(obj) + "\n");
}

export const logger = {
  info: (msgOrCtx: string | LogContext, ctx?: LogContext) => log("info", msgOrCtx, ctx),
  warn: (msgOrCtx: string | LogContext, ctx?: LogContext) => log("warn", msgOrCtx, ctx),
  error: (msgOrCtx: string | LogContext, ctx?: LogContext) => log("error", msgOrCtx, ctx),
};
