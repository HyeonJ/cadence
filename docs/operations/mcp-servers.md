# MCP Servers Operations

## Local 개발

```bash
pnpm supabase:start
pnpm --filter @cadence/mcp-supabase test
pnpm --filter @cadence/mcp-github test
pnpm --filter @cadence/mcp-discord test
```

## Claude Code 등록

`.mcp.json`이 root에 있으면 Claude Code 자동 인식. env vars는 `.env`에서 로드 (`dotenv-cli` 또는 shell).

확인:
```bash
claude mcp list
# → cadence-supabase, cadence-github, cadence-discord 3개 표시
```

## 도구 호출 테스트

Claude Code에서:
- "list_backbone (sprint_id=...)"
- "get_user_events_yesterday (github_username=HyeonJ, date_kst=2026-04-30)"
- "send_admin_alert (severity=info, message='test')"
