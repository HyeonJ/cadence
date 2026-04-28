import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { sendAdminAlertTool } from "../src/tools/send-admin-alert.ts";

const server = setupServer();
server.listen({ onUnhandledRequest: "error" });
afterEach(() => server.resetHandlers());

describe("send_admin_alert", () => {
  beforeEach(() => {
    process.env.DISCORD_ADMIN_WEBHOOK_URL = "https://discord.com/api/webhooks/admin/xyz";
  });

  it("env에서 admin webhook 사용", async () => {
    const captured: { value: { content?: string } | null } = { value: null };
    server.use(
      http.post("https://discord.com/api/webhooks/admin/xyz", async ({ request }) => {
        captured.value = (await request.json()) as { content?: string };
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await sendAdminAlertTool.handler({
      severity: "error",
      message: "어제 카드 누락",
      context: { user_id: "u1", date_kst: "2026-05-01" },
    });
    expect(result.ok).toBe(true);
    expect(captured.value?.content).toContain("[ERROR]");
  });

  it("env 미설정 시 throw", async () => {
    delete process.env.DISCORD_ADMIN_WEBHOOK_URL;
    await expect(
      sendAdminAlertTool.handler({ severity: "error", message: "x" })
    ).rejects.toThrow(/DISCORD_ADMIN_WEBHOOK_URL/);
  });
});
