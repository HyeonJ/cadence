"use server";
import { fetchUserExport } from "@/lib/queries/user-export";

export async function previewExport(): Promise<
  | { ok: true; sizeBytes: number; rowCounts: Record<string, number> }
  | { ok: false; message: string }
> {
  const r = await fetchUserExport();
  if (!r.ok) return { ok: false, message: r.message };
  const sizeBytes = Buffer.byteLength(JSON.stringify(r.data));
  return {
    ok: true,
    sizeBytes,
    rowCounts: {
      sprints: r.data.sprints.length,
      sprint_backbone_items: r.data.sprint_backbone_items.length,
      daily_cards: r.data.daily_cards.length,
      daily_card_items: r.data.daily_card_items.length,
      yesterday_signals: r.data.yesterday_signals.length,
    },
  };
}
