"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { lookupProfileByUserId } from "@/lib/auth/get-current-user";

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  if (!hasSupabaseEnv) {
    return { error: "Supabase n’est pas encore configuré." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth] login failed", {
        email,
        errorCode: error?.code,
        errorMessage: error?.message,
      });
    }

    return { error: "Email ou mot de passe invalide." };
  }

  const profileResult = await lookupProfileByUserId(supabase, data.user.id, data.user.email);

  if (!profileResult.ok) {
    redirect(`/unauthorized?reason=${profileResult.reason}`);
  }

  const { profile } = profileResult;

  if (profile.role === "super_admin") {
    redirect("/admin");
  }

  if (profile.role === "restaurant_owner" || profile.role === "restaurant_staff") {
    redirect("/dashboard");
  }

  redirect("/unauthorized?reason=forbidden_role");
}