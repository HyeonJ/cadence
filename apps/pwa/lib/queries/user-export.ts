import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface UserExport {
  exported_at: string;
  user_id: string;
  user_settings: unknown | null;
  sprints: unknown[];
  sprint_backbone_items: unknown[];
  daily_cards: unknown[];
  daily_card_items: unknown[];
  yesterday_signals: unknown[];
}

export async function fetchUserExport(): Promise<
  | { ok: true; data: UserExport }
  | { ok: false; message: string }
> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "auth required" };

  const [settings, sprints, items, cards, cardItems, signals] = await Promise.all([
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("sprints").select("*"),
    supabase.from("sprint_backbone_items").select("*"),
    supabase.from("daily_cards").select("*"),
    supabase.from("daily_card_items").select("*"),
    supabase.from("yesterday_signals").select("*"),
  ]);

  for (const r of [settings, sprints, items, cards, cardItems, signals]) {
    if (r.error) return { ok: false, message: r.error.message };
  }

  return {
    ok: true,
    data: {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      user_settings: settings.data ?? null,
      sprints: sprints.data ?? [],
      sprint_backbone_items: items.data ?? [],
      daily_cards: cards.data ?? [],
      daily_card_items: cardItems.data ?? [],
      yesterday_signals: signals.data ?? [],
    },
  };
}
