import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/get-current-user";
import type { AppRole } from "@/lib/supabase/types";

export async function requireRole(allowedRoles: readonly AppRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile(user.id);
  if (!profile) {
    redirect("/unauthorized?reason=missing_profile");
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect("/unauthorized");
  }

  return { user, profile };
}
