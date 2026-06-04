export const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const hasSupabaseAdminEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

export const isAuthBypassEnabled =
  process.env.NODE_ENV !== "production" &&
  (process.env.TABLEFLASH_AUTH_BYPASS === "true" || process.env.NEXT_PUBLIC_TABLEFLASH_AUTH_BYPASS === "true");
