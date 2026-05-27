-- Sprint Supabase 8: normalize orders schema for public QR ordering

alter table public.orders
  add column if not exists table_label text,
  add column if not exists order_type text not null default 'dine_in',
  add column if not exists subtotal_cents integer not null default 0,
  add column if not exists total_cents integer not null default 0,
  add column if not exists currency text not null default 'EUR',
  add column if not exists payment_method text not null default 'physical';

alter table public.order_items
  add column if not exists restaurant_id uuid references public.restaurants(id) on delete cascade,
  add column if not exists menu_item_id uuid references public.menu_products(id) on delete set null,
  add column if not exists name text,
  add column if not exists unit_price_cents integer not null default 0,
  add column if not exists total_cents integer not null default 0;

update public.orders
set
  table_label = coalesce(table_label, 'table-unknown'),
  customer_name = coalesce(nullif(customer_name, ''), 'Client'),
  subtotal_cents = coalesce(subtotal_cents, round(subtotal * 100)::integer, 0),
  total_cents = coalesce(total_cents, round(total * 100)::integer, 0),
  payment_method = coalesce(payment_method, 'physical'),
  order_type = coalesce(order_type, 'dine_in');

update public.order_items oi
set
  restaurant_id = coalesce(oi.restaurant_id, o.restaurant_id),
  menu_item_id = coalesce(oi.menu_item_id, oi.product_id),
  name = coalesce(oi.name, oi.product_name, 'Produit'),
  unit_price_cents = coalesce(oi.unit_price_cents, round(oi.unit_price * 100)::integer, 0),
  total_cents = coalesce(oi.total_cents, round(oi.total * 100)::integer, 0)
from public.orders o
where o.id = oi.order_id;

alter table public.orders
  alter column table_label set not null,
  alter column customer_name set not null;

alter table public.order_items
  alter column restaurant_id set not null,
  alter column name set not null;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'accepted', 'preparing', 'ready', 'served', 'rejected', 'cancelled'));
alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders add constraint orders_order_type_check
  check (order_type in ('dine_in', 'takeaway'));

create index if not exists idx_order_items_restaurant_id on public.order_items(restaurant_id);
create index if not exists idx_order_items_menu_item_id on public.order_items(menu_item_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public_insert_orders_active_restaurants" on public.orders;
create policy "public_insert_orders_active_restaurants"
on public.orders for insert to anon, authenticated
with check (
  exists (
    select 1 from public.restaurants r
    left join public.restaurant_settings rs on rs.restaurant_id = r.id
    where r.id = restaurant_id
      and r.status in ('active', 'trial')
      and coalesce(rs.orders_enabled, true) = true
  )
);

drop policy if exists "public_insert_order_items_active_restaurants" on public.order_items;
create policy "public_insert_order_items_active_restaurants"
on public.order_items for insert to anon, authenticated
with check (
  exists (
    select 1 from public.orders o
    join public.restaurants r on r.id = o.restaurant_id
    left join public.restaurant_settings rs on rs.restaurant_id = r.id
    where o.id = order_id
      and o.restaurant_id = restaurant_id
      and r.status in ('active', 'trial')
      and coalesce(rs.orders_enabled, true) = true
  )
);

