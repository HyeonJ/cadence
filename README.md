# Cadence

본인 학습 코칭 1인 도구. Claude Code Routines + Claude Agent SDK (TS) + MCP + Next.js PWA + Supabase.

## 구조

- `apps/routine` — Claude Code Routines가 호출하는 main 함수 (Plan 03)
- `apps/pwa` — Next.js 14 PWA (Plan 04~05)
- `packages/db` — Supabase 스키마·타입·시드 (Plan 01) ✅
- `packages/mcp-supabase` — Supabase MCP 서버 (Plan 02)
- `packages/mcp-github` — GitHub MCP 서버 (Plan 02)
- `packages/mcp-discord` — Discord MCP 서버 (Plan 02)

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
