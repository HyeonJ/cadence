import { ToolRegistry } from "../tool-registry.ts";
import { getActiveSprintTool } from "./get-active-sprint.ts";
import { getTodayBackboneTool } from "./get-today-backbone.ts";
import { getYesterdaySignalsTool } from "./get-yesterday-signals.ts";

export const registry = new ToolRegistry();
registry.register(getActiveSprintTool);
registry.register(getTodayBackboneTool);
registry.register(getYesterdaySignalsTool);
