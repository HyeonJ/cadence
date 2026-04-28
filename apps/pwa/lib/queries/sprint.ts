import "server-only";
import type { Tables } from "@cadence/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface SprintProgressDay {
  date_kst: string;
  done_count: number;
  has_card: boolean;
  is_today: boolean;
}

export interface SprintProgressData {
  sprint: Pick<Tables<"sprints">, "id" | "name" | "start_date_kst" | "end_date_kst" | "status">;
  totals: {
    inputDone: number;
    inputTotal: number;
    buildDone: number;
    buildTotal: number;
    shareDone: number;
    shareTotal: number;
  };
  days: SprintProgressDay[];
  todayIndex: number;
}

export async function fetchSprintProgress(date_kst: string): Promise<SprintProgressData | null> {
  const supabase = await getSupabaseServerClient();

  const sprintRes = await supabase
    .from("sprints")
    .select("id, name, start_date_kst, end_date_kst, status")
    .eq("status", "active")
    .order("start_date_kst", { ascending: false })
    .limit(1)
    .maybeSingle();
  // 주의: supabase-js 2.105 type inference 회피 — Pick으로 캐스트
  const sprint = sprintRes.data as Pick<Tables<"sprints">, "id" | "name" | "start_date_kst" | "end_date_kst" | "status"> | null;
  if (!sprint) return null;

  const backboneRes = await supabase
    .from("sprint_backbone_items")
    .select("slot_key, week_index, day_of_week_mask")
    .eq("sprint_id", sprint.id)
    .or(`effective_until.is.null,effective_until.gte.${date_kst}`);
  const backbone = (backboneRes.data ?? []) as Array<{ slot_key: string; week_index: number; day_of_week_mask: number }>;

  function popcount(n: number): number {
    let c = 0;
    while (n) { c += n & 1; n >>= 1; }
    return c;
  }
  const totals = { input: 0, build: 0, share: 0 };
  for (const b of backbone) {
    const occurrences = popcount(b.day_of_week_mask ?? 0);
    if (b.slot_key === "weekday_morning_input") totals.input += occurrences;
    else if (b.slot_key === "weekday_evening_build" || b.slot_key === "weekend_deep") totals.build += occurrences;
    else if (b.slot_key === "weekend_share") totals.share += occurrences;
  }

  const cardsRes = await supabase
    .from("daily_cards")
    .select("id, date_kst")
    .gte("date_kst", sprint.start_date_kst)
    .lte("date_kst", sprint.end_date_kst);
  const cards = (cardsRes.data ?? []) as Array<{ id: string; date_kst: string }>;

  const cardIds = cards.map((c) => c.id);
  let allItems: Array<{ daily_card_id: string; slot_key: string; status: string }> = [];
  if (cardIds.length > 0) {
    const itemsRes = await supabase
      .from("daily_card_items")
      .select("daily_card_id, slot_key, status")
      .in("daily_card_id", cardIds);
    allItems = (itemsRes.data ?? []) as Array<{ daily_card_id: string; slot_key: string; status: string }>;
  }

  const cardByDate = new Map<string, string>();
  for (const c of cards) cardByDate.set(c.date_kst, c.id);

  const itemsByCard = new Map<string, typeof allItems>();
  for (const it of allItems) {
    const arr = itemsByCard.get(it.daily_card_id) ?? [];
    arr.push(it);
    itemsByCard.set(it.daily_card_id, arr);
  }

  const days: SprintProgressDay[] = [];
  const startMs = new Date(`${sprint.start_date_kst}T00:00:00Z`).getTime();
  for (let i = 0; i < 30; i++) {
    const d = new Date(startMs + i * 24 * 60 * 60 * 1000);
    const ymd = d.toISOString().slice(0, 10);
    const cardId = cardByDate.get(ymd);
    const items = cardId ? itemsByCard.get(cardId) ?? [] : [];
    const doneCount = items.filter((i) => i.status === "done" || i.status === "auto_done").length;
    days.push({
      date_kst: ymd,
      done_count: doneCount,
      has_card: !!cardId,
      is_today: ymd === date_kst,
    });
  }

  const totalsDone = { input: 0, build: 0, share: 0 };
  for (const it of allItems) {
    if (it.status !== "done" && it.status !== "auto_done") continue;
    if (it.slot_key === "weekday_morning_input") totalsDone.input++;
    else if (it.slot_key === "weekday_evening_build" || it.slot_key === "weekend_deep") totalsDone.build++;
    else if (it.slot_key === "weekend_share") totalsDone.share++;
  }

  const todayIndex = days.findIndex((d) => d.is_today);

  return {
    sprint,
    totals: {
      inputDone: totalsDone.input,
      inputTotal: totals.input,
      buildDone: totalsDone.build,
      buildTotal: totals.build,
      shareDone: totalsDone.share,
      shareTotal: totals.share,
    },
    days,
    todayIndex: todayIndex < 0 ? 0 : todayIndex,
  };
}
