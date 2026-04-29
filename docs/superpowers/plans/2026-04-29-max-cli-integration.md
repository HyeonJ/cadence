# Cadence Max CLI 통합 + 학습 가이드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anthropic API SDK 호출을 Claude Code CLI subprocess로 전환 (API 충전 0 사용) + `sprint_backbone_items.content.study_guide` 한국어 학습 가이드 추가 + PWA detail 패널을 메타데이터 표시 → 학습 가이드 렌더로 교체.

**Architecture:** `apps/routine/src/utils/claude-cli.ts`에 `claude --print` 래퍼 + `extractJson` 파서. `agent.ts`는 `Anthropic.messages.create` 대신 `callClaude` 호출. `apps/cli/src/commands/backbone.ts`에 `generate-guides` 서브커맨드 추가하여 30 backbone item에 한국어 가이드 1회 생성. PWA `task-detail-panel.tsx`를 라우터로 만들고 `study-guide-panel.tsx`(신규) + `metadata-panel.tsx`(신규) 분리.

**Tech Stack:** Node.js 20 `child_process.spawn`, Zod 3, Vitest 2, 기존 monorepo 도구.

**Spec reference:** `docs/superpowers/specs/2026-04-29-max-cli-integration-design.md`.

---

## File Structure

**Create:**
- `apps/routine/src/utils/claude-cli.ts` — `callClaude()` + `extractJson()` 래퍼
- `apps/routine/tests/claude-cli.spec.ts` — `extractJson` 5개 케이스 + spawn mock 1 case
- `apps/routine/src/schema/study-guide.ts` — `StudyGuideSchema` (Zod) + 타입
- `apps/cli/src/commands/backbone-generate-guides.ts` — generate-guides 서브커맨드 핸들러
- `apps/cli/tests/commands/backbone-generate-guides.spec.ts` — 명령 테스트
- `apps/pwa/components/today/study-guide-panel.tsx` — 신규 가이드 패널
- `apps/pwa/components/today/metadata-panel.tsx` — 기존 metadata 표시 (기존 `task-detail-panel.tsx`에서 분리)
- `apps/pwa/tests/study-guide-panel.spec.tsx` — render 테스트

**Modify:**
- `apps/routine/package.json` — `@anthropic-ai/sdk` 의존성 제거
- `apps/routine/src/agent.ts` — `Anthropic` import + 호출 → `callClaude` + `extractJson`
- `apps/routine/tests/agent.spec.ts` — mock 대상을 `@anthropic-ai/sdk` → `@/utils/claude-cli`
- `apps/cli/src/commands/backbone.ts` — `generate-guides` 서브커맨드 등록
- `apps/pwa/lib/queries/today.ts` — `BackboneMeta`에 `study_guide?: StudyGuide` 추가
- `apps/pwa/components/today/task-detail-panel.tsx` — `study_guide` 있으면 `StudyGuidePanel` 라우팅, 없으면 `MetadataPanel`

---

## Task 1: claude-cli wrapper + extractJson + 단위 테스트

**Files:**
- Create: `apps/routine/src/utils/claude-cli.ts`
- Create: `apps/routine/tests/claude-cli.spec.ts`

- [ ] **Step 1: failing test `apps/routine/tests/claude-cli.spec.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { extractJson } from "../src/utils/claude-cli.ts";

describe("extractJson", () => {
  it("순수 JSON 객체", () => {
    const raw = '{"a":1,"b":"x"}';
    expect(extractJson(raw)).toEqual({ a: 1, b: "x" });
  });

  it("```json fence 안 JSON", () => {
    const raw = "응답:\n```json\n{\"a\":2}\n```\n끝.";
    expect(extractJson(raw)).toEqual({ a: 2 });
  });

  it("``` fence (lang 없음)", () => {
    const raw = "여기:\n```\n{\"x\":\"y\"}\n```";
    expect(extractJson(raw)).toEqual({ x: "y" });
  });

  it("fence 없고 prose + JSON 혼합", () => {
    const raw = "Sure, here's the response: {\"k\":3} hope this helps";
    expect(extractJson(raw)).toEqual({ k: 3 });
  });

  it("JSON 객체 없으면 throw", () => {
    expect(() => extractJson("plain text only")).toThrow(/no JSON object/);
  });
});
```

- [ ] **Step 2: run test (FAIL — module 없음)**

Run: `pnpm --filter @cadence/routine test claude-cli`
Expected: FAIL — module `../src/utils/claude-cli.ts` not found.

- [ ] **Step 3: implement `apps/routine/src/utils/claude-cli.ts`**

```typescript
import { spawn } from "node:child_process";

export interface CallClaudeInput {
  prompt: string;
  system?: string;
  model?: "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5";
  maxOutputBytes?: number;
  timeoutMs?: number;
}

const DEFAULT_MODEL: NonNullable<CallClaudeInput["model"]> = "claude-opus-4-7";
const DEFAULT_MAX_OUTPUT = 50_000;
const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * `claude --print` subprocess를 호출한다. Max 구독 인증 사용 (API 키 X).
 * stdout 누적이 maxOutputBytes 초과 또는 timeoutMs 초과 시 kill + reject.
 */
