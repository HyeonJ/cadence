# @cadence/mcp-discord

Discord 알림용 MCP 서버. 2 도구.

## 도구

- `send_dm` — 사용자 webhook URL로 메시지 발송 (4xx/5xx 시 ok=false)
- `send_admin_alert` — `DISCORD_ADMIN_WEBHOOK_URL` env로 헬스체크/실패 알림 (severity: info/warn/error)

## 환경변수

- `DISCORD_ADMIN_WEBHOOK_URL` — admin 채널 webhook (선택, send_admin_alert 호출 시 필수)

## 테스트

```bash
pnpm --filter @cadence/mcp-discord test
```

테스트는 msw로 Discord webhook mock — 실제 webhook URL 불필요.

## Claude Code 등록

root의 `.mcp.json` 참조. `cadence-discord` 이름으로 등록됨.
