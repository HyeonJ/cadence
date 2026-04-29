"use server";
import { redirect } from "next/navigation";
import { fetchUserExport } from "@/lib/queries/user-export";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

export async function deleteAccount(input: {
  confirmText: string;
}): Promise<{ ok: false; message: string } | never> {
  if (input.confirmText !== "DELETE") {
    return { ok: false, message: "확인 문구가 일치하지 않습니다." };
  }
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "auth required" };

  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { ok: false, message: error.message };
  }
  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
