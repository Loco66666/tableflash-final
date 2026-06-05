import DashboardClient, { type DashboardClientData } from "@/app/dashboard/dashboard-client";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

type DbOrder = {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string | null;
};

type DbMenuProduct = {
  id: string;
  is_available: boolean;
};

type DbRestaurantTable = {
  id: string;
  is_active: boolean;
};

type DbRestaurantReview = {
  id: string;
  rating: number;
  status: "pending" | "archived";
  created_at: string | null;
};

function getStartOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function isTodayDate(value: string | null) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  })} €`;
}

function formatRating(value: number) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}/5`;
}

export default async function DashboardPage() {
  const { restaurant, settings } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const startOfToday = getStartOfTodayIso();

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("id, status, payment_status, total, created_at")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .returns<DbOrder[]>();

  if (ordersError) {
    console.error("[dashboard] orders query failed", {
      restaurantId: restaurant.id,
      errorCode: ordersError.code,
      errorMessage: ordersError.message,
    });

    throw new Error("Chargement du tableau de bord impossible.");
  }

  const { data: productsData, error: productsError } = await supabase
    .from("menu_products")
    .select("id, is_available")
    .eq("restaurant_id", restaurant.id)
    .returns<DbMenuProduct[]>();

  if (productsError) {
    console.error("[dashboard] products query failed", {
      restaurantId: restaurant.id,
      errorCode: productsError.code,
      errorMessage: productsError.message,
    });

    throw new Error("Chargement du menu impossible.");
  }

  const { data: tablesData, error: tablesError } = await supabase
    .from("restaurant_tables")
    .select("id, is_active")
    .eq("restaurant_id", restaurant.id)
    .returns<DbRestaurantTable[]>();

  if (tablesError) {
    console.error("[dashboard] tables query failed", {
      restaurantId: restaurant.id,
      errorCode: tablesError.code,
      errorMessage: tablesError.message,
    });

    throw new Error("Chargement des QR impossible.");
  }

  const { data: reviewsData, error: reviewsError } = await supabase
    .from("restaurant_reviews")
    .select("id, rating, status, created_at")
    .eq("restaurant_id", restaurant.id)
    .returns<DbRestaurantReview[]>();

  if (reviewsError) {
    console.error("[dashboard] reviews query failed", {
      restaurantId: restaurant.id,
      errorCode: reviewsError.code,
      errorMessage: reviewsError.message,
    });

    throw new Error("Chargement des avis impossible.");
  }

  const orders = ordersData ?? [];
  const products = productsData ?? [];
  const tables = tablesData ?? [];
  const reviews = reviewsData ?? [];

  const todayOrders = orders.filter((order) => order.created_at && order.created_at >= startOfToday);
  const todayRevenueOrders = todayOrders.filter((order) => order.status !== "rejected" && order.status !== "cancelled");
  const todayRevenue = todayRevenueOrders.reduce((total, order) => total + Number(order.total ?? 0), 0);

  const visibleReviews = reviews.filter((review) => review.status !== "archived");
  const averageRating =
    visibleReviews.length > 0
      ? visibleReviews.reduce((total, review) => total + review.rating, 0) / visibleReviews.length
      : 0;

  const todayReviewsCount = reviews.filter((review) => isTodayDate(review.created_at)).length;
  const pendingOrdersCount = orders.filter((order) => order.status === "pending").length;
  const unpaidAcceptedOrdersCount = orders.filter(
    (order) => order.status === "accepted" && order.payment_status !== "paid",
  ).length;
  const pendingReviewsCount = reviews.filter((review) => review.status === "pending").length;
  const unavailableProductsCount = products.filter((product) => !product.is_available).length;
  const activeTablesCount = tables.filter((table) => table.is_active).length;

  const dashboardData: DashboardClientData = {
    restaurant: {
      name: restaurant.name,
      city: restaurant.city,
      status: restaurant.status,
      plan: restaurant.plan,
      email: restaurant.email,
      phone: restaurant.phone,
    },
    settings: {
      lunchEnabled: settings?.lunch_enabled ?? true,
      lunchStart: settings?.lunch_start ?? "12:00",
      lunchEnd: settings?.lunch_end ?? "14:30",
      dinnerEnabled: settings?.dinner_enabled ?? true,
      dinnerStart: settings?.dinner_start ?? "19:00",
      dinnerEnd: settings?.dinner_end ?? "22:30",
      ordersEnabled: settings?.orders_enabled ?? true,
      qrEnabled: settings?.qr_enabled ?? true,
      reviewsEnabled: settings?.reviews_enabled ?? true,
      onSitePaymentEnabled: !(settings?.require_payment_before_preparation ?? false),
    },
    tasks: {
      ordersToAccept: pendingOrdersCount,
      ordersToCollect: unpaidAcceptedOrdersCount,
      reviewsToHandle: pendingReviewsCount,
      unavailableProducts: unavailableProductsCount,
    },
    today: {
      ordersCount: todayOrders.length,
      estimatedSales: formatEuro(todayRevenue),
      averageRating: averageRating > 0 ? formatRating(averageRating) : "0/5",
      reviewsCount: todayReviewsCount,
      activeTablesCount,
      productsCount: products.length,
    },
  };

  return <DashboardClient data={dashboardData} />;
}
