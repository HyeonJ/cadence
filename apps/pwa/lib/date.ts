const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nowKst(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

export function todayKst(): string {
  const k = nowKst();
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const DOW_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DOW_KO = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
const MONTH_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function dowIndex(date_kst: string): number {
  // Mon=0..Sun=6 — Plan 03 dayOfWeekFor와 동일 알고리즘 (T00:00:00Z 파싱 후 (UTCDay+6)%7)
  const d = new Date(`${date_kst}T00:00:00Z`);
  return (d.getUTCDay() + 6) % 7;
}

export function formatKstHeader(date_kst: string): string {
  // 2026-05-01 → "FRI · MAY 1, 2026"
  const [yyyy, mm, dd] = date_kst.split("-").map(Number);
  const dow = DOW_EN[dowIndex(date_kst)];
  return `${dow} · ${MONTH_EN[mm - 1]} ${dd}, ${yyyy}`;
}

export function formatKstShort(date_kst: string): { headline: string; shortDow: string } {
  // headline: "2026년 5월 1일 금요일", shortDow: "FRI · MAY 1"
  const [yyyy, mm, dd] = date_kst.split("-").map(Number);
  const dowEn = DOW_EN[dowIndex(date_kst)];
  const dowKo = DOW_KO[dowIndex(date_kst)];
  return {
    headline: `${yyyy}년 ${mm}월 ${dd}일 ${dowKo}`,
    shortDow: `${dowEn} · ${MONTH_EN[mm - 1]} ${dd}`,
  };
}

export function weekIndexFor(sprintStart: string, today: string): 1 | 2 | 3 | 4 {
  const start = new Date(`${sprintStart}T00:00:00Z`).getTime();
  const t = new Date(`${today}T00:00:00Z`).getTime();
  const days = Math.floor((t - start) / (24 * 60 * 60 * 1000));
  if (days < 0) throw new Error("today before sprint start");
  if (days >= 28) return 4;
  return (Math.floor(days / 7) + 1) as 1 | 2 | 3 | 4;
}

export function dayOfWeekFor(date_kst: string): number {
  return dowIndex(date_kst);
}

export function dayIndexInSprint(sprintStart: string, today: string): number {
  // 0-based — Day 3 = idx 2
  const start = new Date(`${sprintStart}T00:00:00Z`).getTime();
  const t = new Date(`${today}T00:00:00Z`).getTime();
  return Math.floor((t - start) / (24 * 60 * 60 * 1000));
}
