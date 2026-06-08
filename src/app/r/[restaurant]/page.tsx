import { notFound } from "next/navigation";
import { CustomerMenuContent } from "@/components/ui-custom/CustomerMenuContent";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category, Product, TableInfo } from "@/lib/types";

type CustomerMenuPageProps = {
  params: Promise<{ restaurant: string; table?: string }>;
};

type PublicRestaurantMenuData = {
  restaurantName: string;
  restaurantCity: string | null;
  status: "active" | "trial" | "suspended" | "archived";
  ordersEnabled: boolean;
  reviewsEnabled: boolean;
  googleReviewUrl: string;
  categories: Category[];
  products: Product[];
};

type PublicRestaurant = {
  id: string;
  name: string;
  city: string | null;
  status: "active" | "trial" | "suspended" | "archived";
  google_review_url: string | null;
};

type PublicRestaurantTable = {
  id: string;
  name: string;
  slug: string;
  zone: string | null;
  is_active: boolean;
  scans_count: number;
};

type PublicMenuCategory = {
  id: string;
  name: string;
  translations?: Product["translations"] | null;
};

type PublicMenuProduct = {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  price: number | null;
  promo_price: number | null;
  is_available: boolean;
  is_featured: boolean;
  image_url: string | null;
  options_config?: Product["optionsConfig"] | null;
  translations?: Product["translations"] | null;
};

type PublicRestaurantSettings = {
  qr_enabled: boolean | null;
  orders_enabled: boolean | null;
  reviews_enabled: boolean | null;
};

function cleanSlug(value: string) {
  return value.trim();
}

function getProductVisual(name: string): Product["visual"] {
  const normalizedName = name
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalizedName.includes("burger") || normalizedName.includes("kebab") || normalizedName.includes("sandwich")) {
    return "burger";
  }

  if (normalizedName.includes("dessert") || normalizedName.includes("tarte") || normalizedName.includes("glace")) {
    return "cake";
  }

  if (normalizedName.includes("boisson") || normalizedName.includes("coca") || normalizedName.includes("eau")) {
    return "drink";
  }

  return "dish";
}

async function getPublicRestaurantMenuData({
  restaurantSlug,
}: {
  restaurantSlug: string;
}): Promise<{ publicMenu: PublicRestaurantMenuData; table: TableInfo } | null> {
  const supabase = createAdminClient();
  const cleanedRestaurantSlug = cleanSlug(restaurantSlug);

  if (!cleanedRestaurantSlug) {
    return null;
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, city, status, google_review_url")
    .eq("slug", cleanedRestaurantSlug)
    .returns<PublicRestaurant[]>()
    .maybeSingle();

  if (restaurantError || !restaurant) {
    return null;
  }

  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("id, name, slug, zone, is_active, scans_count")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .returns<PublicRestaurantTable[]>()
    .maybeSingle();

  if (tableError || !table) {
    return null;
  }

  const tableInfo: TableInfo = {
    id: table.id,
    slug: table.slug,
    name: table.name,
    area: table.zone ?? "Salle",
    isActive: table.is_active,
    scans: table.scans_count,
  };

  if (restaurant.status !== "active" && restaurant.status !== "trial") {
    return {
      table: tableInfo,
      publicMenu: {
        restaurantName: restaurant.name,
        restaurantCity: restaurant.city,
        status: restaurant.status,
        ordersEnabled: false,
        reviewsEnabled: false,
        googleReviewUrl: restaurant.google_review_url ?? "",
        categories: [],
        products: [],
      },
    };
  }

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("menu_categories")
    .select("id, name, translations")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<PublicMenuCategory[]>();

  if (categoriesError) {
    return null;
  }

  const { data: productsData, error: productsError } = await supabase
    .from("menu_products")
    .select("id, name, category_id, description, price, promo_price, is_available, is_featured, image_url, options_config, translations")
    .eq("restaurant_id", restaurant.id)
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<PublicMenuProduct[]>();

  if (productsError) {
    return null;
  }

  const { data: settingsData, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select("qr_enabled, orders_enabled, reviews_enabled")
    .eq("restaurant_id", restaurant.id)
    .returns<PublicRestaurantSettings[]>()
    .maybeSingle();

  if (settingsError) {
    return null;
  }

  if (settingsData?.qr_enabled === false) {
    return null;
  }

  const products: Product[] = (productsData ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    categoryId: item.category_id ?? "uncategorized",
    description: item.description ?? "",
    price: Number(item.price ?? 0),
    promoPrice: item.promo_price === null ? undefined : Number(item.promo_price),
    available: Boolean(item.is_available),
    isAvailable: Boolean(item.is_available),
    featured: Boolean(item.is_featured),
    promoted: Boolean(item.is_featured),
    visual: getProductVisual(item.name),
    imageUrl: item.image_url ?? undefined,
    optionsConfig: item.options_config ?? undefined,
    translations: item.translations ?? undefined,
  }));

  const visibleCategoryIds = new Set(products.map((product) => product.categoryId));

  const categories: Category[] = (categoriesData ?? [])
    .filter((category) => visibleCategoryIds.has(category.id))
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon: "sparkles",
      translations: category.translations ?? undefined,
    }));

  if (visibleCategoryIds.has("uncategorized")) {
    categories.push({
      id: "uncategorized",
      name: "Sans cat\u00e9gorie",
      icon: "sparkles",
    });
  }

  return {
    table: tableInfo,
    publicMenu: {
      restaurantName: restaurant.name,
      restaurantCity: restaurant.city,
      status: restaurant.status,
      ordersEnabled: settingsData?.orders_enabled ?? true,
      reviewsEnabled: settingsData?.reviews_enabled ?? true,
      googleReviewUrl: restaurant.google_review_url ?? "",
      categories,
      products,
    },
  };
}

export default async function CustomerRestaurantPage({ params }: CustomerMenuPageProps) {
  const { restaurant } = await params;

  const result = await getPublicRestaurantMenuData({
    restaurantSlug: restaurant,
  });

  if (!result) {
    notFound();
  }

  return (
    <CustomerMenuContent
      restaurantSlug={restaurant}
      tableSlug={result.table.slug}
      initialTable={result.table}
      publicMenu={result.publicMenu}
    />
  );
}
