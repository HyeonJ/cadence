#!/usr/bin/env node
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, "..", "..", "..", ".env"), override: true });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { registry } from "./tools/index.ts";

const server = new Server(
  { name: "cadence-github", version: "0.0.1" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: registry.list(),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const result = await registry.call(req.params.name, req.params.arguments ?? {});
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[mcp-github] connected\n");
}

main().catch((err) => {
  process.stderr.write(`[mcp-github] fatal: ${err}\n`);
  process.exit(1);
});
