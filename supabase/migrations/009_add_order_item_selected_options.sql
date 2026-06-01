alter table public.order_items
add column if not exists selected_options jsonb not null default '[]'::jsonb;
