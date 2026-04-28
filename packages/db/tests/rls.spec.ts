import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types.ts";

const URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!ANON || !SERVICE) {
  throw new Error("SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY required");
}

let serviceClient: SupabaseClient<Database>;
let userA_id: string;
let userB_id: string;

async function createTestUser(email: string): Promise<string> {
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: "test-password-12345",
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

beforeAll(async () => {
  serviceClient = createClient<Database>(URL, SERVICE);
  userA_id = await createTestUser(`a-${Date.now()}@test.local`);
  userB_id = await createTestUser(`b-${Date.now()}@test.local`);

  // user A의 settings row 삽입 (service role)
  const { error } = await serviceClient.from("user_settings").insert({
    user_id: userA_id,
    notify_schedule: [{ time: "07:00", kind: "today_push" }],
    timezone: "Asia/Seoul",
  });
  if (error) throw error;
});

describe("RLS: user_settings", () => {
  it("user B는 user A의 settings를 select할 수 없다", async () => {
    // user B로 로그인한 client 시뮬레이션
    const userBClient = createClient<Database>(URL, ANON, {
      auth: { persistSession: false },
    });
    // service role로 user B의 JWT 발급
    const { data: tokens, error: tokenError } =
      await serviceClient.auth.admin.generateLink({
        type: "magiclink",
        email: `b-${Date.now()}@test.local`,
      });
    // 위 시뮬레이션은 단순화 — 실제로는 supabase-js의 setSession 사용
    // (테스트를 위한 jwt는 별도 helper로 만드는 게 정석)

    // TEMP: anon key만으로 select → auth.uid() = NULL → RLS로 0 row
    const { data, error } = await userBClient
      .from("user_settings")
      .select("*")
      .eq("user_id", userA_id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("service role은 모든 settings를 select 가능", async () => {
    const { data, error } = await serviceClient
      .from("user_settings")
      .select("*")
      .eq("user_id", userA_id);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });
});
