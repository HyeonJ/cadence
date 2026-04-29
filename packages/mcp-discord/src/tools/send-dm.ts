import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";

const InputSchema = z.object({
  webhook_url: z
    .string()
    .url()
    .refine(
      (u) =>
        /^https:\/\/(canary\.|ptb\.)?(discord\.com|discordapp\.com)\/api\/webhooks\//.test(u),
      {
        message:
          "Discord webhook URL이어야 합니다 (discord.com 또는 discordapp.com /api/webhooks/...)",
      },
    ),
  content: z.string().min(1).max(2000),
});
type Input = z.infer<typeof InputSchema>;

interface Output {
  ok: boolean;
  status: number;
  error?: string;
}

export const sendDmTool: ToolDef<Input, Output> = {
  name: "send_dm",
  description: "Discord webhook URL로 메시지 발송. content는 1~2000자. 4xx/5xx 시 ok=false.",
  inputSchema: InputSchema,
  handler: async ({ webhook_url, content }) => {
    const res = await fetch(webhook_url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) return { ok: true, status: res.status };
    let errBody = "";
    try {
      errBody = (await res.text()).slice(0, 500);
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, error: errBody };
  },
};
