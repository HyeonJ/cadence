import { ToolRegistry } from "../tool-registry.ts";
import { getUserEventsYesterdayTool } from "./get-user-events-yesterday.ts";

export const registry = new ToolRegistry();
registry.register(getUserEventsYesterdayTool);
