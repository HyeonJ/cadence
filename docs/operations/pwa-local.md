# Cadence PWA — 로컬 개발 셋업 (Plan 04)

## 사전 조건

- Plan 01~03 완료 (Supabase + MCP + Routine + CLI)
- pnpm 9.x, Node 20.10+
- Supabase local: `pnpm supabase:start`로 가동 — `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`

## 1. user 시드

Studio (`http://127.0.0.1:54323`) → Authentication → Add user — 본인 이메일 + 임시 비번 (또는 magiclink 자체 발송).

생성된 uuid를 root `.env`의 `COACH_USER_ID`에 넣으면 Routine·CLI에서 사용.

## 2. Sprint + 카드 시드

```bash
pnpm cadence init-sprint --from <report.md path> --user $COACH_USER_ID
pnpm --filter @cadence/routine start   # 매뉴얼 카드 생성
```

## 3. PWA 가동

```bash
pnpm dev:pwa
# http://localhost:3000 → 로그인 (magiclink는 Studio Auth → Email logs에서 확인)
```

## 4. 검증 체크리스트

- [ ] `/login` 페이지 렌더
- [ ] magiclink 발송 후 `/auth/callback?code=...` → `/today` 자동 이동
- [ ] `/today`에 헤더 날짜 + Activity Ring + Coach Comment + slot/task 카드 표시
- [ ] task checkbox 클릭 → status `done` 즉시 반영 (optimistic) + DB 갱신
- [ ] `/sprint`에 Activity Ring 280px + 3 metric card + 30일 calendar
- [ ] mobile viewport (≤ 1024px)에서 sidebar 숨김 + 하단 tabbar 표시

## 5. 트러블슈팅

- magiclink 이메일이 안 옴 → Studio → Authentication → Email logs (local SMTP는 mailcatcher)
- `/today` 빈 화면 → daily card 미생성. `pnpm cadence regen --date <today_kst> --user $COACH_USER_ID`
- 폰트 깨짐 → Pretendard CDN 차단 가능성. 네트워크 OK 확인.
- RLS 거부 → user_id 일치 안 함. user_settings row 직접 INSERT 필요할 수 있음 (Plan 05 Onboarding이 자동화).
