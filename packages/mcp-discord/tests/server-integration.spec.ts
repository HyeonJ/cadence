import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = join(__dirname, "../src/server.ts");

describe("mcp-discord server integration", () => {
  it("stdio로 ListTools 호출 시 2 도구 반환", async () => {
    const proc = spawn("npx", ["tsx", SERVER], {
      env: { ...process.env, NODE_ENV: "test" },
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });
    const list_request = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {},
    });
    proc.stdin.write(list_request + "\n");

    const response = await new Promise<string>((resolve, reject) => {
      let buf = "";
      proc.stdout.on("data", (chunk) => {
        buf += chunk.toString();
        if (buf.includes("\n")) resolve(buf);
      });
      proc.stderr.on("data", (chunk) => {
        const s = chunk.toString();
        if (s.includes("fatal")) reject(new Error(`server fatal: ${s}`));
      });
      setTimeout(() => reject(new Error("timeout")), 10000);
    });
    proc.kill();

    const parsed = JSON.parse(response.trim().split("\n")[0]);
    expect(parsed.result.tools.length).toBe(2);
    const names = parsed.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("send_dm");
    expect(names).toContain("send_admin_alert");
  });
});
