import * as React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchUserSettings } from "@/lib/queries/user-settings";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const hdrs = await headers();
  const path = hdrs.get("x-invoke-path") ?? hdrs.get("x-pathname") ?? "";
  const onOnboarding = path.startsWith("/onboarding");

  if (!onOnboarding) {
    const settings = await fetchUserSettings();
    if (!settings) {
      redirect("/onboarding");
    }
  }

  return <>{children}</>;
}
