import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuManager } from "@/components/ui-custom/MenuManager";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export default async function MenuPage() {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("menu_categories")
    .select("id, name, sort_order, is_active, created_at")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (categoriesError) {
    console.error("[dashboard/menu] categories query failed", {
      restaurantId: restaurant.id,
      errorCode: categoriesError.code,
      errorMessage: categoriesError.message,
    });

    throw new Error("Chargement des catégories impossible.");
  }

  const { data: productsData, error: productsError } = await supabase
    .from("menu_products")
    .select(
      "id, category_id, name, description, price, promo_price, image_url, is_available, is_featured, sort_order, created_at",
    )
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (productsError) {
    console.error("[dashboard/menu] products query failed", {
      restaurantId: restaurant.id,
      errorCode: productsError.code,
      errorMessage: productsError.message,
    });

    throw new Error("Chargement des produits impossible.");
  }

  const categories = (categoriesData ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    icon: "sparkles",
    isActive: category.is_active,
    sortOrder: category.sort_order ?? 0,
  }));

  const products: Product[] = (productsData ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    categoryId: product.category_id ?? "",
    description: product.description ?? "",
    price: Number(product.price ?? 0),
    promoPrice: product.promo_price === null ? undefined : Number(product.promo_price),
    available: product.is_available,
    isAvailable: product.is_available,
    featured: product.is_featured,
    promoted: product.is_featured,
    visual: "salad",
    imageUrl: product.image_url ?? undefined,
  }));

  return (
    <AppShell>
      <PageHeader title="Menu" subtitle={`Gérez les produits de ${restaurant.name}`} />
      <MenuManager initialCategories={categories} initialProducts={products} />
    </AppShell>
  );
}