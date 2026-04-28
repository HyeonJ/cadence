"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { upsertUserSettings, type NotifySlot } from "@/lib/queries/user-settings";

const OnboardingSchema = z.object({
  timezone: z.string().min(1).default("Asia/Seoul"),
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

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export type OnboardingResult =
  | { ok: true }
  | { ok: false; message: string };

export async function completeOnboarding(
  input: OnboardingInput
): Promise<OnboardingResult> {
  const parsed = OnboardingSchema.safeParse(input);
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

  const result = await upsertUserSettings({
    user_id: user.id,
    timezone: parsed.data.timezone,
    github_username: parsed.data.github_username,
    monitored_repos: parsed.data.monitored_repos,
    discord_webhook_url: parsed.data.discord_webhook_url || null,
    notify_schedule: parsed.data.notify_schedule as unknown as NotifySlot[],
  });
  if (!result.ok) return { ok: false, message: result.message };

  return { ok: true };
}

export async function redirectToToday(): Promise<never> {
  redirect("/today");
}
