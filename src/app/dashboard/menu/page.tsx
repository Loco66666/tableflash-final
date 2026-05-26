import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { MenuManagerSupabase } from "./menu-manager-supabase";

export default async function MenuPage() {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id,name,description,is_active")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: items } = await supabase
    .from("menu_items")
    .select("id,name,description,price_cents,is_available,category_id")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <AppShell>
      <PageHeader title="Menu" subtitle="Gérez vos produits et catégories" />
      <MenuManagerSupabase categories={categories ?? []} items={items ?? []} />
    </AppShell>
  );
}
