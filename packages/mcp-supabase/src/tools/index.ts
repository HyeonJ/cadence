import { ToolRegistry } from "../tool-registry.ts";
import { getActiveSprintTool } from "./get-active-sprint.ts";
import { getTodayBackboneTool } from "./get-today-backbone.ts";
import { getYesterdaySignalsTool } from "./get-yesterday-signals.ts";
import { upsertDailyCardTool } from "./upsert-daily-card.ts";

export const registry = new ToolRegistry();
registry.register(getActiveSprintTool);
registry.register(getTodayBackboneTool);
registry.register(getYesterdaySignalsTool);
registry.register(upsertDailyCardTool);
