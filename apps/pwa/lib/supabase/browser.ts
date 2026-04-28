"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@cadence/db";
import { getEnv } from "@/lib/env";

export function getSupabaseBrowserClient() {
  const env = getEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
