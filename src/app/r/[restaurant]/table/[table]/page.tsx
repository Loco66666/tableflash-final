import { notFound } from "next/navigation";
import { CustomerMenuContent } from "@/components/ui-custom/CustomerMenuContent";
import { findTableBySlug } from "@/lib/tables";
import type { Category, Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type CustomerMenuPageProps = {
  params: Promise<{ restaurant: string; table: string }>;
};

type PublicRestaurantMenuData = {
  restaurantName: string;
  restaurantCity: string | null;
  status: "active" | "trial" | "suspended" | "archived";
  ordersEnabled: boolean;
  categories: Category[];
  products: Product[];
};

async function getPublicRestaurantMenuData(restaurantSlug: string): Promise<PublicRestaurantMenuData | null> {
  const supabase = await createClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, city, status")
    .eq("slug", restaurantSlug)
    .maybeSingle();

  if (restaurantError) return null;
  if (!restaurant) return null;

  const { data: categoriesData } = await supabase
    .from("menu_categories")
    .select("id, name")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: productsData } = await supabase
    .from("menu_products")
    .select("id, name, category_id, description, price_cents, is_available, image_url")
    .eq("restaurant_id", restaurant.id)
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const products = (productsData ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    categoryId: item.category_id ?? "uncategorized",
    description: item.description ?? "",
    price: (item.price_cents ?? 0) / 100,
    available: Boolean(item.is_available),
    visual: item.name,
    imageUrl: item.image_url ?? undefined,
  }));

  const visibleCategoryIds = new Set(products.map((product) => product.categoryId));
  const categories: Category[] = (categoriesData ?? [])
    .filter((category) => visibleCategoryIds.has(category.id))
    .map((category) => ({ id: category.id, name: category.name, icon: "sparkles" }));

  if (visibleCategoryIds.has("uncategorized")) {
    categories.push({ id: "uncategorized", name: "Sans catégorie", icon: "sparkles" });
  }

  const { data: settingsData } = await supabase
    .from("restaurant_settings")
    .select("orders_enabled")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();


  return {
    restaurantName: restaurant.name,
    restaurantCity: restaurant.city,
    status: restaurant.status,
    ordersEnabled: settingsData?.orders_enabled ?? true,
    categories,
    products,
  };
}

export default async function CustomerMenuPage({ params }: CustomerMenuPageProps) {
  const { restaurant, table } = await params;
  const initialTable = findTableBySlug(table);
  const publicMenu = await getPublicRestaurantMenuData(restaurant);

  if (!publicMenu) {
    notFound();
  }

  return (
    <CustomerMenuContent
      restaurantSlug={restaurant}
      tableSlug={table}
      initialTable={initialTable}
      publicMenu={publicMenu}
    />
  );
}
