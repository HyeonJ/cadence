import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = join(__dirname, "../src/server.ts");

describe("mcp-supabase server integration", () => {
    it("stdio로 ListTools 호출 시 9 도구 반환", async () => {
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
                const text = chunk.toString();
                if (text.includes("fatal")) reject(new Error(`Server fatal: ${text}`));
            });
            setTimeout(() => reject(new Error("timeout")), 10000);
        });
        proc.kill();

        const parsed = JSON.parse(response.trim().split("\n")[0]);
        expect(parsed.result.tools.length).toBe(9);
        const names = parsed.result.tools.map((t: { name: string }) => t.name);
        expect(names).toContain("get_active_sprint");
        expect(names).toContain("add_backbone_item");
    });
});
