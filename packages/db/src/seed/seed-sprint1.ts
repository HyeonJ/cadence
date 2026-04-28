import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types.ts";
import { parseSprint1 } from "./parse-report.ts";

export async function seedSprint1FromMarkdown(
  client: SupabaseClient<Database>,
  userId: string,
  markdown: string
): Promise<string> {
  const parsed = parseSprint1(markdown);

  const { data: sprintRow, error: sprintError } = await client
    .from("sprints")
    .insert({
      user_id: userId,
      name: parsed.name,
      start_date_kst: parsed.start_date_kst,
      end_date_kst: parsed.end_date_kst,
      status: "active",
      source_md_path: "report.md§5.4",
      evergreen_targets: parsed.evergreen_targets,
      frontier_targets: parsed.frontier_targets,
      toy_project_repo: parsed.toy_project_repo,
    })
    .select("id")
    .single();
  if (sprintError) throw sprintError;
  if (!sprintRow) throw new Error("sprint insert returned no row");

  const sprintId = sprintRow.id;

  const itemRows = parsed.backbone_items.map((item) => ({
    sprint_id: sprintId,
    week_index: item.week_index,
    slot_key: item.slot_key,
    day_of_week_mask: item.day_of_week_mask,
    content: item.content,
    order_in_week: item.order_in_week,
    effective_from: parsed.start_date_kst,
  }));

  const { error: itemsError } = await client
    .from("sprint_backbone_items")
    .insert(itemRows);
  if (itemsError) throw itemsError;

  return sprintId;
}
