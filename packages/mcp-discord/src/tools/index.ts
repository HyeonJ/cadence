import { ToolRegistry } from "../tool-registry.ts";
import { sendDmTool } from "./send-dm.ts";

export const registry = new ToolRegistry();
registry.register(sendDmTool);
