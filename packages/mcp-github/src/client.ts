import { Octokit } from "@octokit/rest";

let cached: Octokit | null = null;

export function getOctokit(): Octokit {
  if (cached) return cached;
  const token = process.env.COACH_GITHUB_PAT;
  if (!token) throw new Error("COACH_GITHUB_PAT env required");
  cached = new Octokit({ auth: token });
  return cached;
}

export function resetOctokitCache(): void {
  cached = null;
}

/**
 * KST date_kst의 0~24h 윈도우를 ISO UTC로 변환.
 * 예: "2026-04-30" KST → ["2026-04-29T15:00:00Z", "2026-04-30T15:00:00Z")
 */
export function kstDayWindow(date_kst: string): { since: string; until: string } {
  const kstStart = new Date(`${date_kst}T00:00:00+09:00`);
  const kstEnd = new Date(`${date_kst}T24:00:00+09:00`);
  return { since: kstStart.toISOString(), until: kstEnd.toISOString() };
}
