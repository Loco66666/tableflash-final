import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseCookieToSet } from "@/lib/supabase/cookies";
import type { Database } from "@/lib/supabase/database.types";

function getSupabaseServerConfig() {
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

export const createClient = async (): Promise<SupabaseClient<Database>> => {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } = getSupabaseServerConfig();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: SupabaseCookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies.
          // This is safe to ignore because proxy.ts refreshes the session cookies.
        }
      },
    },
  }) as SupabaseClient<Database>;
};