# Cadence Max CLI 통합 + 학습 가이드 설계 (Spec)

**작성:** 2026-04-29
**상태:** brainstorm 완료 · plan 작성 대기

## 1. 목적

Anthropic API 충전 잔액 사용을 0으로 만들고, 모든 LLM 호출을 본인이 결제한 **Claude Max 구독**의 Claude Code CLI subprocess(`claude --print`)로 통합한다. 동시에 PWA `/today`의 task detail 패널을 현재 메타데이터 표시(`core_2`, `[web §4.1 #1]` 등)에서 **사람이 읽고 즉시 실행 가능한 한국어 학습 가이드**로 교체한다.

이 작업은 두 가치를 동시에 달성한다:
- **운영 비용 0**: Max 구독 외 추가 API 결제 없음
- **학습 효과 ↑**: detail 패널이 "이 자료를 30분 안에 어떻게 공부할지" 절차 + outcome을 한국어로 직접 보여줌

## 2. 결정 트레일

- 모든 LLM 호출을 Max CLI로 (옵션 2): daily card 생성 + 가이드 생성 모두. API 충전 사용량 0.
- 모델: Opus 4.7 단일 (옵션 a). 단순성 + 품질 우선.
- 학습 가이드 콘텐츠 모양: A(절차) + B(outcome) 합본. 핵심 학습 포인트 3-4개 + 목표 1-2문장 + 시간별 절차.
- 가이드 생성 트리거: `cadence backbone generate-guides --sprint <id>` 명령으로 1회 batch 생성 후 영속. 매일 routine은 가이드 생성 X.
- 데이터 모델: `sprint_backbone_items.content`에 `study_guide` jsonb 필드 추가. 마이그레이션 없음.
- Anthropic SDK는 routine에서 완전 제거.

## 3. 아키텍처

### 3.1 컴포넌트

```
apps/routine/src/utils/claude-cli.ts (신규)
  - callClaude({ system, prompt, model, maxOutputBytes }) → string
  - extractJson(raw) → unknown
  - subprocess: spawn("claude", ["--print", "--model", model])
  - timeout 60s, output cap 50KB, stderr 캡처

apps/routine/src/agent.ts (수정)
  - Anthropic SDK 호출 제거 → callClaude 호출로 교체
  - import "@anthropic-ai/sdk" 제거

apps/cli/src/commands/backbone.ts (수정)
  - 새 sub-command: generate-guides --sprint <id>
  - 30 backbone item 순차 호출 → study_guide 채움 → UPDATE

apps/pwa/components/today/study-guide-panel.tsx (신규)
  - StudyGuide 객체 렌더 (objective + key_points + steps)
  - 없으면 기존 MetadataPanel 폴백

apps/pwa/lib/queries/today.ts (수정)
  - backbone meta에 study_guide 필드 포함
```

### 3.2 데이터 플로우

**Sprint 시작 시 (1회)**:
```
사용자  →  cadence backbone generate-guides --sprint <id>
         ↓
       fetch 30 backbone items
         ↓ for each item
       prompt 생성 (제목 + URL + source_tag + estimated_minutes)
         ↓
       callClaude(...)  →  Claude Code CLI subprocess  →  Max 구독 호출
         ↓ markdown fence 제거 + JSON 파싱
       study_guide 객체
         ↓
       UPDATE sprint_backbone_items SET content = jsonb_set(content, '{study_guide}', <obj>)
```

**매일 routine (자동)**:
```
07:00 KST  →  cadence-routine
         ↓ (Stage 1) DB에서 sprint/backbone/yesterday signals 가져옴
         ↓ (Stage 2) callClaude(system + context, user message) → JSON 파싱 → DailyCardResponseSchema 검증
         ↓ (Stage 3) upsert daily_card + items (study_guide는 backbone에 이미 있어서 join으로 표시)
         ↓ (Stage 4) Discord webhook 알림
```

**PWA detail 표시**:
```
GET /today  →  fetchTodayData(date)
         ↓ JOIN: daily_card_items.source_backbone_id → sprint_backbone_items.content
         ↓
       TodayDataItem.backbone.study_guide 채움 (있으면)
         ↓
       row 클릭 → StudyGuidePanel 렌더 (없으면 MetadataPanel)
```