export async function callClaude(input: CallClaudeInput): Promise<string> {
  const {
    prompt,
    system,
    model = DEFAULT_MODEL,
    maxOutputBytes = DEFAULT_MAX_OUTPUT,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = input;

  return new Promise<string>((resolve, reject) => {
    const proc = spawn("claude", ["--print", "--model", model], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill();
      reject(new Error(`claude timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > maxOutputBytes) {
        killed = true;
        proc.kill();
        clearTimeout(timer);
        reject(new Error(`claude output exceeded ${maxOutputBytes} bytes`));
      }
    });
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (killed) return;
      if (code !== 0) {
        reject(new Error(`claude exit ${code}: ${stderr.slice(0, 500)}`));
      } else {
        resolve(stdout);
      }
    });

    const fullPrompt = system ? `${system}\n\n---\n\n${prompt}` : prompt;
    proc.stdin.write(fullPrompt);
    proc.stdin.end();
  });
}

/**
 * Claude Code CLI 응답에서 JSON 객체를 추출한다.
 * 1) ```json … ``` 또는 ``` … ``` 코드 펜스 안 우선
 * 2) 펜스 없으면 원문에서 첫 `{` 부터 마지막 `}` 추출
 * 3) JSON.parse 시도, 실패 또는 매칭 없음 시 throw
 */
export function extractJson(raw: string): unknown {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : raw;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("no JSON object found in response");
  }
  return JSON.parse(candidate.slice(first, last + 1));
}
```

- [ ] **Step 4: run test (PASS, 5 case)**

Run: `pnpm --filter @cadence/routine test claude-cli`
Expected: PASS — 5 tests green.

- [ ] **Step 5: commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/routine/src/utils/claude-cli.ts apps/routine/tests/claude-cli.spec.ts
git -C "C:/Dev/Workspace/cadence" commit -m "feat(routine): claude-cli subprocess wrapper + extractJson 5 case"
```

---

## Task 2: agent.ts를 callClaude로 전환 + Anthropic SDK 의존성 제거

**Files:**
- Modify: `apps/routine/src/agent.ts`
- Modify: `apps/routine/package.json`
- Modify: `apps/routine/tests/agent.spec.ts`

- [ ] **Step 1: agent.ts에서 Anthropic import 제거 + callClaude 사용**

`apps/routine/src/agent.ts` 수정:

기존 import 블록에서:
```typescript
import Anthropic from "@anthropic-ai/sdk";
```
→ 제거.

추가:
```typescript
import { callClaude, extractJson } from "./utils/claude-cli.ts";
```

기존 LLM 호출 블록 (대략 다음 형태):
```typescript
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY env required");
const client = new Anthropic({ apiKey });
const response = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 2000,
  system: [
    { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: sprintContextBlock, cache_control: { type: "ephemeral" } },
  ],
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
usage = response.usage as typeof usage;
logger.info({ stage: "llm_call", usage });
```

→ 다음으로 교체:
```typescript
const systemFull = `${SYSTEM_PROMPT}\n\n${sprintContextBlock}\n\n출력 규칙: 응답은 오직 \`\`\`json … \`\`\` 코드 펜스 안 단일 JSON 객체. 그 외 설명/주석 X. 글로벌 CLAUDE.md의 일반 코딩 규칙(Java/Spring 등)은 무시.`;
const rawText = await callClaude({
  system: systemFull,
  prompt: userMessage,
  model: "claude-opus-4-7",
});
const parsed = DailyCardResponseSchema.parse(extractJson(rawText));
validateAgainstBackbone(parsed, backboneIds);
cardData = parsed;
usage = {}; // Max CLI는 token 사용량 노출 X — 빈 객체 유지
logger.info({ stage: "llm_call", source: "claude-cli" });
```

`UsageMeta` interface가 있다면 `cache_read_input_tokens` 등 필드도 그대로 두고, runtime에서는 빈 객체를 넘긴다. `generation_meta` 컬럼에는 `{ source: "claude-cli", model: "claude-opus-4-7" }` 정도로 메타 기록.

- [ ] **Step 2: agent.spec.ts mock 변경**

기존 `apps/routine/tests/agent.spec.ts`의 `vi.mock("@anthropic-ai/sdk", ...)` 블록을 제거하고 다음으로 교체:

```typescript
vi.mock("@/utils/claude-cli", () => ({
  callClaude: vi.fn().mockResolvedValue(
    '```json\n' +
    JSON.stringify({
      coach_comment: "어제 commit 0건. 빌드 1h 우선.",
      items: [
        {
          source_backbone_id: "11111111-1111-1111-1111-111111111111",
          slot_key: "weekday_morning_input",
          title: "Agent SDK Quickstart",
          kind: "manual_check",
          estimated_minutes: 30,
        },
      ],
    }) +
    '\n```'
  ),
  extractJson: (await import("@/utils/claude-cli")).extractJson, // 실제 파서 사용
}));
```

> **Note:** alias `@` 가 이미 vitest.config에서 `apps/routine` 루트로 매핑되어 있어야 함. 안 매핑되어 있으면 상대 경로 `"../src/utils/claude-cli.ts"` 사용.
> 실제로 매핑이 없으면 기존 `vitest.config.ts`를 살펴 alias 규칙을 확인. apps/routine은 alias 미설정일 수 있으니 mock 경로를 `"../src/utils/claude-cli.ts"`로 바꿔주세요.

기존 시스템시간 fake (`vi.useFakeTimers`/`vi.setSystemTime("2026-05-01T00:00:00+09:00")`)는 그대로 둠. 실제 spawn은 mock으로 가짜 응답 → JSON 파싱 → cardData 검증.

`extractJson`은 실제 함수 사용을 위해 dynamic import로 끌어옴 (위 mock factory 안). 또는 더 간단하게 `vi.importActual`:

```typescript
vi.mock("../src/utils/claude-cli.ts", async () => {
  const actual = await vi.importActual<typeof import("../src/utils/claude-cli.ts")>("../src/utils/claude-cli.ts");
  return {
    ...actual,
    callClaude: vi.fn().mockResolvedValue(
      '```json\n' + JSON.stringify({ /* 위와 동일 */ }) + '\n```'
    ),
  };
});
```

- [ ] **Step 3: package.json에서 Anthropic SDK 제거**

`apps/routine/package.json`의 `dependencies`에서 `"@anthropic-ai/sdk": "^0.32.0"` 제거. 다른 deps는 그대로.

```bash
pnpm install
```

`pnpm-lock.yaml` 갱신.

- [ ] **Step 4: typecheck + 테스트**

Run:
```bash
pnpm --filter @cadence/routine typecheck
pnpm --filter @cadence/routine test
```

Expected: typecheck 0 error · 모든 routine 테스트 PASS (claude-cli 5 + agent 2 + 기존 = 약 13).

- [ ] **Step 5: commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/routine/src/agent.ts apps/routine/tests/agent.spec.ts apps/routine/package.json pnpm-lock.yaml
git -C "C:/Dev/Workspace/cadence" commit -m "refactor(routine): Anthropic SDK 제거 → claude-cli subprocess (Max 구독 사용)"
```

---

## Task 3: StudyGuide Zod 스키마

**Files:**
- Create: `apps/routine/src/schema/study-guide.ts`

> 이 스키마는 generate-guides CLI에서도 import해서 검증 사용. apps/routine에 두는 이유는 LLM 출력 검증 책임이 routine 도메인이기 때문 (CLI는 routine을 import 가능 — workspace dep).

- [ ] **Step 1: write `apps/routine/src/schema/study-guide.ts`**

```typescript
import { z } from "zod";

export const StudyGuideStepSchema = z.object({
  minutes: z.number().int().positive().max(180),
  action: z.string().min(3).max(300),
});

export const StudyGuideSchema = z.object({
  objective: z.string().min(10).max(500),
  key_points: z.array(z.string().min(3).max(200)).min(2).max(6),
  steps: z.array(StudyGuideStepSchema).min(1).max(10),
});

export type StudyGuide = z.infer<typeof StudyGuideSchema>;
export type StudyGuideStep = z.infer<typeof StudyGuideStepSchema>;
```

- [ ] **Step 2: re-export from `apps/routine/src/index.ts`** (CLI에서 import 위해)

`apps/routine/src/index.ts`에 추가:
```typescript
export { StudyGuideSchema, type StudyGuide, type StudyGuideStep } from "./schema/study-guide.ts";
```

(기존 `runDailyCardGeneration` export 유지.)

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @cadence/routine typecheck
```

Expected: 0 error.

- [ ] **Step 4: commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/routine/src/schema/study-guide.ts apps/routine/src/index.ts
git -C "C:/Dev/Workspace/cadence" commit -m "feat(routine): StudyGuide Zod schema (objective + key_points + steps)"
```

---

## Task 4: `cadence backbone generate-guides` CLI 명령

**Files:**
- Create: `apps/cli/src/commands/backbone-generate-guides.ts`
- Modify: `apps/cli/src/commands/backbone.ts` — 서브커맨드 등록

- [ ] **Step 1: write `apps/cli/src/commands/backbone-generate-guides.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@cadence/db";
import { callClaude, extractJson } from "@cadence/routine/utils/claude-cli";
import { StudyGuideSchema, type StudyGuide } from "@cadence/routine";

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
      const upd = await (client.from("sprint_backbone_items") as never)
        .update({ content: newContent })
        .eq("id", item.id);
      if ((upd as { error: unknown }).error) {
        throw new Error(`UPDATE 실패: ${JSON.stringify((upd as { error: unknown }).error)}`);
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
```

> **Workspace dep 주의**: `import ... from "@cadence/routine/utils/claude-cli"` 형태가 동작하려면 `apps/routine/package.json`이 subpath export를 정의해야 한다. 가장 단순한 해결: routine의 `src/index.ts`에서 `callClaude`/`extractJson`도 함께 re-export. 아래 Step 2.

- [ ] **Step 2: routine의 index.ts에서 callClaude/extractJson re-export**

`apps/routine/src/index.ts`에 추가 (Task 3에서 추가한 study-guide export 다음):
```typescript
export { callClaude, extractJson } from "./utils/claude-cli.ts";
export type { CallClaudeInput } from "./utils/claude-cli.ts";
```

→ Task 4 Step 1의 import 라인을 다음으로 교체:
```typescript
import { callClaude, extractJson, StudyGuideSchema } from "@cadence/routine";
import type { StudyGuide } from "@cadence/routine";
```

(기존 별도 import 두 줄 제거.)

- [ ] **Step 3: register subcommand in `apps/cli/src/commands/backbone.ts`**

기존 `backboneCommand()` 함수 안 (`cmd.command("remove") …` 등 다음에) 추가:

```typescript
import { runBackboneGenerateGuides } from "./backbone-generate-guides.ts";

// ... 기존 list/add/update/remove 블록 ...

cmd
  .command("generate-guides")
  .description("backbone item 30개에 한국어 학습 가이드 1회 생성 (Max CLI)")
  .requiredOption("--sprint <uuid>")
  .option("--limit <n>", "처음 N개만 처리 (테스트용)")
  .option("--force", "이미 가이드가 있는 항목도 재생성", false)
  .action(async (opts: { sprint: string; limit?: string; force: boolean }) => {
    const stats = await runBackboneGenerateGuides({
      sprintId: opts.sprint,
      limit: opts.limit ? Number(opts.limit) : undefined,
      force: opts.force,
    });
    // eslint-disable-next-line no-console
    console.log(
      `완료: ${stats.succeeded}/${stats.total} 성공, 실패 ${stats.failed}, skip ${stats.skipped}`
    );
  });
```

- [ ] **Step 4: typecheck**

Run:
```bash
pnpm --filter @cadence/cli typecheck
```

Expected: 0 error. 만약 `@cadence/routine` 의존이 없다고 나오면 `apps/cli/package.json`의 `dependencies`에 `"@cadence/routine": "workspace:*"` 추가 후 `pnpm install`.

- [ ] **Step 5: commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/cli/src/commands/backbone-generate-guides.ts apps/cli/src/commands/backbone.ts apps/routine/src/index.ts
# package.json 변경된 경우 함께
git -C "C:/Dev/Workspace/cadence" add apps/cli/package.json pnpm-lock.yaml 2>/dev/null || true
git -C "C:/Dev/Workspace/cadence" commit -m "feat(cli): cadence backbone generate-guides — 30 backbone에 한국어 가이드 1회 batch"
```

---

## Task 5: generate-guides CLI 단위 테스트

**Files:**
- Create: `apps/cli/tests/commands/backbone-generate-guides.spec.ts`

- [ ] **Step 1: write test**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
const mockSelect = vi.fn();
const mockFrom = vi.fn((_table: string) => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

const validGuideJson =
  '```json\n' +
  JSON.stringify({
    objective: "이 자료를 끝내면 X를 할 수 있어야 함.",
    key_points: ["A", "B", "C"],
    steps: [{ minutes: 30, action: "Y 진행" }],
  }) +
  '\n```';

vi.mock("@cadence/routine", () => ({
  callClaude: vi.fn().mockResolvedValue(validGuideJson),
  extractJson: (raw: string) => {
    const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(m ? m[1] : raw);
  },
  StudyGuideSchema: {
    parse: (v: unknown) => v,
  },
}));

import { runBackboneGenerateGuides } from "../../src/commands/backbone-generate-guides";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
});

describe("runBackboneGenerateGuides", () => {
  it("3개 backbone item에 가이드 채움 (force=false, 기존 가이드 없음)", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          { id: "i1", content: { title: "A", estimated_minutes: 30 } },
          { id: "i2", content: { title: "B", estimated_minutes: 60 } },
          { id: "i3", content: { title: "C", estimated_minutes: 90 } },
        ],
        error: null,
      }),
    });
    const stats = await runBackboneGenerateGuides({ sprintId: "s1" });
    expect(stats.total).toBe(3);
    expect(stats.succeeded).toBe(3);
    expect(stats.failed).toBe(0);
    expect(stats.skipped).toBe(0);
    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });

  it("기존 study_guide 있고 force=false면 skip", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: "i1",
            content: {
              title: "A",
              study_guide: { objective: "x", key_points: ["a", "b"], steps: [{ minutes: 30, action: "y" }] },
            },
          },
          { id: "i2", content: { title: "B" } },
        ],
        error: null,
      }),
    });
    const stats = await runBackboneGenerateGuides({ sprintId: "s1", force: false });
    expect(stats.skipped).toBe(1);
    expect(stats.succeeded).toBe(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("limit=1이면 첫 1개만 처리", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          { id: "i1", content: { title: "A" } },
          { id: "i2", content: { title: "B" } },
        ],
        error: null,
      }),
    });
    const stats = await runBackboneGenerateGuides({ sprintId: "s1", limit: 1 });
    expect(stats.total).toBe(1);
    expect(stats.succeeded).toBe(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: run + commit**

```bash
pnpm --filter @cadence/cli test
```

Expected: 모든 cli 테스트 PASS (기존 + 3 new).

```bash
git -C "C:/Dev/Workspace/cadence" add apps/cli/tests/commands/backbone-generate-guides.spec.ts
git -C "C:/Dev/Workspace/cadence" commit -m "test(cli): backbone generate-guides 3 case (success/skip/limit)"
```

---

## Task 6: PWA fetchTodayData에 study_guide 포함

**Files:**
- Modify: `apps/pwa/lib/queries/today.ts`

- [ ] **Step 1: BackboneMeta 인터페이스 확장**

`apps/pwa/lib/queries/today.ts`의 `BackboneMeta` 타입에 다음 추가:

```typescript
export interface StudyGuideStep {
  minutes: number;
  action: string;
}

export interface StudyGuide {
  objective: string;
  key_points: string[];
  steps: StudyGuideStep[];
}

export interface BackboneMeta {
  materials: BackboneMaterial[];
  targets: string[];
  estimated_minutes?: number;
  backbone_title?: string;
  study_guide?: StudyGuide; // NEW
}
```

- [ ] **Step 2: fetchTodayData에서 backbone JOIN 시 study_guide 추출**

이미 `select("id, content")`로 backbone item 전체 content를 받고 있다. backboneMap 빌드 부분에서 `study_guide`도 같이 빼낸다:

```typescript
for (const bb of bbRows) {
  const c = bb.content as {
    title?: string;
    materials?: BackboneMaterial[];
    targets?: string[];
    estimated_minutes?: number;
    study_guide?: StudyGuide;
  } | null;
  backboneMap.set(bb.id, {
    materials: c?.materials ?? [],
    targets: c?.targets ?? [],
    estimated_minutes: c?.estimated_minutes,
    backbone_title: c?.title,
    study_guide: c?.study_guide, // NEW
  });
}
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @cadence/pwa typecheck
```

Expected: 0 error.

- [ ] **Step 4: commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/lib/queries/today.ts
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): BackboneMeta.study_guide 추가 + fetchTodayData JOIN 확장"
```

---

## Task 7: PWA — StudyGuidePanel 컴포넌트

**Files:**
- Create: `apps/pwa/components/today/study-guide-panel.tsx`
- Create: `apps/pwa/tests/study-guide-panel.spec.tsx`

- [ ] **Step 1: failing test `apps/pwa/tests/study-guide-panel.spec.tsx`**

```tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StudyGuidePanel } from "@/components/today/study-guide-panel";
import type { StudyGuide } from "@/lib/queries/today";

