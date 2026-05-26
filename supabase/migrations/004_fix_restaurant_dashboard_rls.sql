create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('restaurant_members', 'restaurants', 'restaurant_settings')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  end loop;
end $$;

create policy "restaurant_members_select_admin_or_own"
on public.restaurant_members
for select
to authenticated
using (
  public.is_super_admin()
  or user_id = auth.uid()
);

create policy "restaurants_select_admin_owner_or_member"
on public.restaurants
for select
to authenticated
using (
  public.is_super_admin()
  or owner_id = auth.uid()
  or exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = restaurants.id
      and rm.user_id = auth.uid()
  )
);

create policy "restaurants_update_admin_owner_or_member"
on public.restaurants
for update
to authenticated
using (
  public.is_super_admin()
  or owner_id = auth.uid()
  or exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = restaurants.id
      and rm.user_id = auth.uid()
      and rm.role in ('restaurant_owner', 'restaurant_staff')
  )
)
with check (
  public.is_super_admin()
  or owner_id = auth.uid()
  or exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = restaurants.id
      and rm.user_id = auth.uid()
      and rm.role in ('restaurant_owner', 'restaurant_staff')
  )
);

create policy "restaurant_settings_select_admin_owner_or_member"
on public.restaurant_settings
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_settings.restaurant_id
      and r.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = restaurant_settings.restaurant_id
      and rm.user_id = auth.uid()
  )
);

create policy "restaurant_settings_insert_admin_owner_or_member"
on public.restaurant_settings
for insert
to authenticated
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_settings.restaurant_id
      and r.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = restaurant_settings.restaurant_id
      and rm.user_id = auth.uid()
      and rm.role in ('restaurant_owner', 'restaurant_staff')
  )
);

create policy "restaurant_settings_update_admin_owner_or_member"
on public.restaurant_settings
for update
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_settings.restaurant_id
      and r.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = restaurant_settings.restaurant_id
      and rm.user_id = auth.uid()
      and rm.role in ('restaurant_owner', 'restaurant_staff')
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_settings.restaurant_id
      and r.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = restaurant_settings.restaurant_id
      and rm.user_id = auth.uid()
      and rm.role in ('restaurant_owner', 'restaurant_staff')
  )
);