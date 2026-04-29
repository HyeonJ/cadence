import "server-only";
import type { Tables } from "@cadence/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface BackboneMaterial {
  name: string;
  url?: string;
  source_tag?: string;
}

export interface BackboneMeta {
  materials: BackboneMaterial[];
  targets: string[];
  estimated_minutes?: number;
  // 백본 자체의 title — daily_card_items.title과 보통 동일
  backbone_title?: string;
}

export interface TodayDataItem {
  id: string;
  slot_key: Tables<"daily_card_items">["slot_key"];
  title: string;
  url: string | null;
  kind: Tables<"daily_card_items">["kind"];
  status: Tables<"daily_card_items">["status"];
  estimated_minutes: number | null;
  auto_target: Tables<"daily_card_items">["auto_target"];
  note: string | null;
  status_changed_at: string | null;
  source_backbone_id: string | null;
  backbone: BackboneMeta | null;
}

type SprintRow = Pick<Tables<"sprints">, "id" | "name" | "start_date_kst" | "end_date_kst" | "status">;
type CardRow = Pick<Tables<"daily_cards">, "id" | "coach_comment" | "fallback_used">;
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
      .select(
        "id, slot_key, title, url, kind, status, auto_target, note, status_changed_at, source_backbone_id"
      )
      .eq("daily_card_id", card.id);
    const rows = (itemsRes.data ?? []) as Array<{
      id: string;
      slot_key: string;
      title: string;
      url: string | null;
      kind: string;
      status: string;
      auto_target: unknown;
      note: string | null;
      status_changed_at: string | null;
      source_backbone_id: string | null;
    }>;

    // backbone JOIN — source_backbone_id가 있는 것만 모아서 1회 select
    const backboneIds = rows
      .map((r) => r.source_backbone_id)
      .filter((id): id is string => id !== null);
    const backboneMap = new Map<string, BackboneMeta>();
    if (backboneIds.length > 0) {
      const bbRes = await supabase
        .from("sprint_backbone_items")
        .select("id, content")
        .in("id", backboneIds);
      const bbRows = (bbRes.data ?? []) as Array<{ id: string; content: unknown }>;
      for (const bb of bbRows) {
        const c = bb.content as
          | {
              title?: string;
              materials?: BackboneMaterial[];
              targets?: string[];
              estimated_minutes?: number;
            }
          | null;
        backboneMap.set(bb.id, {
          materials: c?.materials ?? [],
          targets: c?.targets ?? [],
          estimated_minutes: c?.estimated_minutes,
          backbone_title: c?.title,
        });
      }
    }

    items = rows.map((r) => {
      const bb = r.source_backbone_id ? backboneMap.get(r.source_backbone_id) ?? null : null;
      return {
        id: r.id,
        slot_key: r.slot_key as TodayDataItem["slot_key"],
        title: r.title,
        url: r.url,
        kind: r.kind as TodayDataItem["kind"],
        status: r.status as TodayDataItem["status"],
        estimated_minutes: bb?.estimated_minutes ?? null,
        auto_target: r.auto_target as TodayDataItem["auto_target"],
        note: r.note,
        status_changed_at: r.status_changed_at,
        source_backbone_id: r.source_backbone_id,
        backbone: bb,
      };
    });
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
