# Max CLI 통합 운영

## 무엇이 달라졌나

- routine + cli의 모든 LLM 호출이 `claude --print` subprocess(Max 구독)로 전환됨
- Anthropic API 충전 잔액 사용량 0 (Max 정액에 흡수)
- Sprint 시작 시 `cadence backbone generate-guides`로 한국어 학습 가이드 1회 생성
- PWA `TaskDetailPanel`이 라우터로 동작 — `study_guide` 있으면 `StudyGuidePanel`(목표/핵심 포인트/학습 흐름), 없으면 기존 `MetadataPanel`로 폴백

## 일상 사용

매일 routine은 변경 없음 (자동 실행 시 내부적으로 claude CLI 호출). 단, **PC가 켜져 있고 Claude Code 인증이 살아있어야 함**.

새 sprint 시작:

```bash
pnpm cadence init-sprint --from <md> --user $COACH_USER_ID
pnpm cadence backbone generate-guides --sprint <new sprint id>
```

가이드 재생성 (프롬프트 튜닝 후):

```bash
pnpm cadence backbone generate-guides --sprint <id> --force
```

특정 N개만 검증용으로:

```bash
pnpm cadence backbone generate-guides --sprint <id> --limit 2
```

## 환경 요구

- PC에 Claude Code CLI 설치 + Max 로그인 (현재 dogfooding 환경 그대로)
- routine은 Anthropic API key 불필요 — `.env`의 `ANTHROPIC_API_KEY`는 다른 용도 없으면 제거 가능
- `claude --print --model claude-opus-4-7` 가 stdin → stdout 형태로 동작해야 함 (현재 2.1.x 기준 OK)

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| `claude: command not found` | CLI 미설치 / PATH 누락 | Claude Code 재설치 후 로그인 |
| `claude exit 1: Not authenticated` | Max 세션 만료 | `claude` 한 번 실행해 재인증 |
| `claude timeout after 60000ms` | 응답 지연 / 일시적 rate limit | generate-guides는 idempotent — 같은 명령 재실행 시 이미 채워진 항목은 SKIP, 실패 항목만 재시도. 빈도 잦으면 `claude-cli.ts`의 `DEFAULT_TIMEOUT_MS` 90~120s로 상향 검토 |
| `no JSON object found in response` | LLM이 prose만 출력 | system prompt 강화 (코드 펜스 강제 명시) → `--force`로 재생성 |
| routine `fallback triggered` (Zod schema fail) | LLM 응답이 `slot_key/kind/estimated_minutes` 등 필수 필드 누락 | `apps/routine/src/agent.ts`의 SYSTEM_PROMPT에 응답 예제 강화. fallback 자체는 정상 동작이라 생성 자체엔 영향 X |
| 폰에서 학습 가이드 안 뜨고 옛 metadata만 보임 | Vercel deploy 안됐거나 service worker 캐시 | main에 머지/push 됐는지 확인 + 폰 PWA 완전 종료 후 재실행 |

## 관련 파일

- 래퍼: `apps/routine/src/utils/claude-cli.ts` (`callClaude`, `extractJson`)
- 스키마: `apps/routine/src/schema/study-guide.ts` (`StudyGuideSchema`)
- CLI 명령: `apps/cli/src/commands/backbone-generate-guides.ts`
- PWA 패널: `apps/pwa/components/today/study-guide-panel.tsx`, `metadata-panel.tsx`
- 라우터: `apps/pwa/components/today/task-detail-panel.tsx`

## 검증 기록

- 2026-04-30: 10/10 backbone 가이드 생성 (3 timeout → retry 회복), 폰 검증 OK. API 충전 사용량 0 전환 완료.
