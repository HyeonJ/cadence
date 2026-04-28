# @cadence/mcp-github

GitHub 신호 수집용 MCP 서버. 2 도구.

## 도구

- `get_user_events_yesterday` — user의 KST 어제 PushEvent / PullRequestEvent / PullRequestReviewEvent 카운트
- `get_repo_commits_yesterday` — monitored_repos 각각에서 user의 KST 어제 commit 카운트 (author_date, max 300/repo, partial 처리)

## 환경변수

- `COACH_GITHUB_PAT` — GitHub Personal Access Token (read 권한)

## 테스트

```bash
pnpm --filter @cadence/mcp-github test
```

테스트는 msw로 GitHub API mock — 실제 PAT 불필요.

## Claude Code 등록

root의 `.mcp.json` 참조. `cadence-github` 이름으로 등록됨.
