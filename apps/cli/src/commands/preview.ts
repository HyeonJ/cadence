import { Command } from "commander";
import { getActiveSprintTool } from "@cadence/mcp-supabase";

export function previewCommand(): Command {
  return new Command("preview")
    .description("LLM 호출 없이 그날 입력 블록만 빌드해서 stdout (디버깅)")
    .requiredOption("--date <ymd>", "date_kst (YYYY-MM-DD)")
    .requiredOption("--user <uuid>", "user_id")
    .action(async (opts: { date: string; user: string }) => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error("env required");
      const { sprint } = await getActiveSprintTool.handler({ user_id: opts.user });
      if (!sprint) {
        // eslint-disable-next-line no-console
        console.log("(no active sprint)");
        return;
      }
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ sprint, date_kst: opts.date }, null, 2));
    });
}
