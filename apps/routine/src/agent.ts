import Anthropic from "@anthropic-ai/sdk";
import {
  getActiveSprintTool,
  getTodayBackboneTool,
  getYesterdaySignalsTool,
  upsertDailyCardTool,
  upsertYesterdaySignalsTool,
} from "@cadence/mcp-supabase";
import {
  getUserEventsYesterdayTool,
  getRepoCommitsYesterdayTool,
} from "@cadence/mcp-github";
import { sendDmTool } from "@cadence/mcp-discord";
import { SYSTEM_PROMPT } from "./prompts/system.ts";
import {
  buildSprintContext,
  buildTodayBlock,
  buildSignalsBlock,
  buildUserDataBlock,
} from "./prompts/build-context.ts";
import { DailyCardResponseSchema } from "./schema/daily-card.ts";
import type { DailyCardResponse } from "./schema/daily-card.ts";
import { validateAgainstBackbone } from "./schema/validate.ts";
import { buildStaticFallback } from "./fallback/static-card.ts";
import { todayKst, yesterdayKst, weekIndexFor, dayOfWeekFor } from "./utils/tz.ts";
import { logger } from "./utils/logger.ts";
import type { SlotKey } from "@cadence/db";

export interface RunInput {
  userId: string;
  date_kst?: string;
}

export interface RunResult {
  daily_card_id?: string;
  fallback_used: boolean;
  skipped?: boolean;
}

interface UsageMeta {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export async function runDailyCardGeneration(input: RunInput): Promise<RunResult> {
  const date_kst = input.date_kst ?? todayKst();
  const yesterday = yesterdayKst();
  logger.info({ stage: "init", user_id: input.userId, date_kst });

  // STAGE 1 — prepare
  const { sprint } = await getActiveSprintTool.handler({ user_id: input.userId });
  if (!sprint) {
    logger.warn({ stage: "prepare", msg: "no active sprint, skip" });
    return { fallback_used: false, skipped: true };
  }
  const week_index = weekIndexFor(sprint.start_date_kst, date_kst);
  const day_of_week = dayOfWeekFor(date_kst);

  const [{ items: backboneItems }, { signals: prevSignals }] = await Promise.all([
    getTodayBackboneTool.handler({
      sprint_id: sprint.id,
      date_kst,
      week_index,
      day_of_week,
    }),
    getYesterdaySignalsTool.handler({ user_id: input.userId, date_kst: yesterday }),
  ]);
  // prevSignals is currently unused; reserved for future logic (manual_checks could derive from it).
  void prevSignals;

  // GitHub signals (env-driven for MVP; user_settings table in future plan)
  const github_username = process.env.COACH_GITHUB_USERNAME;
  const monitored_repos = (process.env.COACH_MONITORED_REPOS ?? "").split(",").filter(Boolean);

  let github_events_count = 0;
  let repo_commits: Record<string, number> = {};
  let fetch_status: "ok" | "rate_limited" | "5xx" | "partial" = "ok";

  if (github_username) {
    const events = await getUserEventsYesterdayTool.handler({
      github_username,
      date_kst: yesterday,
    });
    github_events_count = events.events_count;
    fetch_status = events.fetch_status;
    if (monitored_repos.length > 0) {
      const commits = await getRepoCommitsYesterdayTool.handler({
        github_username,
        monitored_repos,
        date_kst: yesterday,
      });
      repo_commits = commits.commits;
      if (commits.fetch_status !== "ok") fetch_status = commits.fetch_status;
    }
  }

  await upsertYesterdaySignalsTool.handler({
    user_id: input.userId,
    date_kst: yesterday,
    github_events_count,
    repo_commits,
    blog_new_posts: 0,
    fetch_status,
  });

  // STAGE 2 — llm_call (raw Anthropic SDK)
  const backboneIds = new Set(backboneItems.map((i) => i.id));
  const sprintContextBlock = buildSprintContext({
    name: sprint.name,
    start_date_kst: sprint.start_date_kst,
    end_date_kst: sprint.end_date_kst,
    evergreen_targets: sprint.evergreen_targets,
    frontier_targets: sprint.frontier_targets,
    backbone_summary: summarizeBackbone(backboneItems),
  });
  const todayBlock = buildTodayBlock({
    date_kst,
    week_index,
    day_of_week,
    active_slots: Array.from(new Set(backboneItems.map((i) => i.slot_key))),
    backbone_items: backboneItems,
  });
  const manualChecks = await fetchYesterdayManualChecks(input.userId, yesterday);
  const signalsBlock = buildSignalsBlock({
    github_events_count,
    repo_commits,
    fetch_status,
    manual_checks: manualChecks,
  });
  const userDataBlock = buildUserDataBlock(
    "note_yesterday",
    (await fetchYesterdayNote(input.userId, yesterday)) ?? ""
  );