afterEach(() => cleanup());

const SAMPLE: StudyGuide = {
  objective: "이 자료를 끝내면 X를 할 수 있어야 합니다.",
  key_points: ["포인트 A", "포인트 B", "포인트 C"],
  steps: [
    { minutes: 5, action: "README 읽기" },
    { minutes: 10, action: "예제 코드 보기" },
  ],
};

describe("StudyGuidePanel", () => {
  it("objective 표시", () => {
    render(<StudyGuidePanel guide={SAMPLE} url={null} />);
    expect(screen.getByText(/이 자료를 끝내면/)).toBeInTheDocument();
  });

  it("key_points 3개 모두 표시", () => {
    render(<StudyGuidePanel guide={SAMPLE} url={null} />);
    expect(screen.getByText("포인트 A")).toBeInTheDocument();
    expect(screen.getByText("포인트 B")).toBeInTheDocument();
    expect(screen.getByText("포인트 C")).toBeInTheDocument();
  });

  it("steps의 minutes/action 표시", () => {
    render(<StudyGuidePanel guide={SAMPLE} url={null} />);
    expect(screen.getByText("README 읽기")).toBeInTheDocument();
    expect(screen.getByText("예제 코드 보기")).toBeInTheDocument();
    expect(screen.getByText(/5분/)).toBeInTheDocument();
    expect(screen.getByText(/10분/)).toBeInTheDocument();
  });

  it("url 있으면 외부 링크 표시", () => {
    render(<StudyGuidePanel guide={SAMPLE} url="https://example.com/x" />);
    const link = screen.getByRole("link", { name: /example.com/ });
    expect(link).toHaveAttribute("href", "https://example.com/x");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
```

- [ ] **Step 2: run test (FAIL — 모듈 없음)**

Run: `pnpm --filter @cadence/pwa test study-guide-panel`
Expected: FAIL.

- [ ] **Step 3: implement `apps/pwa/components/today/study-guide-panel.tsx`**

```tsx
import * as React from "react";
import type { StudyGuide } from "@/lib/queries/today";

export function StudyGuidePanel({
  guide,
  url,
}: {
  guide: StudyGuide;
  url: string | null;
}): React.JSX.Element {
  return (
    <div className="px-4 py-4 bg-bg border-t border-hairline flex flex-col gap-4 text-[13px]">
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-[3px] decoration-[#BFDBFE] break-all hover:decoration-primary"
        >
          {stripScheme(url)}
        </a>
      )}

      <section className="flex flex-col gap-1.5">
        <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
          🎯 오늘의 목표
        </span>
        <p className="text-[13.5px] text-ink-2 leading-relaxed m-0">{guide.objective}</p>
      </section>

      <section className="flex flex-col gap-1.5">
        <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
          핵심 학습 포인트
        </span>
        <ul className="flex flex-col gap-1 m-0 pl-0 list-none">
          {guide.key_points.map((p, i) => (
            <li key={i} className="flex items-baseline gap-2 text-[12.5px] text-ink-2">
              <span className="text-sub">·</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-1.5">
        <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
          📚 학습 흐름
        </span>
        <ol className="flex flex-col gap-1.5 m-0 pl-0 list-none">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex items-baseline gap-3 text-[12.5px] text-ink-2">
              <span className="font-display tab text-sub w-10 flex-shrink-0">
                {s.minutes}분
              </span>
              <span className="flex-1">
                <span className="font-display text-sub mr-1.5">{i + 1}.</span>
                {s.action}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
```

- [ ] **Step 4: run test (PASS, 4 case)**

Run: `pnpm --filter @cadence/pwa test study-guide-panel`
Expected: PASS — 4 tests green.

- [ ] **Step 5: commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/today/study-guide-panel.tsx apps/pwa/tests/study-guide-panel.spec.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): StudyGuidePanel 컴포넌트 (목표 + 핵심 포인트 + 절차) + 4 case"
```

---

## Task 8: PWA — MetadataPanel 분리 + TaskDetailPanel 라우팅

**Files:**
- Create: `apps/pwa/components/today/metadata-panel.tsx`
- Modify: `apps/pwa/components/today/task-detail-panel.tsx`

- [ ] **Step 1: write `apps/pwa/components/today/metadata-panel.tsx`**

기존 `task-detail-panel.tsx`의 메타데이터 표시 부분(materials/targets/auto_target/estimated/note)을 그대로 추출. URL 표시는 `task-detail-panel.tsx`에서 공통으로 처리하므로 여기서는 빼고 URL props도 받지 않는다.

```tsx
"use client";
import * as React from "react";
import type { TodayDataItem } from "@/lib/queries/today";
import { Pill } from "@/components/pill";

export function MetadataPanel({
  item,
  noteInput,
  onNoteChange,
  onNoteSave,
  notePending,
  noteFeedback,
  readOnly = false,
}: {
  item: TodayDataItem;
  noteInput: string;
  onNoteChange: (v: string) => void;
  onNoteSave: () => void;
  notePending: boolean;
  noteFeedback: string | null;
  readOnly?: boolean;
}): React.JSX.Element {
  const auto = item.auto_target as { type?: string; repo?: string; min?: number } | null;
  const targets = item.backbone?.targets ?? [];
  const materials = item.backbone?.materials ?? [];
  const minutes = item.backbone?.estimated_minutes ?? item.estimated_minutes;

  return (
    <div className="px-4 py-4 bg-bg border-t border-hairline flex flex-col gap-3.5 text-[13px]">
      {item.kind === "auto_signal" && auto && (
        <div className="flex items-center gap-2 text-muted">
          <Pill variant="blue">AUTO</Pill>
          <span className="font-display tab text-[12px]">
            {auto.type === "commit_count" && auto.repo
              ? `${auto.repo} commit ≥ ${auto.min ?? 1}`
              : JSON.stringify(auto)}
          </span>
        </div>
      )}

      {materials.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
            자료
          </span>
          <ul className="flex flex-col gap-1 m-0 pl-0 list-none">
            {materials.map((m, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[12.5px]">
                <span className="text-sub">·</span>
                <div className="flex-1 min-w-0">
                  {m.url ? (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-2 hover:text-primary underline-offset-[3px] hover:underline"
                    >
                      {m.name}
                    </a>
                  ) : (
                    <span className="text-ink-2">{m.name}</span>
                  )}
                  {m.source_tag && (
                    <span className="ml-1.5 font-display text-[10.5px] text-sub">
                      {m.source_tag}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {targets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
            타깃
          </span>
          {targets.map((t) => (
            <Pill key={t} variant="default">
              {t}
            </Pill>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 font-display text-[11.5px] text-muted">
        {minutes !== null && minutes !== undefined && <span className="tab">예상 {minutes}분</span>}
        {item.status_changed_at && (
          <>
            <span className="text-sub">·</span>
            <span className="tab">상태 변경 {formatKstTime(item.status_changed_at)}</span>
          </>
        )}
      </div>

      <NoteSection
        itemId={item.id}
        noteInput={noteInput}
        onNoteChange={onNoteChange}
        onNoteSave={onNoteSave}
        notePending={notePending}
        noteFeedback={noteFeedback}
        readOnly={readOnly}
      />
    </div>
  );
}

function formatKstTime(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mm = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function NoteSection({
  itemId,
  noteInput,
  onNoteChange,
  onNoteSave,
  notePending,
  noteFeedback,
  readOnly,
}: {
  itemId: string;
  noteInput: string;
  onNoteChange: (v: string) => void;
  onNoteSave: () => void;
  notePending: boolean;
  noteFeedback: string | null;
  readOnly: boolean;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`note-${itemId}`}
        className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub"
      >
        메모
      </label>
      {readOnly ? (
        <div className="text-[12.5px] text-ink-2 whitespace-pre-wrap min-h-[20px]">
          {noteInput || <span className="text-sub">(없음)</span>}
        </div>
      ) : (
        <>
          <textarea
            id={`note-${itemId}`}
            value={noteInput}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="이 task에 대한 메모 (최대 500자)..."
            className="w-full rounded-md border border-card-line bg-surface px-3 py-2 text-[12.5px] text-ink resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNoteSave}
              disabled={notePending}
              className="font-display text-[11.5px] font-semibold text-primary hover:text-cobalt disabled:opacity-50 disabled:pointer-events-none"
            >
              {notePending ? "저장 중..." : "메모 저장"}
            </button>
            {noteFeedback && (
              <span role="status" className="text-[11px] text-muted">
                {noteFeedback}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { NoteSection };
```

- [ ] **Step 2: rewrite `apps/pwa/components/today/task-detail-panel.tsx` to be a router**

```tsx
"use client";
import * as React from "react";
import type { TodayDataItem } from "@/lib/queries/today";
import { StudyGuidePanel } from "./study-guide-panel";
import { MetadataPanel, NoteSection } from "./metadata-panel";

export function TaskDetailPanel({
  item,
  noteInput,
  onNoteChange,
  onNoteSave,
  notePending,
  noteFeedback,
  readOnly = false,
}: {
  item: TodayDataItem;
  noteInput: string;
  onNoteChange: (v: string) => void;
  onNoteSave: () => void;
  notePending: boolean;
  noteFeedback: string | null;
  readOnly?: boolean;
}): React.JSX.Element {
  const guide = item.backbone?.study_guide;

  if (!guide) {
    return (
      <MetadataPanel
        item={item}
        noteInput={noteInput}
        onNoteChange={onNoteChange}
        onNoteSave={onNoteSave}
        notePending={notePending}
        noteFeedback={noteFeedback}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className="bg-bg border-t border-hairline">
      <StudyGuidePanel guide={guide} url={item.url} />
      <div className="px-4 pb-4">
        <NoteSection
          itemId={item.id}
          noteInput={noteInput}
          onNoteChange={onNoteChange}
          onNoteSave={onNoteSave}
          notePending={notePending}
          noteFeedback={noteFeedback}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: typecheck + 모든 PWA 테스트**

```bash
pnpm --filter @cadence/pwa typecheck
pnpm --filter @cadence/pwa test
```

Expected: typecheck 0 error · 모든 PWA 테스트 PASS (29 + 4 신규 = 33).

- [ ] **Step 4: commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/today/metadata-panel.tsx apps/pwa/components/today/task-detail-panel.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): TaskDetailPanel을 라우터로 분리 — study_guide 우선, fallback metadata"
```

---

## Task 9: 통합 smoke — generate-guides 1회 실행 + 폰 검증

**Files:** (없음 — 운영 검증만)

- [ ] **Step 1: claude CLI 인증 확인**

Run:
```bash
claude --version
```
Expected: 버전 출력. 명령 미발견 시 Claude Code 설치/로그인 필요.

- [ ] **Step 2: limit=2로 작은 검증 1회**

`COACH_USER_ID`로 active sprint id 조회 후 명령 실행:

```bash
cd C:/Dev/Workspace/cadence

# 사용자 active sprint id 가져오기
SERVICE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d= -f2-)
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d= -f2-)
USER_ID=$(grep "^COACH_USER_ID=" .env | cut -d= -f2-)
SPRINT_ID=$(curl -s "${SUPABASE_URL}/rest/v1/sprints?user_id=eq.${USER_ID}&status=eq.active&select=id" \
  -H "Authorization: Bearer ${SERVICE_KEY}" -H "apikey: ${SERVICE_KEY}" \
  | node -e "let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>console.log(JSON.parse(s)[0].id))")

echo "Sprint: $SPRINT_ID"
pnpm --filter @cadence/cli exec tsx src/index.ts backbone generate-guides --sprint "$SPRINT_ID" --limit 2
```

Expected: 출력
```
[1/2] <title> … OK (Xs)
[2/2] <title> … OK (Xs)
완료: 2/2 성공, 실패 0, skip 0
```

- [ ] **Step 3: Cloud DB에서 study_guide 채워졌는지 확인**

```bash
curl -s "${SUPABASE_URL}/rest/v1/sprint_backbone_items?sprint_id=eq.${SPRINT_ID}&select=id,content&limit=2" \
  -H "Authorization: Bearer ${SERVICE_KEY}" -H "apikey: ${SERVICE_KEY}" \
  | node -e "let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>{const d=JSON.parse(s); d.forEach((it,i)=>console.log(\`\${i+1}. \${it.content.title?.slice(0,40)} → guide=\${it.content.study_guide?'✓':'✗'}\`))})"
```

Expected: 처음 2개 row에 `guide=✓` 표시.

- [ ] **Step 4: 본인이 결과 검토 후 전체 실행**

`--limit 2` 결과(study_guide 객체)가 본인 학습 스타일에 맞으면 전체 실행:

```bash
pnpm --filter @cadence/cli exec tsx src/index.ts backbone generate-guides --sprint "$SPRINT_ID"
```

Expected: 30개 모두 처리 (이미 limit 2로 채운 2개는 skip), 약 2.5분 소요.

> 결과가 본인 학습 스타일과 안 맞으면 GUIDE_SYSTEM 프롬프트를 수정 (apps/cli/src/commands/backbone-generate-guides.ts) → `--force`로 재생성. 이게 spec §6 "system prompt 첫 줄 명시"가 의도한 점진 튜닝.

- [ ] **Step 5: routine 1회 재실행 (LLM 경로가 claude-cli 사용하는지 검증)**

```bash
pnpm --filter @cadence/routine start
```

Expected: stdout에 `{stage:"llm_call", source:"claude-cli"}` 로그. fallback도 OK 이지만 적어도 callClaude 진입은 확인.

- [ ] **Step 6: 폰 PWA 검증**

폰에서 https://cadence-pwa.vercel.app/today 새로고침 → task row 클릭 → **StudyGuidePanel** 표시 (목표 + 핵심 포인트 + 절차). study_guide 없는 row는 기존 MetadataPanel 폴백.

- [ ] **Step 7: commit (있으면) — 본 task는 검증 only, 코드 변경 없음**

skip 또는 운영 메모를 README에 1줄 추가:
```markdown
- ✅ Max CLI 통합 검증 완료 (2026-04-29). API 충전 사용량 0 전환.
```

```bash
git -C "C:/Dev/Workspace/cadence" add README.md 2>/dev/null || true
git -C "C:/Dev/Workspace/cadence" commit -m "docs: Max CLI 통합 검증 완료 메모" 2>/dev/null || echo "nothing to commit"
```

---

## Task 10: 운영 docs + 게이트 + tag

**Files:**
- Create: `docs/operations/max-cli-integration.md`
- Modify: `docs/operations/cloud-runbook.md` (1 섹션 추가)

- [ ] **Step 1: write `docs/operations/max-cli-integration.md`**

```markdown
# Max CLI 통합 운영

## 무엇이 달라졌나

- routine + cli의 모든 LLM 호출이 `claude --print` subprocess로 전환됨
- Anthropic API 충전 잔액 사용량 0 (Max 구독료에 흡수)
- Sprint 시작 시 `cadence backbone generate-guides`로 한국어 학습 가이드 1회 생성

## 일상 사용

- 매일 routine은 변경 없음 (자동 실행 시 내부적으로 claude CLI 호출)
- 새 sprint 시작 시:
  ```bash
  pnpm cadence init-sprint --from <md> --user $COACH_USER_ID
  pnpm cadence backbone generate-guides --sprint <new sprint id>
  ```
- 가이드 재생성 (프롬프트 튜닝 후):
  ```bash
  pnpm cadence backbone generate-guides --sprint <id> --force
  ```

## 환경 요구

- PC에 Claude Code CLI 설치 + 로그인 (현재 dogfooding 환경 그대로)
- routine은 Anthropic API key 불필요 (`.env`의 `ANTHROPIC_API_KEY`는 다른 용도 없으면 제거 가능)

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| `claude: command not found` | CLI 미설치/PATH 누락 | Claude Code 재설치 후 로그인 |
| `claude exit 1: Not authenticated` | Max 세션 만료 | `claude` 한 번 실행해 재인증 |
| `claude timeout after 60000ms` | 응답 지연 / rate limit | 재시도. 30개 가이드 모두 timeout 시 `--limit`로 작게 분할 |
| `no JSON object found in response` | LLM이 prose만 출력 | GUIDE_SYSTEM 프롬프트 강화 (코드 펜스 강제 명시) → `--force` |
```

- [ ] **Step 2: append section to `docs/operations/cloud-runbook.md`**

기존 cloud-runbook.md 어딘가 적절한 위치(예: "## 자주 하는 작업" 섹션 안 또는 "## 환경 변수" 다음)에 추가:

```markdown
## LLM 호출 — Max CLI

routine + cli의 LLM 호출은 `claude --print` subprocess 사용 (Max 구독). Anthropic API 충전 사용량 0.

- 현재 PC에 Claude Code 인증 필요. PC 꺼지면 routine 그날 누락 (기존과 동일 제약).
- 새 sprint 시작 시 `cadence backbone generate-guides --sprint <id>` 1회 실행해 학습 가이드 채움.
- 자세히: `docs/operations/max-cli-integration.md`.
```

- [ ] **Step 3: 게이트 — 모든 패키지 typecheck + test**

Run:
```bash
pnpm --recursive run typecheck
pnpm test
```

Expected: 모든 패키지 0 error · 모든 테스트 PASS.

- [ ] **Step 4: commit + tag**

```bash
git -C "C:/Dev/Workspace/cadence" add docs/operations/max-cli-integration.md docs/operations/cloud-runbook.md
git -C "C:/Dev/Workspace/cadence" commit -m "docs(operations): Max CLI 통합 가이드 + cloud-runbook 섹션 추가"
git -C "C:/Dev/Workspace/cadence" tag max-cli-integration-complete
```

(`git push origin main && git push origin max-cli-integration-complete` 는 본인 결정.)

---

## Self-Review

- **Spec coverage**: §3 아키텍처 → Tasks 1, 2, 4, 7, 8. §4 데이터 모델 → Task 3 (Zod) + Task 6 (PWA 타입). §5 wrapper → Task 1. §6 CLAUDE.md 방어 → Task 2 system prompt + Task 4 GUIDE_SYSTEM. §7 CLI → Tasks 4, 5. §8 PWA detail → Tasks 6, 7, 8. §9 테스트 → Tasks 1, 2, 5, 7. §10 fallback → Task 2(catch 유지) + Task 4(graceful). §11 호환 → Task 6 study_guide optional.
- **Placeholder scan**: TBD/TODO 없음. 모든 코드 블록 완전. 모든 명령 절대 경로 + expected 출력.
- **Type consistency**: `StudyGuide` (Task 3 routine schema) ↔ `StudyGuide` (Task 6 PWA query type) — 두 곳에서 별도 정의하지만 shape 동일 (objective string, key_points string[], steps {minutes, action}). 향후 통합 가능하지만 cross-package value import 부담 vs 중복 타입 정의 trade-off에서 후자 채택.
- **Workspace dep**: Task 4가 `@cadence/routine`을 import하므로 `apps/cli/package.json`에 `"@cadence/routine": "workspace:*"` 필요. Task 4 Step 4에 명시.

## Plan 산출물 요약

- claude-cli wrapper + extractJson + 5 case
- agent.ts Anthropic SDK 제거 + claude-cli 전환
- StudyGuide Zod 스키마
- `cadence backbone generate-guides` 명령 + 3 case
- PWA fetchTodayData study_guide 포함
- StudyGuidePanel + 4 case
- TaskDetailPanel 라우터 + MetadataPanel 분리
- 운영 docs (max-cli-integration.md + cloud-runbook 섹션)
- 10 tasks · ~50 steps
- 예상 작업 시간: 4~6h (단위 테스트 포함)
- 검증: limit 2 → 30 가이드 → 폰 검증
- 다음: dogfooding 며칠 후 GUIDE_SYSTEM 프롬프트 튜닝, F (학습 평가 루프) 도입 검토
