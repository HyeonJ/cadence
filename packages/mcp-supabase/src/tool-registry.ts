import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface ToolDef<I = unknown, O = unknown> {
  name: string;
  description: string;
  // ZodType<I> is too strict when schema uses .default() (input ≠ output type).
  // Use ZodTypeAny so callers can type Input via z.input<schema> while the
  // schema itself may have a different output type after parse.
  inputSchema: z.ZodTypeAny;
  outputSchema?: z.ZodTypeAny;
  handler: (input: I) => Promise<O>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDef>();

  register<I, O>(tool: ToolDef<I, O>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} already registered`);
    }
    this.tools.set(tool.name, tool as ToolDef);
  }

  list(): Array<{ name: string; description: string; inputSchema: object }> {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema, { target: "openApi3" }),
    }));
  }

  async call(name: string, rawInput: unknown): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    const parsed = tool.inputSchema.parse(rawInput);
    return tool.handler(parsed);
  }
}
