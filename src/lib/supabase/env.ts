export const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const hasSupabaseAdminEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SECRET_KEY);

export const isAuthBypassEnabled =
  process.env.NEXT_PUBLIC_TABLEFLASH_AUTH_BYPASS === "true";
