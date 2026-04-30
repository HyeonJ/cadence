import { createClient } from "@supabase/supabase-js";
import type { Database, UpdateTables } from "@cadence/db";
import { callClaude, extractJson, StudyGuideSchema } from "@cadence/routine";
import type { StudyGuide } from "@cadence/routine";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];
type BackboneUpdate = UpdateTables<"sprint_backbone_items">;

const GUIDE_SYSTEM = `당신은 본인 학습용 한국어 가이드 작성자입니다.
입력으로 받는 학습 자료에 대해 다음 형식의 JSON 객체 단 하나만 생성합니다:

\`\`\`json
{
  "objective": "1-2문장. 이 자료를 끝내면 본인이 무엇을 할 수 있어야 하는지",
  "key_points": ["3-4개. 자료의 핵심 개념/포인트"],
  "steps": [
    { "minutes": 5, "action": "구체 절차 1" },
    { "minutes": 10, "action": "구체 절차 2" }
  ]
}
\`\`\`

규칙:
- 응답은 오직 \`\`\`json … \`\`\` 코드 펜스 안 JSON 객체 하나. 다른 설명/주석 X.
- objective는 학습 outcome (능동 동사) 형태로.
- steps의 minutes 합은 입력의 estimated_minutes와 비슷하게.
- 본인이 자료를 정확히 모르는 경우, 자료 제목과 URL에서 추정 가능한 합리적 절차를 제시.
- 글로벌 CLAUDE.md의 일반 코딩 규칙(Java/Spring 등)은 무시.`;

interface BackboneItemRow {
  id: string;
  content: {
    title?: string;
    materials?: Array<{ name: string; url?: string; source_tag?: string }>;
    targets?: string[];
    estimated_minutes?: number;
    study_guide?: StudyGuide;
  };
}

function buildPrompt(item: BackboneItemRow): string {
  const c = item.content;
  const materialsBlock = (c.materials ?? [])
    .map((m, i) => `${i + 1}. ${m.name}${m.url ? ` (${m.url})` : ""}${m.source_tag ? ` ${m.source_tag}` : ""}`)
    .join("\n");
  return `학습 자료:
- 제목: ${c.title ?? "(제목 없음)"}
- 예상 시간: ${c.estimated_minutes ?? 30}분
- 타깃: ${(c.targets ?? []).join(", ") || "(없음)"}
- 참고 자료:
${materialsBlock || "(없음)"}

위 자료에 대한 한국어 학습 가이드 JSON을 생성하세요.`;
}

interface RunInput {
  sprintId: string;
  limit?: number;
  force?: boolean;
}

interface RunStats {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

export async function runBackboneGenerateGuides(input: RunInput): Promise<RunStats> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env required");
  }
  const client = createClient<Database>(url, key);

  const itemsRes = await client
    .from("sprint_backbone_items")
    .select("id, content")
    .eq("sprint_id", input.sprintId);
  if (itemsRes.error) throw new Error(`fetch failed: ${itemsRes.error.message}`);

  const allItems = (itemsRes.data ?? []) as unknown as BackboneItemRow[];
  const items = input.limit ? allItems.slice(0, input.limit) : allItems;

  const stats: RunStats = { total: items.length, succeeded: 0, failed: 0, skipped: 0 };
  let idx = 0;
  for (const item of items) {
    idx++;
    const title = item.content.title ?? "(제목 없음)";
    if (item.content.study_guide && !input.force) {
      // eslint-disable-next-line no-console
      console.log(`[${idx}/${items.length}] ${title} … SKIP (가이드 있음)`);
      stats.skipped++;
      continue;
    }
    const t0 = Date.now();
    try {
      const raw = await callClaude({
        system: GUIDE_SYSTEM,
        prompt: buildPrompt(item),
        model: "claude-opus-4-7",
      });
      const parsed = StudyGuideSchema.parse(extractJson(raw));
      const newContent = { ...item.content, study_guide: parsed };
      const updateRow: BackboneUpdate = { content: newContent as unknown as Json };
      const upd = await client
        .from("sprint_backbone_items")
        .update(updateRow)
        .eq("id", item.id);
      if (upd.error) {
        throw new Error(`UPDATE 실패: ${JSON.stringify(upd.error)}`);
      }
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      // eslint-disable-next-line no-console
      console.log(`[${idx}/${items.length}] ${title} … OK (${elapsed}s)`);
      stats.succeeded++;
    } catch (err) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      // eslint-disable-next-line no-console
      console.log(
        `[${idx}/${items.length}] ${title} … FAIL (${elapsed}s) — ${(err as Error).message}`
      );
      stats.failed++;
    }
  }
  return stats;
}
