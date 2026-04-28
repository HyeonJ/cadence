const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nowKst(): Date {
  const now = Date.now();
  return new Date(now + KST_OFFSET_MS);
}

export function todayKst(): string {
  const k = nowKst();
  const yyyy = k.getUTCFullYear();
  const mm = String(k.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(k.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function yesterdayKst(): string {
  const k = nowKst();
  k.setUTCDate(k.getUTCDate() - 1);
  const yyyy = k.getUTCFullYear();
  const mm = String(k.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(k.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  // Mon=0 ... Sun=6
  const d = new Date(`${date_kst}T00:00:00Z`);
  const js = d.getUTCDay(); // Sun=0 ... Sat=6 (UTC)
  // 변환: Sun(0) → 6, Mon(1) → 0, ...
  return (js + 6) % 7;
}
