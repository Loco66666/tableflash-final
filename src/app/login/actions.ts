"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentProfile } from "@/lib/auth/get-current-user";

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  if (!hasSupabaseEnv) {
    return { error: "Supabase n’est pas encore configuré." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Email ou mot de passe invalide." };
  }

  const profile = await getCurrentProfile(data.user.id);
  if (!profile) redirect("/unauthorized?reason=missing_profile");

  if (profile.role === "super_admin") redirect("/admin");
  if (profile.role === "restaurant_owner" || profile.role === "restaurant_staff") redirect("/dashboard");

  redirect("/unauthorized");
}
