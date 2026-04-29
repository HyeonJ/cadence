import { logger } from "./logger.ts";

export type Severity = "info" | "warn" | "error";

interface AlertInput {
  severity: Severity;
  message: string;
  context?: Record<string, unknown>;
}

export async function sendAdminAlert(input: AlertInput): Promise<void> {
  const url = process.env.DISCORD_ADMIN_WEBHOOK_URL;
  if (!url) {
    logger.warn({ stage: "admin-alert", reason: "DISCORD_ADMIN_WEBHOOK_URL missing" });
    return;
  }
  const ctxStr = input.context
    ? `\n\`\`\`json\n${JSON.stringify(input.context, null, 2)}\n\`\`\``
    : "";
  const content = `[${input.severity.toUpperCase()}] cadence-routine: ${input.message}${ctxStr}`.slice(0, 1990);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      logger.warn({ stage: "admin-alert", status: res.status });
    }
  } catch (err) {
    logger.warn({ stage: "admin-alert", err: (err as Error).message });
  }
}
