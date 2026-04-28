import type { DailyCardResponse, DailyCardItem } from "../schema/daily-card.ts";
import type { SlotKey } from "@cadence/db";

interface BackboneItemLite {
  id: string;
  slot_key: SlotKey;
  content: { title: string; url?: string; estimated_minutes: number };
}

interface SignalsLite {
  github_events_count: number;
  repo_commits: Record<string, number>;
  fetch_status: "ok" | "rate_limited" | "5xx" | "partial";
}

const ZERO_REST_QUOTES = [
  "오늘은 페이스 유지. 무리할 필요 없음.",
  "어제 진행 0건. 오늘은 첫 한 발만 떼는 걸 목표로.",
  "쉬어가는 날이어도 OK. 인풋 1건만이라도.",
];

export function buildStaticFallback(input: {
  backbone_items: BackboneItemLite[];
  signals: SignalsLite;
}): DailyCardResponse {
  const { backbone_items, signals } = input;

  let coach_comment: string;
  if (signals.fetch_status !== "ok") {
    coach_comment = `(자동 fallback) 어제 신호 fetch 실패 (${signals.fetch_status}) — 진행 상황 미확인. 백본 그대로 진행.`;
  } else {
    const totalCommits = Object.values(signals.repo_commits).reduce((a, b) => a + b, 0);
    if (totalCommits === 0 && signals.github_events_count === 0) {
      const quote = ZERO_REST_QUOTES[Math.floor(Math.random() * ZERO_REST_QUOTES.length)];
      coach_comment = `(자동 fallback) ${quote}`;
    } else {
      coach_comment = `(자동 fallback) 어제 commit ${totalCommits}건. 백본 그대로 진행.`;
    }
  }

  const items: DailyCardItem[] = backbone_items.map((b) => ({
    source_backbone_id: b.id,
    slot_key: b.slot_key,
    title: b.content.title,
    url: b.content.url,
    kind: "manual_check",
    estimated_minutes: b.content.estimated_minutes,
  }));

  return { coach_comment, items };
}
