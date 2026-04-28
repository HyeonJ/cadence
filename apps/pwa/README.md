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

- `/login` — magiclink 이메일 로그인
- `/onboarding` — 4-step (timezone · GitHub · Discord · 알림 시간)
- `/today` — 오늘 카드 + Activity Ring + slot/task list + status 토글
- `/today/[date]` — 과거 카드 read-only (좌/우 화살표 + 오늘로 링크)
- `/sprint` — Sprint 진행 + 30일 캘린더 + 주간 breakdown
- `/settings` — GitHub · Discord · 알림 시간 · Sprint 종료

## PWA

- `app/manifest.ts` — Next 15 manifest (`/manifest.webmanifest` 자동 라우트)
- `app/sw.ts` — `@serwist/next` 서비스 워커 (정적 자산만 캐싱, 데이터 NetworkOnly)
- `public/icons/` — 192/512 PNG + maskable SVG + apple-touch-icon
- 설치: 모바일 Safari 공유 → "홈 화면에 추가" / Android Chrome 자동 prompt

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
