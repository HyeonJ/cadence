import { ToolRegistry } from "../tool-registry.ts";
import { getActiveSprintTool } from "./get-active-sprint.ts";

export const registry = new ToolRegistry();
registry.register(getActiveSprintTool);
