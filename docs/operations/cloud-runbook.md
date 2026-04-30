# Cadence Cloud — 운영 Runbook

> 본 문서는 **이미 배포된** Cadence Cloud (Supabase + Vercel)의 일상 운영 절차.
> 배포 자체는 `pwa-deploy.md` (Plan 05/06 가이드).

## 배포 정보 (현재 상태 — 2026-04-29)

- **Supabase Cloud**: `https://lcppyflvevjmxpmsclek.supabase.co` (Northeast Asia / Seoul)
- **Vercel**: `https://cadence-pwa.vercel.app` (Hobby Free)
- **Auto-deploy**: GitHub `main` 브랜치 push → Vercel 자동 빌드/배포
- **Routine**: 로컬 PC에서 매일 실행 (Cloud DB 대상). PC 꺼짐 시 그날 누락.

## 일일 흐름

### 정상 운영 (자동)
1. KST 07:00 — PC에서 Routines 또는 cron이 `pnpm --filter @cadence/routine start` 실행
2. routine: getActiveSprint → backbone fetch → GitHub signals → LLM 호출 → upsert daily_card → Discord 알림
3. 폰 PWA `/today` — 새 카드 + 5개 task 체크리스트
4. 사용자 미션 수행 → 체크박스 토글 → status 갱신
5. KST 22:00 — 내일 미리보기 알림 (구현 시점)

### 수동 실행
- 폰에서 카드 생성 강제: 본인 PC 터미널에서 `pnpm --filter @cadence/routine start`
- 특정 날짜: `pnpm cadence regen --date YYYY-MM-DD --user $COACH_USER_ID --force`

## LLM 호출 — Max CLI

routine + cli의 LLM 호출은 `claude --print` subprocess(Max 구독) 사용. Anthropic API 충전 사용량 0.

- 현재 PC에 Claude Code 인증 필요. PC 꺼지면 routine 그날 누락 (기존 제약과 동일)
- 새 sprint 시작 시 `cadence backbone generate-guides --sprint <id>` 1회 실행해 학습 가이드 채움
- 자세히: `docs/operations/max-cli-integration.md`

## env 관리

- **로컬 PC `.env`** (gitignored): production 자격 = Cloud Supabase URL/keys + Anthropic + GitHub PAT + Discord webhooks + COACH_USER_ID
- **Vercel env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production + Preview), `SUPABASE_SERVICE_ROLE_KEY` (Production only)
- **`.env.test`** (per-package, gitignored): vitest용 로컬 Supabase
- 변경 시 PC + Vercel 양쪽 동기화 필요

## 자주 하는 작업

### 1. 새 sprint 시작
```bash
# 기존 active sprint를 PWA Settings → "Active sprint 종료"로 completed 처리
# 또는 SQL: UPDATE sprints SET status='completed' WHERE status='active' AND user_id=...
pnpm cadence init-sprint --from <report.md path> --user $COACH_USER_ID
```

### 2. backbone 변경 (L1 — 영구)
- 폰 PWA로는 미구현 (Plan 07 후보)
- CLI: `pnpm cadence backbone {list|add|update|remove}`
- Settings에는 timezone/GitHub/Discord/notify_schedule만

### 3. 카드 강제 재생성
```bash
pnpm cadence regen --date 2026-04-29 --user $COACH_USER_ID --force
```

### 4. 데이터 export (백업)
폰 PWA `/settings` → "데이터 내보내기 (JSON)" → 6 테이블 전체 1파일

### 5. 계정 삭제
폰 PWA `/settings` → "계정 삭제" → "DELETE" 입력 → 영구 삭제 (auth.users + cascade)

## 모니터링

### 정상 신호
- Discord 일일 채널: 매일 KST 07:00 ± 5분 카드 알림
- Vercel: Deployments → 최근 빌드 모두 "Ready"
- Supabase Cloud: Database → 테이블에 daily_cards row가 매일 1건씩 늘어남

### 알람 신호
- Discord admin 채널 `[ERROR] cadence-routine: ...` 메시지 → routine fatal 발생
- Vercel build 실패 알림 (옵션 — Settings → Notifications에서 webhook 등록 시)
- Discord 카드 알림 미도착 → routine 미실행 (PC 꺼짐 / cron 실패)

## 트러블슈팅

| 증상 | 원인 후보 | 1차 해결 |
|---|---|---|
| 폰 카드 안 보임 | routine 미실행 / DB 권한 | PC 터미널 `pnpm --filter @cadence/routine start` 직접 |
| 매직링크 안 옴 | Supabase 메일 시간당 4건 한도 / 스팸함 | 5분 후 재시도 또는 Spam 확인 |
| /today 빈 상태 | sprint 종료 | Settings로 sprint 상태 확인 / CLI init-sprint |
| Vercel 빌드 실패 | type/lint 에러 | Vercel Deployments → 로그 확인 → 수정 push |
| GitHub signal 0 | PAT 만료 / username 오타 | `.env` 확인 + `pnpm supabase ...` 로 yesterday_signals 직접 확인 |
| LLM fallback 자주 | system prompt + JSON schema 미흡 | `apps/routine/src/prompts/system.ts` 개선 (Plan 07 후보) |

## 비용

- Supabase Free: 500MB DB · 2GB egress · 50 MAU. 1인 사용 → free tier 100x 여유
- Vercel Hobby: 100GB bandwidth/월 · 무제한 배포. 개인 사용 → 충분
- Anthropic API: Claude Opus 1회 호출 ≈ $0.05~0.20 (cache_control 적용 시 절감). 매일 1회 = 월 $1.5~6
- 도메인: vercel.app 무료 사용 중

## D+30 후 검토 항목

- 웹푸시 (현재 Discord webhook 의존)
- 본인 도메인 연결 (`cadence.your-domain.app`)
- routine을 GitHub Actions cron으로 이전 (PC off 시에도 실행)
- LLM regression test (Promptfoo)
- 멀티유저 추상화 (지금은 1인 가정)
