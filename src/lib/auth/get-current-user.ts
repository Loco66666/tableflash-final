import { createClient } from "@/lib/supabase/server";
import { isAuthBypassEnabled } from "@/lib/supabase/env";
import type { AppRole } from "@/lib/supabase/types";

export type CurrentProfile = {
  id: string;
  role: AppRole;
};

export async function getCurrentUser() {
  if (isAuthBypassEnabled) {
    return { id: "bypass-user", email: "bypass@tableflash.local" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getCurrentProfile(userId?: string): Promise<CurrentProfile | null> {
  if (isAuthBypassEnabled) {
    return { id: "bypass-user", role: "super_admin" };
  }

  const user = userId ? { id: userId } : await getCurrentUser();
  if (!user?.id) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as CurrentProfile;
}