## 4. 데이터 모델

### 4.1 `sprint_backbone_items.content.study_guide` (신규 jsonb 필드)

```typescript
interface StudyGuide {
  objective: string;          // 1-2문장. 이 자료 끝내면 무엇을 할 수 있어야 하는지
  key_points: string[];       // 3-4개. 핵심 개념/포인트
  steps: Array<{
    minutes: number;          // 5, 10 등
    action: string;           // "README의 X 섹션 읽기" 등
  }>;
}
```

전체 스키마(예시):
```json
{
  "title": "Claude Code Skills + anthropics/skills GitHub",
  "materials": [{ "name": "...", "url": "...", "source_tag": "[web §4.1 #4]" }],
  "targets": ["core_2"],
  "estimated_minutes": 30,
  "study_guide": {
    "objective": "이 자료를 끝내면 본인이 만든 mcp 도구 중 하나(예: list_backbone)를 Claude Code Skill 형식으로 재작성하는 방법이 머릿속에 그려질 것.",
    "key_points": [
      "Skill 메타데이터 구조 (name / description / inputSchema)",
      "Skill 발견 메커니즘 — Claude가 어떤 신호로 invoke?",
      "Skill vs MCP tool 차이"
    ],
    "steps": [
      { "minutes": 5,  "action": "README의 'What are Skills' 섹션 읽기" },
      { "minutes": 10, "action": "anthropics/skills repo의 examples/ 폴더에서 단순한 skill 1개 코드 보기" },
      { "minutes": 5,  "action": "Skill 메타데이터 구조 파악" },
      { "minutes": 10, "action": "cadence의 mcp-supabase 도구와 비교 — Skill로 만들면 어떻게 다를지 매핑" }
    ]
  }
}
```

### 4.2 마이그레이션

`content`는 jsonb이므로 DDL 변경 없음. 신규 필드는 `cadence backbone generate-guides` 1회 실행으로 채워지고, PWA는 누락된 항목에 대해 graceful fallback.

## 5. claude-cli wrapper 인터페이스

```typescript
interface CallClaudeInput {
  prompt: string;
  system?: string;
  model?: "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5";
  maxOutputBytes?: number;  // default 50_000
}

async function callClaude(input: CallClaudeInput): Promise<string>;
function extractJson(raw: string): unknown;
```

내부:
- `spawn("claude", ["--print", "--model", model], { stdio: ["pipe","pipe","pipe"], shell: true })`
- system + prompt를 "{system}\n\n---\n\n{prompt}" 형태로 stdin
- stdout 누적 (50KB 초과 시 kill + reject)
- timeout 60s
- exit != 0 → stderr 일부 포함하여 reject

`extractJson` 알고리즘:
1. 응답에서 ` ```json ... ``` ` 또는 ` ``` ... ``` ` 코드 펜스 매칭
2. 펜스 없으면 원문 사용
3. 첫 `{` 부터 마지막 `}` 까지 추출
4. `JSON.parse` 시도, 실패 시 throw

## 6. CLAUDE.md 간섭 방어

`claude --print` 호출 시 글로벌(`~/.claude/CLAUDE.md`) + 프로젝트 CLAUDE.md 모두 로드된다. 글로벌에는 본인의 일반 코딩 규칙(Java/Spring/CSS 등)이 있어 한국어 학습 가이드 생성 작업과 무관한 노이즈가 들어간다.

방어 두 단계:
1. **system prompt 첫 줄 명시**: "이 호출은 학습 가이드 JSON 생성만 수행합니다. CLAUDE.md의 일반 코딩 규칙(Java/Spring 등)은 무시하세요."
2. **출력 형식 강제**: " ```json ... ``` 코드 펜스 안 단일 JSON 객체. 그 외 설명/주석 X."
3. **cwd 격리** (선택): `mkdtempSync` 임시 디렉터리에서 spawn → 프로젝트 CLAUDE.md 미로드. 글로벌은 여전히 로드되지만 영향 적음.

본 spec은 1+2를 1차 적용. 3은 plan에서 1차 결과 보고 필요 시 추가.

## 7. CLI 명령: `cadence backbone generate-guides`

### 7.1 인터페이스

