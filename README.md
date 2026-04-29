# Cadence

본인 학습 코칭 1인 도구. Claude Code Routines + Claude Agent SDK (TS) + MCP + Next.js PWA + Supabase.

## 구조

- `apps/routine` ✅ Plan 03 (LLM 코치 + daily_card 생성 + Discord 알림)
- `apps/pwa` ✅ Plan 04~06 (Next.js PWA — `https://cadence-pwa.vercel.app`)
- `packages/db` ✅ Plan 01 (Supabase 6 테이블 + RLS + types + seed)
- `packages/mcp-supabase` ✅ Plan 02 (9 tools, L1 backbone CRUD 포함)
- `packages/mcp-github` ✅ Plan 02 (2 tools, KST window + rate limit, msw mock)
- `packages/mcp-discord` ✅ Plan 02 (2 tools, webhook + admin alert)

## 시작

```bash
pnpm install
pnpm supabase:start
pnpm supabase:reset
```

## 배포 (Plan 06 ✅)

- **Vercel**: `https://cadence-pwa.vercel.app` (Hobby Free, auto-deploy on `main` push)
- **Supabase Cloud**: Northeast Asia (Seoul), Free tier
- **Routine**: 로컬 PC 실행 (Cloud DB 대상)
- 운영 가이드: `docs/operations/cloud-runbook.md`
- 배포 가이드: `docs/operations/pwa-deploy.md`

## 문서

- 설계: `docs/superpowers/specs/2026-04-28-cadence-design.md`
- 디자인 시안: `docs/design/demos/today-hybrid.{html,png}`
- Plans: `docs/superpowers/plans/`
