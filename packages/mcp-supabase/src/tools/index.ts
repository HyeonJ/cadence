import { ToolRegistry } from "../tool-registry.ts";
import { addBackboneItemTool } from "./add-backbone-item.ts";
import { getActiveSprintTool } from "./get-active-sprint.ts";
import { getTodayBackboneTool } from "./get-today-backbone.ts";
import { getYesterdaySignalsTool } from "./get-yesterday-signals.ts";
import { listBackboneTool } from "./list-backbone.ts";
import { updateBackboneItemTool } from "./update-backbone-item.ts";
import { upsertDailyCardTool } from "./upsert-daily-card.ts";
import { upsertYesterdaySignalsTool } from "./upsert-yesterday-signals.ts";

export const registry = new ToolRegistry();
registry.register(getActiveSprintTool);
registry.register(getTodayBackboneTool);
registry.register(getYesterdaySignalsTool);
registry.register(upsertDailyCardTool);
registry.register(upsertYesterdaySignalsTool);
registry.register(listBackboneTool);
registry.register(addBackboneItemTool);
registry.register(updateBackboneItemTool);
