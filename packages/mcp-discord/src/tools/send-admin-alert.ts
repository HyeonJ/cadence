import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";

const InputSchema = z.object({
  severity: z.enum(["info", "warn", "error"]),
  message: z.string().min(1).max(1500),
  context: z.record(z.unknown()).optional(),
});
type Input = z.infer<typeof InputSchema>;

interface Output {
  ok: boolean;
  status: number;
  error?: string;
}

export const sendAdminAlertTool: ToolDef<Input, Output> = {
  name: "send_admin_alert",
  description: "DISCORD_ADMIN_WEBHOOK_URL env로 헬스체크/실패 알림 발송. 사용자 webhook과 분리.",
  inputSchema: InputSchema,
  handler: async ({ severity, message, context }) => {
    const url = process.env.DISCORD_ADMIN_WEBHOOK_URL;
    if (!url) throw new Error("DISCORD_ADMIN_WEBHOOK_URL env required");
    const ctxStr = context ? `\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`` : "";
    const content = `[${severity.toUpperCase()}] ${message}${ctxStr}`.slice(0, 1990);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) return { ok: true, status: res.status };
    return { ok: false, status: res.status };
  },
};
