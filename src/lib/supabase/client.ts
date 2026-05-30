"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

function getSupabaseBrowserConfig() {
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

export const createClient = (): SupabaseClient<Database> => {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseBrowserConfig();

  return createBrowserClient(supabaseUrl, supabasePublishableKey) as SupabaseClient<Database>;
};