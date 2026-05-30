import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

function getSupabaseAdminConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("L’URL Supabase serveur n’est pas configurée.");
  }

  if (!supabaseSecretKey) {
    throw new Error("La clé serveur Supabase n’est pas configurée.");
  }

  return {
    supabaseUrl,
    supabaseSecretKey,
  };
}

export function createAdminClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminConfig();

  return createSupabaseClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}