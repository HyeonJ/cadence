# Cadence

본인 학습 코칭 1인 도구. Claude Code Routines + Claude Agent SDK (TS) + MCP + Next.js PWA + Supabase.

## 구조

- `apps/routine` 🚧 Plan 03
- `apps/pwa` 🚧 Plan 04~05
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

## 문서

- 설계: `docs/superpowers/specs/2026-04-28-cadence-design.md`
- 디자인 시안: `docs/design/demos/today-hybrid.{html,png}`
- Plans: `docs/superpowers/plans/`
