import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@cadence/db";
import { getEnv } from "@/lib/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getEnv();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 set 호출되면 무시 (middleware가 갱신 담당)
          }
        },
      },
    }
  );
}
