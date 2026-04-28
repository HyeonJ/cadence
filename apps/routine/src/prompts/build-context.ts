import type { Tables } from "@cadence/db";

export interface SprintContext {
  name: string;
  start_date_kst: string;
  end_date_kst: string;
  evergreen_targets: string[];
  frontier_targets: string[];
  backbone_summary: string; // ~1K 토큰 압축
}

export function buildSprintContext(ctx: SprintContext): string {
  return `<sprint_context>
${ctx.name} (${ctx.start_date_kst} ~ ${ctx.end_date_kst})
Evergreen targets: ${ctx.evergreen_targets.join(", ")}
Frontier targets: ${ctx.frontier_targets.join(", ")}

backbone_summary:
${ctx.backbone_summary}
</sprint_context>`;
}

export interface TodayBlock {
  date_kst: string;
  week_index: number;
  day_of_week: number;
  active_slots: string[];
  backbone_items: Array<Pick<Tables<"sprint_backbone_items">, "id" | "slot_key" | "content">>;
}

export function buildTodayBlock(t: TodayBlock): string {
  const items = t.backbone_items
    .map((i) => `  - id=${i.id} slot=${i.slot_key} title="${(i.content as { title: string }).title}"`)
    .join("\n");
  return `<today>
date_kst: ${t.date_kst}
week_index: ${t.week_index}
day_of_week: ${t.day_of_week} (Mon=0..Sun=6)
active_slots: [${t.active_slots.join(", ")}]
backbone_items:
${items}
</today>`;
}

export interface SignalsBlock {
  github_events_count: number;
  repo_commits: Record<string, number>;
  fetch_status: "ok" | "rate_limited" | "5xx" | "partial";
  fetch_error?: string | null;
  manual_checks: Record<string, "pending" | "done" | "skipped" | "auto_done">;
}

export function buildSignalsBlock(s: SignalsBlock): string {
  return `<signals_yesterday fetch_status="${s.fetch_status}"${s.fetch_error ? ` fetch_error="${s.fetch_error}"` : ""}>
github_events_count: ${s.github_events_count}
repo_commits: ${JSON.stringify(s.repo_commits)}
manual_checks: ${JSON.stringify(s.manual_checks)}
</signals_yesterday>`;
}

export function buildUserDataBlock(type: "note_yesterday" | "gate_entry" | "backbone_change_request", content: string): string {
  // content 안 따옴표/태그 escape
  const safe = content.replace(/<\/user_data>/gi, "</ user_data>").slice(0, 1000);
  return `<user_data type="${type}">
${safe}
</user_data>`;
}
