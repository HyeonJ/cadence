import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import { getServiceClient } from "../client.ts";

const ItemSchema = z.object({
  slot_key: z.enum([
    "weekday_morning_input",
    "weekday_evening_build",
    "weekend_deep",
    "weekend_share",
  ]),
  title: z.string().min(1),
  url: z.string().url().optional(),
  kind: z.enum(["manual_check", "auto_signal"]),
  auto_target: z.record(z.unknown()).optional(),
  status: z.enum(["pending", "done", "skipped", "auto_done"]).default("pending"),
  auto_detected: z.boolean().default(false),
  note: z.string().max(500).optional(),
});

const InputSchema = z.object({
  user_id: z.string().uuid(),
  date_kst: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sprint_id: z.string().uuid(),
  coach_comment: z.string().max(2000).optional(),
  fallback_used: z.boolean().default(false),
  generation_meta: z.record(z.unknown()).default({}),
  card_raw: z.record(z.unknown()).optional(),
  items: z.array(ItemSchema),
});
type Input = z.infer<typeof InputSchema>;

interface Output {
  daily_card_id: string;
}

export const upsertDailyCardTool: ToolDef<Input, Output> = {
  name: "upsert_daily_card",
  description:
    "user의 date_kst 일자 daily_card를 upsert (기존 row delete + insert). 정규화된 items도 함께 insert. 멱등.",
  inputSchema: InputSchema,
  handler: async (rawInput) => {
    // Zod default 적용 (handler 직접 호출 시에도 보장)
    const input = InputSchema.parse(rawInput);
    const client = getServiceClient();
    // 기존 daily_card 삭제 (cascade로 daily_card_items도 삭제)
    await client
      .from("daily_cards")
      .delete()
      .eq("user_id", input.user_id)
      .eq("date_kst", input.date_kst);

    const { data: cardRow, error: cardErr } = await client
      .from("daily_cards")
      .insert({
        user_id: input.user_id,
        date_kst: input.date_kst,
        sprint_id: input.sprint_id,
        coach_comment: input.coach_comment ?? null,
        fallback_used: input.fallback_used,
        generation_meta: input.generation_meta,
        card_raw: input.card_raw ?? null,
      })
      .select("id")
      .single();
    if (cardErr) throw new Error(`upsert_daily_card insert failed: ${cardErr.message}`);

    if (input.items.length > 0) {
      const itemRows = input.items.map((it) => ({
        daily_card_id: cardRow!.id,
        slot_key: it.slot_key,
        title: it.title,
        url: it.url ?? null,
        kind: it.kind,
        auto_target: it.auto_target ?? null,
        status: it.status,
        auto_detected: it.auto_detected,
        note: it.note ?? null,
      }));
      const { error: itemsErr } = await client.from("daily_card_items").insert(itemRows);
      if (itemsErr) throw new Error(`upsert_daily_card items failed: ${itemsErr.message}`);
    }

    return { daily_card_id: cardRow!.id };
  },
};
