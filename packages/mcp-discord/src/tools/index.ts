import { ToolRegistry } from "../tool-registry.ts";
import { sendDmTool } from "./send-dm.ts";
import { sendAdminAlertTool } from "./send-admin-alert.ts";

export const registry = new ToolRegistry();
registry.register(sendDmTool);
registry.register(sendAdminAlertTool);
