import { ToolRegistry } from "../tool-registry.ts";
import { getActiveSprintTool } from "./get-active-sprint.ts";
import { getTodayBackboneTool } from "./get-today-backbone.ts";

export const registry = new ToolRegistry();
registry.register(getActiveSprintTool);
registry.register(getTodayBackboneTool);
