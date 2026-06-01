alter table public.menu_products
add column if not exists options_config jsonb not null default '{
  "groups": [],
  "allergens": [],
  "availability": {
    "enabled": false
  }
}'::jsonb;
