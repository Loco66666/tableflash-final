-- Add simple, extensible translations for traditional restaurant menus.
-- JSON shape example:
-- {
--   "en": { "name": "Starter", "description": "Optional translated description" }
-- }

alter table public.menu_categories
  add column if not exists translations jsonb not null default '{}'::jsonb;

alter table public.menu_products
  add column if not exists translations jsonb not null default '{}'::jsonb;
