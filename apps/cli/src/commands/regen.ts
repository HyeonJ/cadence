import { Command } from "commander";
import { runDailyCardGeneration } from "@cadence/routine";

export function regenCommand(): Command {
  return new Command("regen")
    .description("강제 재생성 (기존 카드 delete + 신규 generate)")
    .requiredOption("--date <ymd>", "date_kst")
    .requiredOption("--user <uuid>", "user_id")
    .option("--force", "기존 카드 있어도 삭제 후 재생성", false)
    .action(async (opts: { date: string; user: string; force: boolean }) => {
      // upsert_daily_card는 멱등 — delete + insert. force flag는 미래 방어용.
      const result = await runDailyCardGeneration({ userId: opts.user, date_kst: opts.date });
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(result, null, 2));
    });
}
