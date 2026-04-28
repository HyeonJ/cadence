# Claude Code Routines — Cadence 셋업

## 사전 조건

- Claude Code Max 구독
- `apps/routine` 빌드 통과 (Plan 03 끝)
- env 변수 (호스트 환경 또는 Routines 안):
  - ANTHROPIC_API_KEY
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - COACH_USER_ID
  - COACH_GITHUB_USERNAME
  - COACH_GITHUB_PAT
  - COACH_MONITORED_REPOS (콤마 구분, 예: `me/cadence,me/sprint1-mcp-wrap`)
  - DISCORD_WEBHOOK_URL
  - DISCORD_ADMIN_WEBHOOK_URL

## Routine 정의

Claude Code 내부에서 (`/routines` 명령 또는 https://code.claude.com/routines UI):

```
이름: cadence-daily-card
스케줄: 매일 KST 07:00
프롬프트:
  C:/Dev/Workspace/cadence 디렉토리에서
  pnpm --filter @cadence/routine start
  를 실행해. stdout 마지막 JSON을 응답으로 보고.
```

(또는 직접 `pnpm tsx apps/routine/src/main.ts`. `main.ts`는 runtime entry, `index.ts`는 라이브러리 export barrel.)

## 첫 자동 실행 검증

1. **시드** (1회):
   ```bash
   pnpm cadence init-sprint --from <report.md 경로> --user <COACH_USER_ID>
   ```
2. **수동 실행**:
   ```bash
   pnpm --filter @cadence/routine start
   ```
   Expected stdout JSON 흐름: `{stage:"init"}` → `{stage:"prepare"}` → `{stage:"llm_call", usage:{...}}` → `{stage:"done", result:{daily_card_id:..., fallback_used:false}}`
3. Discord 알림 도착 확인
4. Routines UI에서 "Run now"로 자동 트리거 검증
5. PWA에서 카드 표시 확인 (Plan 04 이후)

## fallback 경로 (Routines 장애 시)

Windows Task Scheduler로 동일 명령 임시 등록.

## 문제 해결

- Hallucination 에러 → fallback 카드 자동 발송. system prompt 수정 + 재실행.
- rate_limited → fetch_status 명시적 처리됨. coach_comment에 표시.
- Discord webhook 실패 → admin alert 별도 발송.
- `ANTHROPIC_API_KEY` 누락 → fallback 카드 발송 (LLM 호출 try/catch 안에서 throw).

## 관련 CLI 명령

- `pnpm cadence init-sprint --from <md> --user <uuid>` — 신규 sprint 시드
- `pnpm cadence preview --date <ymd> --user <uuid>` — LLM 미호출 디버그
- `pnpm cadence regen --date <ymd> --user <uuid> --force` — 강제 재생성
- `pnpm cadence backbone {list,add,update,remove}` — L1 backbone CRUD
