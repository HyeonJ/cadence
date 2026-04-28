export * from "./enums.ts";
export { seedSprint1FromMarkdown } from "./seed/seed-sprint1.ts";
export { parseSprint1 } from "./seed/parse-report.ts";
export type { Database } from "./types.ts";
import type { Database } from "./types.ts";
export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];
