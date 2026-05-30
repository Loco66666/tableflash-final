import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseCookieToSet } from "@/lib/supabase/cookies";
import type { Database } from "@/lib/supabase/database.types";

type ProxyClient = {
  supabase: SupabaseClient<Database>;
  response: NextResponse;
};

function getSupabaseProxyConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!supabasePublishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.");
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

export function createProxyClient(request: NextRequest): ProxyClient {
  let response = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getSupabaseProxyConfig();

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  }) as SupabaseClient<Database>;

  return { supabase, response };
}