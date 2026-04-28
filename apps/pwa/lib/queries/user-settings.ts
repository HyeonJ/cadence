import "server-only";
import type { Tables, TablesInsert } from "@cadence/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type UserSettings = Pick<
  Tables<"user_settings">,
  | "user_id"
  | "timezone"
  | "github_username"
  | "monitored_repos"
  | "discord_webhook_url"
  | "notify_schedule"
>;

export interface NotifySlot {
  time: string;
  kind: "today_push" | "tomorrow_preview";
}

export const DEFAULT_NOTIFY_SCHEDULE: NotifySlot[] = [
  { time: "07:00", kind: "today_push" },
  { time: "22:00", kind: "tomorrow_preview" },
];

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const supabase = await getSupabaseServerClient();
  const res = await supabase
    .from("user_settings")
    .select(
      "user_id, timezone, github_username, monitored_repos, discord_webhook_url, notify_schedule"
    )
    .maybeSingle();
  return (res.data as UserSettings | null) ?? null;
}

export async function upsertUserSettings(
  payload: Omit<TablesInsert<"user_settings">, "created_at" | "updated_at">
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await getSupabaseServerClient();
  const builder = supabase
    .from("user_settings")
    .upsert(payload as never, { onConflict: "user_id" }) as unknown as Promise<{
      error: { message: string } | null;
    }>;
  const res = await builder;
  if (res.error) return { ok: false, message: res.error.message };
  return { ok: true };
}