```bash
pnpm cadence backbone generate-guides --sprint <sprint_id> [--limit N] [--force]
```

옵션:
- `--sprint <id>`: 대상 sprint (필수)
- `--limit N`: 처음 N개만 처리 (테스트용, default 전부)
- `--force`: 이미 study_guide가 있는 항목도 재생성 (default false → skip)

### 7.2 동작

1. supabase service-role 클라이언트로 `sprint_backbone_items` fetch (sprint_id 매칭, effective_until null)
2. 기존 study_guide가 있고 `--force`가 없으면 skip
3. 항목별로 prompt 빌드(제목 + URL + source_tag + estimated_minutes 등)
4. `callClaude({ system: GUIDE_SYSTEM, prompt, model: "claude-opus-4-7" })` 호출
5. `extractJson(raw)` → `StudyGuide` 검증 (zod 스키마 사용)
6. `UPDATE sprint_backbone_items SET content = jsonb_set(content, '{study_guide}', <obj>) WHERE id = ...`
7. 진행 stdout 표시:
   ```
   [1/30] Claude Agent SDK Overview + Quickstart … OK (4.1s)
   [2/30] Building Agents with the Claude Agent SDK … OK (3.8s)
   ...
   [30/30] MCP 공식 사양 정독 … OK (4.5s)
   완료: 30/30 성공, 실패 0, 총 122초
   ```
8. 실패한 항목은 study_guide null로 두고 다음으로 진행 (graceful)

순차 실행 (Max Opus rate limit 보호). 예상 총 시간 ~2.5분.

### 7.3 `GUIDE_SYSTEM` 프롬프트 (예시)

```
당신은 본인 학습용 한국어 가이드 작성자입니다. 입력으로 받는 학습 자료에 대해
다음 형식의 JSON 객체 단 하나만 생성합니다:

{
  "objective": "1-2문장. 이 자료를 끝내면 본인이 무엇을 할 수 있어야 하는지",
  "key_points": ["3-4개. 자료의 핵심 개념/포인트"],
  "steps": [
    { "minutes": 5, "action": "구체 절차 1" },
    { "minutes": 10, "action": "구체 절차 2" }
  ]
}

규칙:
- 응답은 오직 ```json … ``` 코드 펜스 안 JSON 객체 하나. 다른 설명/주석 X.
- objective는 학습 outcome (능동 동사) 형태로.
- steps의 minutes 합은 estimated_minutes와 비슷하게.
- 본인이 자료를 정확히 모르는 경우, 자료 제목과 URL에서 추정 가능한 합리적 절차를 제시.
- 글로벌 CLAUDE.md의 일반 코딩 규칙(Java/Spring 등)은 무시.
```

## 8. PWA detail 패널 변경

### 8.1 컴포넌트 분리

```
apps/pwa/components/today/
├── task-detail-panel.tsx       (수정 — 라우팅)
├── study-guide-panel.tsx       (신규 — study_guide 있을 때)
└── metadata-panel.tsx          (신규 — fallback, 기존 materials/targets 표시)
```

### 8.2 라우팅

```tsx
function TaskDetailPanel({ item, ... }) {
  const guide = item.backbone?.study_guide;
  return guide
    ? <StudyGuidePanel guide={guide} url={item.url} note={...} />
    : <MetadataPanel materials={...} targets={...} url={item.url} note={...} />;
}
```

### 8.3 StudyGuidePanel UI

```
┌─────────────────────────────────────────────┐
│ docs.anthropic.com/...    [↗]  (URL clickable) │
├─────────────────────────────────────────────┤
│                                              │
│ 🎯 오늘의 목표                                │
│   이 자료를 끝내면 ...                          │
│                                              │
│ 핵심 학습 포인트                              │
│  · Skill 메타데이터 구조                       │
│  · Skill 발견 메커니즘                         │
│  · Skill vs MCP tool 차이                     │
│                                              │
│ 📚 30분 학습 흐름                              │
│  1.  5분  README 'What are Skills' 읽기      │
│  2. 10분  examples/ 폴더 코드 보기            │
│  3.  5분  Skill 메타데이터 구조 파악           │
│  4. 10분  cadence 도구와 비교                 │
│                                              │
│ 메모                                          │
│ [ ... textarea ... ]                         │
│ [메모 저장]                                    │
└─────────────────────────────────────────────┘
```

