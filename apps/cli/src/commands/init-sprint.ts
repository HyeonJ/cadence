import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { seedSprint1FromMarkdown, type Database } from "@cadence/db";

export function initSprintCommand(): Command {
  return new Command("init-sprint")
    .description("report.md §5.4 파싱 + Sprint 1 시드")
    .requiredOption("--from <path>", "report.md 파일 경로")
    .requiredOption("--user <uuid>", "user_id")
    .action(async (opts: { from: string; user: string }) => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env required");
      const client = createClient<Database>(url, key);
      const md = await readFile(opts.from, "utf-8");
      const sprintId = await seedSprint1FromMarkdown(client, opts.user, md);
      // eslint-disable-next-line no-console
      console.log(`Sprint seeded: ${sprintId}`);
    });
}
