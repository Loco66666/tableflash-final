import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAuthBypassEnabled } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";
import type { AppRole } from "@/lib/supabase/types";

export type CurrentProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AppRole;
};

export type ProfileLookupResult =
  | {
      ok: true;
      profile: CurrentProfile;
    }
  | {
      ok: false;
      reason: "missing_profile" | "profile_query_error";
      message?: string;
    };

export async function getCurrentUser() {
  if (isAuthBypassEnabled) {
    return { id: "bypass-user", email: "bypass@tableflash.local" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function lookupProfileByUserId(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail?: string | null,
): Promise<ProfileLookupResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth] profile query failed", {
        userId,
        userEmail,
        errorCode: error.code,
        errorMessage: error.message,
      });
    }

    return {
      ok: false,
      reason: "profile_query_error",
      message: error.message,
    };
  }

  if (!data) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth] profile missing", {
        userId,
        userEmail,
      });
    }

    return {
      ok: false,
      reason: "missing_profile",
    };
  }

  return {
    ok: true,
    profile: {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
    },
  };
}

export async function getCurrentProfileResult(userId?: string): Promise<ProfileLookupResult> {
  if (isAuthBypassEnabled) {
    return {
      ok: true,
      profile: {
        id: "bypass-user",
        email: "bypass@tableflash.local",
        fullName: "Bypass Admin",
        role: "super_admin",
      },
    };
  }

  const user = userId ? { id: userId, email: null } : await getCurrentUser();

  if (!user?.id) {
    return {
      ok: false,
      reason: "missing_profile",
    };
  }

  const supabase = await createClient();

  return lookupProfileByUserId(supabase, user.id, user.email);
}

export async function getCurrentProfile(userId?: string): Promise<CurrentProfile | null> {
  const result = await getCurrentProfileResult(userId);

  return result.ok ? result.profile : null;
}