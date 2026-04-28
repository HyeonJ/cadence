#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "cadence-supabase", version: "0.0.1" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [], // 채워질 예정 (Task 3+)
}));

server.setRequestHandler(CallToolRequestSchema, async () => {
  throw new Error("No tools registered yet");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[mcp-supabase] connected\n");
}

main().catch((err) => {
  process.stderr.write(`[mcp-supabase] fatal: ${err}\n`);
  process.exit(1);
});
