# @cadence/pwa

Cadence Personal Learning Coach — Next.js 15 App Router PWA.

## Local dev

```bash
# 1. Supabase local 가동 (pnpm supabase:start) — Plan 01 참고
# 2. 본인 user 생성 (Studio Auth tab)
# 3. CLI로 Sprint 시드 (apps/cli)
# 4. Routine 또는 cadence regen으로 daily card 1건 생성
# 5. PWA 가동
pnpm dev:pwa
```

## env

`.env.local` (apps/pwa 안) 또는 root `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 화면

- `/today` — 오늘 카드 + Activity Ring + slot/task list + status 토글
- `/sprint` — Sprint 진행 + 30일 캘린더 + 주간 breakdown
- `/login` — magiclink 이메일 로그인

## 디자인 토큰

- spec §6.2 + `docs/design/demos/today-hybrid.html` ground truth
- `app/globals.css` → CSS 변수 정의, `tailwind.config.ts` → Tailwind 매핑
- 안티-AI-slop: 그라디언트 일반 카드 X, 둥근 16~20px 일반 카드 X, 보라색 X

## 테스트

```bash
pnpm --filter @cadence/pwa test       # vitest (atoms + queries 단위)
pnpm --filter @cadence/pwa e2e        # Playwright smoke
pnpm --filter @cadence/pwa typecheck
pnpm --filter @cadence/pwa lint
```
