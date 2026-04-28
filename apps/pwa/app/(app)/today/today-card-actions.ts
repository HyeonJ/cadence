"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ToggleSchema = z.object({
  item_id: z.string().uuid(),
  next_status: z.enum(["pending", "done", "skipped"]),
});

export type ToggleResult =
  | { ok: true; status: "pending" | "done" | "skipped" }
  | { ok: false; message: string };

export async function toggleItemStatus(
  input: z.infer<typeof ToggleSchema>
): Promise<ToggleResult> {
  const parsed = ToggleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "invalid input" };
  }
  const supabase = await getSupabaseServerClient();
  // 주의: postgrest-js 2.105의 update<...>.select.single() 타입 추론 결함으로 'never'.
  // 빌더 타입을 unknown으로 좁힌 뒤 결과 데이터를 명시 캐스팅 (런타임 동작 동일).
  const builder = supabase
    .from("daily_card_items")
    .update({
      status: parsed.data.next_status,
      status_changed_at: new Date().toISOString(),
    } as never)
    .eq("id", parsed.data.item_id)
    .select("status")
    .single() as unknown as Promise<{
      data: { status: string } | null;
      error: { message: string } | null;
    }>;
  const updateRes = await builder;
  if (updateRes.error || !updateRes.data) {
    return { ok: false, message: updateRes.error?.message ?? "update failed" };
  }
  revalidatePath("/today");
  return { ok: true, status: updateRes.data.status as "pending" | "done" | "skipped" };
}
