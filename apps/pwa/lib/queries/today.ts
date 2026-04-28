import "server-only";
import type { Tables } from "@cadence/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface TodayDataItem {
  id: string;
  slot_key: Tables<"daily_card_items">["slot_key"];
  title: string;
  url: string | null;
  kind: Tables<"daily_card_items">["kind"];
  status: Tables<"daily_card_items">["status"];
  estimated_minutes: number | null;
  auto_target: Tables<"daily_card_items">["auto_target"];
}

type SprintRow = Pick<Tables<"sprints">, "id" | "name" | "start_date_kst" | "end_date_kst" | "status">;
type CardRow = Pick<Tables<"daily_cards">, "id" | "coach_comment" | "fallback_used">;
type ItemRow = Pick<
  Tables<"daily_card_items">,
  "id" | "slot_key" | "title" | "url" | "kind" | "status" | "auto_target"
>;
type SignalRow = Pick<Tables<"yesterday_signals">, "repo_commits" | "fetch_status">;

export interface TodayData {
  date_kst: string;
  sprint: SprintRow | null;
  card: CardRow | null;
  items: TodayDataItem[];
  yesterdaySignals: {
    repo_commits: Record<string, number>;
    fetch_status: string;
  } | null;
}

export async function fetchTodayData(date_kst: string): Promise<TodayData> {
  const supabase = await getSupabaseServerClient();

  // RLS: auth.uid() = user_id 자동 적용
  // 주의: @supabase/postgrest-js 2.105의 maybeSingle() 타입 추론 결함으로 'never' 반환.
  // overrideTypes 대신 명시적 캐스팅 (런타임 동작 동일).
  const sprintRes = await supabase
    .from("sprints")
    .select("id, name, start_date_kst, end_date_kst, status")
    .eq("status", "active")
    .order("start_date_kst", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sprint = sprintRes.data as SprintRow | null;

  const cardRes = await supabase
    .from("daily_cards")
    .select("id, coach_comment, fallback_used")
    .eq("date_kst", date_kst)
    .maybeSingle();
  const card = cardRes.data as CardRow | null;

  let items: TodayDataItem[] = [];
  if (card) {
    const itemsRes = await supabase
      .from("daily_card_items")
      .select("id, slot_key, title, url, kind, status, auto_target")
      .eq("daily_card_id", card.id);
    const rows = (itemsRes.data ?? []) as ItemRow[];
    items = rows.map((r) => ({
      id: r.id,
      slot_key: r.slot_key,
      title: r.title,
      url: r.url,
      kind: r.kind,
      status: r.status,
      estimated_minutes: null,
      auto_target: r.auto_target,
    }));
  }

  // 어제 신호
  const yesterday = previousDateKst(date_kst);
  const signalRes = await supabase
    .from("yesterday_signals")
    .select("repo_commits, fetch_status")
    .eq("date_kst", yesterday)
    .maybeSingle();
  const signal = signalRes.data as SignalRow | null;

  return {
    date_kst,
    sprint,
    card,
    items,
    yesterdaySignals: signal
      ? {
          repo_commits: (signal.repo_commits as Record<string, number>) ?? {},
          fetch_status: signal.fetch_status ?? "ok",
        }
      : null,
  };
}

function previousDateKst(date_kst: string): string {
  const d = new Date(`${date_kst}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
