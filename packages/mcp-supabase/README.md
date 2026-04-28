# @cadence/mcp-supabase

Cadence DB 작업용 MCP 서버. 9 도구.

## 도구

- `get_active_sprint` — user의 active sprint 1건
- `get_today_backbone` — sprint의 오늘 활성 backbone items (effective_until + day mask 필터)
- `get_yesterday_signals` — user의 어제 signals 1건
- `upsert_daily_card` — daily_card + items 멱등 upsert (delete+insert)
- `upsert_yesterday_signals` — yesterday_signals UNIQUE upsert
- `list_backbone` — sprint backbone 조회 (week 필터, active 옵션) — L1 #1
- `add_backbone_item` — sprint backbone 추가 (L1 #2)
- `update_backbone_item` — backbone item 부분 수정 (jsonb deep merge) — L1 #3
- `remove_backbone_item` — backbone item soft delete (effective_until) — L1 #4

## 환경변수

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (RLS bypass)

## 테스트

```bash
pnpm supabase:start
pnpm --filter @cadence/mcp-supabase test
```

`packages/mcp-supabase/.env.test`에 SUPABASE_URL/anon/service_role 키 설정 필요.

## Claude Code 등록

root의 `.mcp.json` 참조. `cadence-supabase` 이름으로 등록됨.
