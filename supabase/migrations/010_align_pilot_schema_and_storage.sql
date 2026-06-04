-- Align TableFlash pilot schema with the current application code.
-- This migration is intentionally idempotent so it can repair databases that
-- were created before the latest dashboard/QR/order/review integration.

create extension if not exists pgcrypto;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'payment_status'
  ) then
    execute 'alter type public.payment_status add value if not exists ''cancelled''';
  end if;
end $$;

alter table public.orders
  add column if not exists order_number integer,
  add column if not exists table_label text,
  add column if not exists order_type text not null default 'dine_in',
  add column if not exists subtotal_cents integer not null default 0,
  add column if not exists total_cents integer not null default 0,
  add column if not exists currency text not null default 'EUR',
  add column if not exists payment_method text not null default 'physical';

update public.orders
set
  table_label = coalesce(table_label, 'table-unknown'),
  customer_name = coalesce(nullif(customer_name, ''), 'Client'),
  subtotal_cents = coalesce(nullif(subtotal_cents, 0), round(subtotal * 100)::integer, 0),
  total_cents = coalesce(nullif(total_cents, 0), round(total * 100)::integer, 0),
  currency = coalesce(nullif(currency, ''), 'EUR'),
  payment_method = coalesce(nullif(payment_method, ''), 'physical'),
  order_type = coalesce(nullif(order_type, ''), 'dine_in');

update public.orders
set
  status = 'accepted',
  payment_status = 'paid'
where status::text = 'paid';

with restaurant_order_offsets as (
  select
    restaurant_id,
    coalesce(max(order_number), 0) as max_order_number
  from public.orders
  group by restaurant_id
),
numbered_orders as (
  select
    o.id,
    (
      coalesce(roo.max_order_number, 0)
      + row_number() over (
        partition by o.restaurant_id
        order by o.created_at nulls last, o.id
      )
    )::integer as next_order_number
  from public.orders o
  left join restaurant_order_offsets roo on roo.restaurant_id = o.restaurant_id
  where o.order_number is null
)
update public.orders o
set order_number = n.next_order_number
from numbered_orders n
where o.id = n.id;

alter table public.orders
  alter column table_label set not null,
  alter column table_label set default 'table-unknown',
  alter column customer_name set not null;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'accepted', 'preparing', 'ready', 'served', 'rejected', 'cancelled'));

alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders add constraint orders_order_type_check
  check (order_type in ('dine_in', 'takeaway'));

drop index if exists public.orders_restaurant_order_number_unique;

create unique index if not exists idx_orders_restaurant_order_number
  on public.orders(restaurant_id, order_number)
  where order_number is not null;

create index if not exists idx_orders_restaurant_status_created_at
  on public.orders(restaurant_id, status, created_at desc);

create or replace function public.set_order_number()
returns trigger
language plpgsql
as $$
begin
  if nullif(new.table_label, '') is null then
    select coalesce(t.slug, t.name, 'table-unknown')
    into new.table_label
    from public.restaurant_tables t
    where t.id = new.table_id
      and t.restaurant_id = new.restaurant_id;

    new.table_label = coalesce(nullif(new.table_label, ''), 'table-unknown');
  end if;

  if new.order_number is null then
    perform pg_advisory_xact_lock(hashtext(new.restaurant_id::text));

    select coalesce(max(order_number), 0) + 1
    into new.order_number
    from public.orders
    where restaurant_id = new.restaurant_id;
  end if;

  return new;
end;
$$;

drop trigger if exists set_order_number_before_insert on public.orders;
drop trigger if exists set_orders_order_number on public.orders;
create trigger set_orders_order_number
before insert on public.orders
for each row execute function public.set_order_number();

alter table public.order_items
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade,
  add column if not exists menu_item_id uuid references public.menu_products(id) on delete set null,
  add column if not exists name text,
  add column if not exists unit_price_cents integer not null default 0,
  add column if not exists total_cents integer not null default 0,
  add column if not exists selected_options jsonb not null default '[]'::jsonb;

update public.order_items oi
set
  restaurant_id = coalesce(oi.restaurant_id, o.restaurant_id),
  menu_item_id = coalesce(oi.menu_item_id, oi.product_id),
  name = coalesce(nullif(oi.name, ''), oi.product_name, 'Produit'),
  unit_price_cents = coalesce(nullif(oi.unit_price_cents, 0), round(oi.unit_price * 100)::integer, 0),
  total_cents = coalesce(nullif(oi.total_cents, 0), round(oi.total * 100)::integer, 0)
from public.orders o
where o.id = oi.order_id;

alter table public.order_items
  alter column restaurant_id set not null,
  alter column name set not null;

create index if not exists idx_order_items_restaurant_id on public.order_items(restaurant_id);
create index if not exists idx_order_items_menu_item_id on public.order_items(menu_item_id);

create table if not exists public.restaurant_reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  customer_name text,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  status text not null default 'pending' check (status in ('pending', 'archived')),
  response text,
  response_saved boolean not null default false,
  suggest_google boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.restaurant_reviews
  add column if not exists table_id uuid references public.restaurant_tables(id) on delete set null,
  add column if not exists status text not null default 'pending',
  add column if not exists response_saved boolean not null default false,
  add column if not exists suggest_google boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'reviews'
  ) then
    execute $migrate_reviews$
      insert into public.restaurant_reviews (
        id,
        restaurant_id,
        order_id,
        customer_name,
        rating,
        comment,
        response,
        suggest_google,
        created_at,
        updated_at
      )
      select
        r.id,
        r.restaurant_id,
        r.order_id,
        r.customer_name,
        r.rating,
        r.comment,
        r.response,
        coalesce(r.google_redirected, false),
        r.created_at,
        r.updated_at
      from public.reviews r
      where not exists (
        select 1
        from public.restaurant_reviews rr
        where rr.id = r.id
      )
    $migrate_reviews$;
  end if;
end $$;

create index if not exists idx_restaurant_reviews_restaurant_created_at
  on public.restaurant_reviews(restaurant_id, created_at desc);

create index if not exists idx_restaurant_reviews_order_id
  on public.restaurant_reviews(order_id);

alter table public.restaurant_reviews enable row level security;

drop policy if exists "super_admin_all_restaurant_reviews" on public.restaurant_reviews;
create policy "super_admin_all_restaurant_reviews"
on public.restaurant_reviews
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "staff_manage_restaurant_reviews" on public.restaurant_reviews;
create policy "staff_manage_restaurant_reviews"
on public.restaurant_reviews
for all
to authenticated
using (public.user_has_restaurant_access(restaurant_id))
with check (public.user_has_restaurant_access(restaurant_id));

drop trigger if exists set_restaurant_reviews_updated_at on public.restaurant_reviews;
create trigger set_restaurant_reviews_updated_at
before update on public.restaurant_reviews
for each row execute function public.set_updated_at();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'menu-product-images',
  'menu-product-images',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'image/avif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_read_menu_product_images" on storage.objects;
create policy "public_read_menu_product_images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'menu-product-images');

drop policy if exists "staff_insert_menu_product_images" on storage.objects;
create policy "staff_insert_menu_product_images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'menu-product-images'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.user_has_restaurant_access(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "staff_update_menu_product_images" on storage.objects;
create policy "staff_update_menu_product_images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'menu-product-images'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.user_has_restaurant_access(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'menu-product-images'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.user_has_restaurant_access(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "staff_delete_menu_product_images" on storage.objects;
create policy "staff_delete_menu_product_images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'menu-product-images'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and public.user_has_restaurant_access(((storage.foldername(name))[1])::uuid)
);
