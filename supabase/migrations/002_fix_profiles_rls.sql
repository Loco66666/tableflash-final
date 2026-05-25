-- 002_fix_profiles_rls.sql
--
-- Why this migration exists:
-- Recursive RLS policies on public.profiles (policies that directly or indirectly
-- read from public.profiles while evaluating access to public.profiles) can cause
-- PostgreSQL to recurse during policy evaluation and eventually fail with:
--   stack depth limit exceeded (e.g. error code 54001).
--
-- For authentication and role lookup at login, the application only needs each
-- authenticated user to read their own profile row.
-- The safe policy is:
--   using (id = auth.uid())
-- which does not query public.profiles from inside the policy.

-- Remove known and likely-recursive legacy policies if they exist.
drop policy if exists "profiles_select_super_admin" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_all_authenticated" on public.profiles;
drop policy if exists "profiles_read_super_admin" on public.profiles;
drop policy if exists "profiles_read_admin" on public.profiles;
drop policy if exists "profiles_read_own" on public.profiles;

-- Recreate only the safe self-read policy required for login/profile lookup.
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());