  const userMessage = `${todayBlock}\n\n${signalsBlock}\n\n${userDataBlock}\n\n<task>Generate today's card as JSON matching DailyCardResponse schema.</task>`;

  let cardData: DailyCardResponse;
  let fallback_used = false;
  let usage: UsageMeta = {};

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY env required");
    const client = new Anthropic({ apiKey });
    // SDK 0.32 TextBlockParam 타입에는 cache_control 미노출. 런타임 필드는 그대로 전송됨.
    const systemBlocks = [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: sprintContextBlock, cache_control: { type: "ephemeral" } },
    ] as unknown as Anthropic.TextBlockParam[];
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      system: systemBlocks,
      messages: [{ role: "user", content: userMessage }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("LLM returned no text block");
    }
    const rawText = textBlock.text;
    const parsed = DailyCardResponseSchema.parse(JSON.parse(rawText));
    validateAgainstBackbone(parsed, backboneIds);
    cardData = parsed;
    // SDK 0.32 Usage 타입에 cache_* 필드 미노출 — 런타임에는 응답에 포함.
    usage = response.usage as unknown as UsageMeta;
    logger.info({ stage: "llm_call", usage });
  } catch (err) {
    logger.warn({ stage: "llm_call", msg: "fallback triggered", error: String(err) });
    fallback_used = true;
    cardData = buildStaticFallback({
      backbone_items: backboneItems.map((b) => ({
        id: b.id,
        slot_key: b.slot_key as SlotKey,
        content: b.content as { title: string; url?: string; estimated_minutes: number },
      })),
      signals: { github_events_count, repo_commits, fetch_status },
    });
  }

  // STAGE 3 — persist
  const { daily_card_id } = await upsertDailyCardTool.handler({
    user_id: input.userId,
    date_kst,
    sprint_id: sprint.id,
    coach_comment: cardData.coach_comment,
    fallback_used,
    generation_meta: { ...usage, fallback_used },
    items: cardData.items.map((it) => ({
      slot_key: it.slot_key,
      title: it.title,
      url: it.url,
      kind: it.kind,
      auto_target: it.auto_target as Record<string, unknown> | undefined,
      source_backbone_id: it.source_backbone_id,
    })),
  });

  // STAGE 4 — notify
  const webhook = await fetchUserDiscordWebhook(input.userId);
  if (webhook) {
    const summary = `${date_kst} 오늘 카드 ${fallback_used ? "(자동 fallback)" : ""}\n${cardData.coach_comment.slice(0, 200)}\n${process.env.COACH_PWA_URL ?? ""}/today`;
    await sendDmTool.handler({ webhook_url: webhook, content: summary });
  }

  return { daily_card_id, fallback_used };
}

// ===== helpers =====
function summarizeBackbone(
  items: { week_index: number; slot_key: string; content: unknown }[]
): string {
  const byWeek = new Map<number, string[]>();
  for (const it of items) {
    const arr = byWeek.get(it.week_index) ?? [];
    arr.push(`  - [${it.slot_key}] ${(it.content as { title: string }).title}`);
    byWeek.set(it.week_index, arr);
  }
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a - b)
    .map(([w, lines]) => `W${w}:\n${lines.join("\n")}`)
    .join("\n");
}

async function fetchYesterdayManualChecks(
  _userId: string,
  _date_kst: string
): Promise<Record<string, "pending" | "done" | "skipped" | "auto_done">> {
  // MVP simplification: return empty. Future plan adds dedicated tool.
  return {};
}

async function fetchYesterdayNote(_userId: string, _date_kst: string): Promise<string | null> {
  // PWA (Plan 04) will let user enter notes; for now, no source.
  return null;
}

async function fetchUserDiscordWebhook(_userId: string): Promise<string | null> {
  // user_settings table support coming later; MVP uses env fallback.
  return process.env.DISCORD_WEBHOOK_URL ?? null;
}
