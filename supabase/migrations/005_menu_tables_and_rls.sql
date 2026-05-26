create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.menu_categories add column if not exists description text;
alter table public.menu_categories alter column sort_order set default 0;
alter table public.menu_categories alter column is_active set default true;

alter table public.menu_items add column if not exists currency text not null default 'EUR';

create index if not exists idx_menu_items_restaurant_id on public.menu_items(restaurant_id);
create index if not exists idx_menu_items_category_id on public.menu_items(category_id);

alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;

drop policy if exists super_admin_all_menu_categories on public.menu_categories;
create policy super_admin_all_menu_categories on public.menu_categories for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists super_admin_all_menu_items on public.menu_items;
create policy super_admin_all_menu_items on public.menu_items for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists staff_manage_categories on public.menu_categories;
create policy staff_manage_categories on public.menu_categories for all using (public.user_has_restaurant_access(restaurant_id)) with check (public.user_has_restaurant_access(restaurant_id));

drop policy if exists staff_manage_items on public.menu_items;
create policy staff_manage_items on public.menu_items for all using (public.user_has_restaurant_access(restaurant_id)) with check (public.user_has_restaurant_access(restaurant_id));

drop policy if exists public_read_active_categories on public.menu_categories;
create policy public_read_active_categories on public.menu_categories for select to anon using (is_active = true and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status in ('active', 'trial')));

drop policy if exists public_read_available_menu_items on public.menu_items;
create policy public_read_available_menu_items on public.menu_items for select to anon using (is_available = true and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status in ('active', 'trial')));

drop trigger if exists set_menu_categories_updated_at on public.menu_categories;
create trigger set_menu_categories_updated_at before update on public.menu_categories for each row execute function public.set_updated_at();
drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();