### 8.4 fetchTodayData 변경

`backbone` 필드에 `study_guide?: StudyGuide` 추가. 쿼리는 변경 없음 (jsonb 통째로 조회 중).

## 9. 테스트

### 9.1 단위 테스트

| 파일 | 케이스 |
|---|---|
| `apps/routine/tests/claude-cli.spec.ts` | extractJson: pure / fence / fence + 본문 / 잘못된 / 빈 (5 case). spawn은 mock. |
| `apps/routine/tests/agent.spec.ts` (수정) | 기존 Anthropic SDK mock 제거. callClaude를 mock하여 LLM 응답 시뮬레이션. |
| `apps/cli/tests/backbone-generate-guides.spec.ts` (신규) | callClaude mock 30회 + UPDATE 호출 검증. 일부 실패 시 graceful 진행 검증. |

### 9.2 PWA

`apps/pwa/tests/study-guide-panel.spec.tsx`: rendering smoke (objective 표시, steps 표시, key_points pill 표시, 빈 study_guide 시 metadata fallback).

### 9.3 통합

- routine end-to-end 수동 1회: `pnpm --filter @cadence/routine start` → daily_card 생성 → JSON 파싱 OK
- generate-guides 수동 1회: `pnpm cadence backbone generate-guides --sprint <id> --limit 3` → 3개 study_guide 채워짐 확인 (Cloud DB)

## 10. 실패 / Fallback

- `claude` CLI 미설치 / 미인증 → spawn error → routine fatal → admin Discord 알림
- `claude --print` exit != 0 → reject → agent.ts catch → static-card fallback (기존 path)
- JSON 파싱 실패 (markdown 노이즈 과다) → reject → static-card fallback
- timeout 60s 도달 → kill subprocess → reject → fallback
- generate-guides 도중 일부 실패 → 그 항목 study_guide 비워두고 다음 항목 진행. 끝에 실패 개수 표시.

## 11. 마이그레이션 / 호환

- 기존 sprint_backbone_items 데이터: study_guide 없음 → PWA detail은 metadata 폴백.
- 새 sprint_backbone_items (cadence backbone add 등): study_guide 없이 생성 → 본인이 generate-guides 다시 실행하거나 detail에서 metadata 폴백.
- 기존 daily_card_items: 영향 없음 (study_guide는 backbone에 위치).

## 12. 비-목표

- LLM 평가 루프 (옵션 F의 양방향 학습) — 별도 단계.
- routine을 GitHub Actions cron 같은 비-PC 환경으로 옮기기 (Claude Code CLI는 PC가 필요).
- 학습 가이드 자동 갱신 (매일 자료가 변하지 않으므로 1회 생성으로 충분; 본인 수정은 Settings/CLI에서).

## 13. 영향

| 영역 | 영향 |
|---|---|
| `.env` | `ANTHROPIC_API_KEY`는 routine에서 더 이상 안 봄. 다른 곳 안 쓰면 제거 가능. |
| `apps/routine` deps | `@anthropic-ai/sdk` 제거 |
| `apps/routine` env 검증 | API key 미존재해도 OK (claude CLI만 필요) |
| Vercel | 변경 없음 (PWA는 LLM 호출 안 함) |
| Cloud DB schema | 변경 없음 (jsonb 필드 추가) |
| 비용 | API 사용량 → $0. Max 구독료 그대로 ($0 추가) |

## 14. 자체 검토

- **Placeholder scan**: TBD/TODO 없음. 모든 인터페이스 완전.
- **Internal consistency**: 컴포넌트 분리, 데이터 플로우, 인터페이스 모두 일관.
- **Scope check**: 단일 implementation plan으로 적합. 분해 불필요.
- **Ambiguity check**: 가이드 생성 1회 vs 매일 — 1회로 명시. CLAUDE.md 간섭 방어 — 1+2 적용 명시. fallback 경로 — 모든 실패에서 static-card 명시.

## 15. 다음 단계

1. 본인이 본 spec 검토 → 변경 요청 or 승인
2. writing-plans skill로 implementation plan 작성
3. plan 따라 task-by-task 구현
