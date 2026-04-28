import { describe, it, expect, vi } from "vitest";

vi.mock("@cadence/mcp-supabase", () => ({
  listBackboneTool: { handler: vi.fn().mockResolvedValue({ items: [{ id: "x", week_index: 1 }] }) },
  addBackboneItemTool: { handler: vi.fn().mockResolvedValue({ id: "new-id" }) },
  updateBackboneItemTool: { handler: vi.fn().mockResolvedValue({ ok: true }) },
  removeBackboneItemTool: { handler: vi.fn().mockResolvedValue({ ok: true }) },
}));

const { backboneCommand } = await import("../../src/commands/backbone.ts");

describe("cadence backbone CLI", () => {
  it("list 호출 시 mcp-supabase listBackbone 위임", async () => {
    const cmd = backboneCommand();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await cmd.parseAsync(["node", "test", "list", "--sprint", "abc"]);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
