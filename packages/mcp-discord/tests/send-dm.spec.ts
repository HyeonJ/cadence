import { describe, it, expect, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { sendDmTool } from "../src/tools/send-dm.ts";

const server = setupServer();
server.listen({ onUnhandledRequest: "error" });
afterEach(() => server.resetHandlers());

describe("send_dm", () => {
  it("webhook URL에 POST + 200 받으면 ok=true", async () => {
    const captured: { value: { content?: string } | null } = { value: null };
    server.use(
      http.post("https://discord.com/api/webhooks/123/abc", async ({ request }) => {
        captured.value = (await request.json()) as { content?: string };
        return new HttpResponse(null, { status: 204 });
      })
    );
    const result = await sendDmTool.handler({
      webhook_url: "https://discord.com/api/webhooks/123/abc",
      content: "오늘 카드 도착! https://cadence.app/today",
    });
    expect(result.ok).toBe(true);
    expect(captured.value?.content).toContain("오늘 카드 도착");
  });

  it("Discord webhook 4xx 시 ok=false + error 반환", async () => {
    server.use(
      http.post("https://discord.com/api/webhooks/123/abc", () =>
        HttpResponse.json({ message: "Invalid webhook" }, { status: 400 })
      )
    );
    const result = await sendDmTool.handler({
      webhook_url: "https://discord.com/api/webhooks/123/abc",
      content: "test",
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });
});
