import { NextResponse, type NextRequest } from "next/server";
import { lookupProfileByUserId } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    return siteUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
  }

  return "http://127.0.0.1:3000";
}

function getSafeNextPath(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return next;
}

function redirectTo(pathname: string) {
  return NextResponse.redirect(new URL(pathname, getSiteUrl()));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return redirectTo("/login");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth/callback] code exchange failed", {
        errorCode: error.code,
        errorMessage: error.message,
      });
    }

    return redirectTo("/login");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectTo("/login");
  }

  const profileResult = await lookupProfileByUserId(supabase, user.id, user.email);

  if (!profileResult.ok) {
    return redirectTo(`/unauthorized?reason=${profileResult.reason}`);
  }

  const nextPath = getSafeNextPath(request);

  if (nextPath) {
    return redirectTo(nextPath);
  }

  if (profileResult.profile.role === "super_admin") {
    return redirectTo("/admin");
  }

  if (profileResult.profile.role === "restaurant_owner" || profileResult.profile.role === "restaurant_staff") {
    return redirectTo("/dashboard");
  }

  return redirectTo("/unauthorized?reason=forbidden_role");
}
