import { redirect } from "next/navigation";
import { getCurrentProfileResult, getCurrentUser } from "@/lib/auth/get-current-user";
import type { AppRole } from "@/lib/supabase/types";

export async function requireRole(allowedRoles: readonly AppRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profileResult = await getCurrentProfileResult(user.id);

  if (!profileResult.ok) {
    redirect(`/unauthorized?reason=${profileResult.reason}`);
  }

  const { profile } = profileResult;

  if (process.env.NODE_ENV === "development") {
    console.log("[auth] requireRole", {
      userId: user.id,
      userEmail: user.email,
      profileRole: profile.role,
      allowedRoles,
      allowed: allowedRoles.includes(profile.role),
    });
  }

  if (!allowedRoles.includes(profile.role)) {
    redirect("/unauthorized?reason=forbidden_role");
  }

  return {
    user,
    profile,
  };
}