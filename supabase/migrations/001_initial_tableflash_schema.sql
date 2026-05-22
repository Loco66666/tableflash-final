create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin', 'restaurant_owner', 'restaurant_staff');
create type public.application_status as enum ('pending', 'approved', 'rejected', 'needs_followup');
create type public.restaurant_status as enum ('trial', 'active', 'suspended', 'archived');
create type public.subscription_plan as enum ('trial', 'standard', 'premium');
create type public.order_status as enum ('pending', 'accepted', 'rejected', 'paid', 'preparing', 'ready', 'served', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded');

create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role public.app_role not null default 'restaurant_owner',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table public.restaurants (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  status public.restaurant_status not null default 'trial', owner_id uuid references public.profiles(id), city text, address text, phone text, email text, cuisine_type text,
  plan public.subscription_plan not null default 'trial', trial_ends_at timestamptz, google_review_url text, public_base_url text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.restaurant_members (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, role public.app_role not null default 'restaurant_staff', created_at timestamptz default now(),
  unique (restaurant_id, user_id)
);
create table public.restaurant_applications (
  id uuid primary key default gen_random_uuid(), restaurant_name text not null, owner_name text not null, city text, phone text, email text not null,
  restaurant_type text, source text, status public.application_status not null default 'pending', internal_note text, reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.restaurant_settings (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
  lunch_enabled boolean default true, lunch_start time default '11:30', lunch_end time default '14:30', dinner_enabled boolean default true, dinner_start time default '18:30', dinner_end time default '23:00',
  orders_enabled boolean default true, require_payment_before_preparation boolean default true, qr_enabled boolean default true, reviews_enabled boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null, slug text not null, zone text default 'Salle', is_active boolean default true, scans_count integer default 0,
  created_at timestamptz default now(), updated_at timestamptz default now(), unique (restaurant_id, slug)
);
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null, sort_order integer default 0, is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.menu_products (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null, name text not null, description text,
  price numeric(10,2) not null check (price >= 0), promo_price numeric(10,2) check (promo_price is null or promo_price >= 0), image_url text,
  is_available boolean default true, is_featured boolean default false, sort_order integer default 0, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.restaurant_tables(id) on delete set null, customer_name text, customer_phone text, customer_note text,
  status public.order_status not null default 'pending', payment_status public.payment_status not null default 'unpaid',
  subtotal numeric(10,2) not null default 0, total numeric(10,2) not null default 0, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.menu_products(id) on delete set null, product_name text not null, unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0), total numeric(10,2) not null, created_at timestamptz default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null, customer_name text, rating integer check (rating >= 1 and rating <= 5), comment text, response text,
  google_redirected boolean default false, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.qr_events (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.restaurant_tables(id) on delete set null, user_agent text, ip_hash text, created_at timestamptz default now()
);
create table public.admin_events (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null,
  restaurant_id uuid references public.restaurants(id) on delete set null, event_type text not null, message text not null,
  metadata jsonb default '{}'::jsonb, created_at timestamptz default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  plan public.subscription_plan not null default 'trial', status text not null default 'trialing', monthly_amount numeric(10,2),
  trial_ends_at timestamptz, current_period_ends_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);

create function public.current_user_role() returns public.app_role language sql stable as $$
  select role from public.profiles where id = auth.uid()
$$;
create function public.is_super_admin() returns boolean language sql stable as $$
  select coalesce(public.current_user_role() = 'super_admin', false)
$$;
create function public.user_has_restaurant_access(target_restaurant_id uuid) returns boolean language sql stable as $$
  select exists(select 1 from public.restaurant_members rm where rm.restaurant_id = target_restaurant_id and rm.user_id = auth.uid())
  or exists(select 1 from public.restaurants r where r.id = target_restaurant_id and r.owner_id = auth.uid())
  or public.is_super_admin()
$$;

create index idx_restaurants_slug on public.restaurants(slug);
create index idx_restaurants_owner_id on public.restaurants(owner_id);
create index idx_restaurant_members_user_id on public.restaurant_members(user_id);
create index idx_restaurant_members_restaurant_id on public.restaurant_members(restaurant_id);
create index idx_restaurant_tables_restaurant_slug on public.restaurant_tables(restaurant_id, slug);
create index idx_menu_categories_restaurant_id on public.menu_categories(restaurant_id);
create index idx_menu_products_restaurant_id on public.menu_products(restaurant_id);
create index idx_menu_products_category_id on public.menu_products(category_id);
create index idx_orders_restaurant_created_at on public.orders(restaurant_id, created_at desc);
create index idx_orders_table_id on public.orders(table_id);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_reviews_restaurant_created_at on public.reviews(restaurant_id, created_at desc);
create index idx_qr_events_restaurant_created_at on public.qr_events(restaurant_id, created_at desc);
create index idx_admin_events_created_at on public.admin_events(created_at desc);

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_applications enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.qr_events enable row level security;
alter table public.admin_events enable row level security;
alter table public.subscriptions enable row level security;

create policy super_admin_all_profiles on public.profiles for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_restaurants on public.restaurants for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_restaurant_members on public.restaurant_members for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_restaurant_applications on public.restaurant_applications for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_restaurant_settings on public.restaurant_settings for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_restaurant_tables on public.restaurant_tables for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_menu_categories on public.menu_categories for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_menu_products on public.menu_products for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_orders on public.orders for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_order_items on public.order_items for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_reviews on public.reviews for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_qr_events on public.qr_events for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_admin_events on public.admin_events for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy super_admin_all_subscriptions on public.subscriptions for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy staff_member_restaurants on public.restaurants for select using (public.user_has_restaurant_access(id));
create policy staff_member_restaurant_members on public.restaurant_members for select using (public.user_has_restaurant_access(restaurant_id));
create policy staff_manage_settings on public.restaurant_settings for select using (public.user_has_restaurant_access(restaurant_id));
create policy staff_update_settings on public.restaurant_settings for update using (public.user_has_restaurant_access(restaurant_id)) with check (public.user_has_restaurant_access(restaurant_id));
create policy staff_manage_tables on public.restaurant_tables for all using (public.user_has_restaurant_access(restaurant_id)) with check (public.user_has_restaurant_access(restaurant_id));
create policy staff_manage_categories on public.menu_categories for all using (public.user_has_restaurant_access(restaurant_id)) with check (public.user_has_restaurant_access(restaurant_id));
create policy staff_manage_products on public.menu_products for all using (public.user_has_restaurant_access(restaurant_id)) with check (public.user_has_restaurant_access(restaurant_id));
create policy staff_manage_orders on public.orders for all using (public.user_has_restaurant_access(restaurant_id)) with check (public.user_has_restaurant_access(restaurant_id));
create policy staff_manage_order_items on public.order_items for all using (exists (select 1 from public.orders o where o.id = order_id and public.user_has_restaurant_access(o.restaurant_id))) with check (exists (select 1 from public.orders o where o.id = order_id and public.user_has_restaurant_access(o.restaurant_id)));
create policy staff_manage_reviews on public.reviews for all using (public.user_has_restaurant_access(restaurant_id)) with check (public.user_has_restaurant_access(restaurant_id));

create policy public_read_active_restaurants on public.restaurants for select to anon using (status in ('active', 'trial'));
create policy public_read_active_tables on public.restaurant_tables for select to anon using (is_active = true and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status in ('active', 'trial')));
create policy public_read_active_categories on public.menu_categories for select to anon using (is_active = true and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status in ('active', 'trial')));
create policy public_read_active_products on public.menu_products for select to anon using (is_available = true and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.status in ('active', 'trial')));

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_restaurants_updated_at before update on public.restaurants for each row execute function public.set_updated_at();
create trigger set_restaurant_applications_updated_at before update on public.restaurant_applications for each row execute function public.set_updated_at();
create trigger set_restaurant_settings_updated_at before update on public.restaurant_settings for each row execute function public.set_updated_at();
create trigger set_restaurant_tables_updated_at before update on public.restaurant_tables for each row execute function public.set_updated_at();
create trigger set_menu_categories_updated_at before update on public.menu_categories for each row execute function public.set_updated_at();
create trigger set_menu_products_updated_at before update on public.menu_products for each row execute function public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger set_reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();
create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
