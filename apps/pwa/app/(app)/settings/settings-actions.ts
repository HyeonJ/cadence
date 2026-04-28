"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { upsertUserSettings } from "@/lib/queries/user-settings";

const SettingsSchema = z.object({
  timezone: z.string().min(1),
  github_username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/, "GitHub username 형식이 아닙니다"),
  monitored_repos: z.array(z.string().regex(/^[^\s/]+\/[^\s/]+$/, "owner/repo 형식")),
  discord_webhook_url: z
    .string()
    .url()
    .startsWith("https://discord.com/api/webhooks/")
    .or(z.literal(""))
    .optional()
    .default(""),
  notify_schedule: z
    .array(
      z.object({
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        kind: z.enum(["today_push", "tomorrow_preview"]),
      })
    )
    .min(1),
});

export type SettingsInput = z.infer<typeof SettingsSchema>;
export type SettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveSettings(input: SettingsInput): Promise<SettingsResult> {
  const parsed = SettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "auth required" };

  // 호환 캐스트: Plan 04에서 확립된 NotifySlot[] → DB Json 패턴
  const result = await upsertUserSettings({
    user_id: user.id,
    timezone: parsed.data.timezone,
    github_username: parsed.data.github_username,
    monitored_repos: parsed.data.monitored_repos,
    discord_webhook_url: parsed.data.discord_webhook_url || null,
    notify_schedule: parsed.data.notify_schedule as unknown as never,
  });
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/settings");
  return { ok: true };
}

/** Active sprint를 'completed'로 표기 (강제 종료 의미). 새 init은 CLI/Plan 06. */
export async function abortActiveSprint(): Promise<SettingsResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "auth required" };

  const builder = supabase
    .from("sprints")
    .update({ status: "completed" } as never)
    .eq("user_id", user.id)
    .eq("status", "active") as unknown as Promise<{
      error: { message: string } | null;
    }>;
  const res = await builder;
  if (res.error) return { ok: false, message: res.error.message };
  revalidatePath("/sprint");
  revalidatePath("/today");
  return { ok: true };
}
