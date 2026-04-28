import { Command } from "commander";
import {
  listBackboneTool,
  addBackboneItemTool,
  updateBackboneItemTool,
  removeBackboneItemTool,
} from "@cadence/mcp-supabase";

export function backboneCommand(): Command {
  const cmd = new Command("backbone").description("Sprint backbone CRUD (L1)");

  cmd
    .command("list")
    .requiredOption("--sprint <uuid>")
    .option("--week <n>", "1~4")
    .option("--include-inactive")
    .action(async (opts) => {
      const result = await listBackboneTool.handler({
        sprint_id: opts.sprint,
        week_index: opts.week ? Number(opts.week) : undefined,
        include_inactive: !!opts.includeInactive,
      });
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(result.items, null, 2));
    });

  cmd
    .command("add")
    .requiredOption("--sprint <uuid>")
    .requiredOption("--week <n>")
    .requiredOption("--slot <key>")
    .requiredOption("--title <title>")
    .requiredOption("--minutes <n>")
    .option("--url <url>")
    .option("--mask <bitmask>", "day_of_week_mask (default 31=평일)", "31")
    .option("--effective-from <ymd>", "default today")
    .action(async (opts) => {
      const today = new Date().toISOString().slice(0, 10);
      const result = await addBackboneItemTool.handler({
        sprint_id: opts.sprint,
        week_index: Number(opts.week),
        slot_key: opts.slot,
        day_of_week_mask: Number(opts.mask),
        content: {
          title: opts.title,
          materials: opts.url ? [{ name: opts.title, url: opts.url }] : [],
          targets: [],
          estimated_minutes: Number(opts.minutes),
        },
        order_in_week: 99,
        effective_from: opts.effectiveFrom ?? today,
      });
      // eslint-disable-next-line no-console
      console.log(`Added: ${result.id}`);
    });

  cmd
    .command("update")
    .requiredOption("--id <uuid>")
    .option("--title <title>")
    .option("--minutes <n>")
    .option("--order <n>")
    .action(async (opts) => {
      const patch: Parameters<typeof updateBackboneItemTool.handler>[0]["patch"] = {};
      if (opts.title || opts.minutes) {
        patch.content = {
          ...(opts.title && { title: opts.title }),
          ...(opts.minutes && { estimated_minutes: Number(opts.minutes) }),
        };
      }
      if (opts.order !== undefined) patch.order_in_week = Number(opts.order);
      await updateBackboneItemTool.handler({ item_id: opts.id, patch });
      // eslint-disable-next-line no-console
      console.log("Updated");
    });

  cmd
    .command("remove")
    .requiredOption("--id <uuid>")
    .option("--effective-until <ymd>", "default today")
    .action(async (opts) => {
      const today = new Date().toISOString().slice(0, 10);
      await removeBackboneItemTool.handler({
        item_id: opts.id,
        effective_until: opts.effectiveUntil ?? today,
      });
      // eslint-disable-next-line no-console
      console.log("Removed (soft delete)");
    });

  return cmd;
}
