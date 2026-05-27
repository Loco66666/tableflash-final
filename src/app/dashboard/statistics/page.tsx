import StatisticsClient, { type StatisticsClientData } from "@/app/dashboard/statistics/statistics-client";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

type DbOrder = {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  total: number;
  created_at: string | null;
};

type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  total: number;
  created_at: string | null;
};

type DbRestaurantTable = {
  id: string;
  name: string;
  slug: string;
  zone: string | null;
  is_active: boolean;
  scans_count: number;
};

type DbRestaurantReview = {
  id: string;
  rating: number;
  status: "pending" | "archived";
  created_at: string | null;
};

export default async function StatisticsPage() {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("id, restaurant_id, table_id, status, payment_status, subtotal, total, created_at")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .returns<DbOrder[]>();

  if (ordersError) {
    console.error("[dashboard/statistics] orders query failed", {
      restaurantId: restaurant.id,
      errorCode: ordersError.code,
      errorMessage: ordersError.message,
    });

    throw new Error("Chargement des statistiques impossible.");
  }

  const orders = ordersData ?? [];
  const orderIds = orders.map((order) => order.id);

  const { data: orderItemsData, error: orderItemsError } =
    orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("id, order_id, product_id, product_name, unit_price, quantity, total, created_at")
          .in("order_id", orderIds)
          .returns<DbOrderItem[]>()
      : { data: [] as DbOrderItem[], error: null };

  if (orderItemsError) {
    console.error("[dashboard/statistics] order items query failed", {
      restaurantId: restaurant.id,
      errorCode: orderItemsError.code,
      errorMessage: orderItemsError.message,
    });

    throw new Error("Chargement des produits vendus impossible.");
  }

  const { data: tablesData, error: tablesError } = await supabase
    .from("restaurant_tables")
    .select("id, name, slug, zone, is_active, scans_count")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: true })
    .returns<DbRestaurantTable[]>();

  if (tablesError) {
    console.error("[dashboard/statistics] tables query failed", {
      restaurantId: restaurant.id,
      errorCode: tablesError.code,
      errorMessage: tablesError.message,
    });

    throw new Error("Chargement des tables impossible.");
  }

  const { data: reviewsData, error: reviewsError } = await supabase
    .from("restaurant_reviews")
    .select("id, rating, status, created_at")
    .eq("restaurant_id", restaurant.id)
    .returns<DbRestaurantReview[]>();

  if (reviewsError) {
    console.error("[dashboard/statistics] reviews query failed", {
      restaurantId: restaurant.id,
      errorCode: reviewsError.code,
      errorMessage: reviewsError.message,
    });

    throw new Error("Chargement des avis impossible.");
  }

  const statisticsData: StatisticsClientData = {
    restaurantName: restaurant.name,
    orders: orders.map((order) => ({
      id: order.id,
      tableId: order.table_id,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: Number(order.subtotal ?? 0),
      total: Number(order.total ?? 0),
      createdAt: order.created_at,
    })),
    orderItems: (orderItemsData ?? []).map((item) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      unitPrice: Number(item.unit_price ?? 0),
      quantity: item.quantity,
      total: Number(item.total ?? 0),
      createdAt: item.created_at,
    })),
    tables: (tablesData ?? []).map((table) => ({
      id: table.id,
      name: table.name,
      slug: table.slug,
      zone: table.zone,
      isActive: table.is_active,
      scansCount: table.scans_count,
    })),
    reviews: (reviewsData ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      status: review.status,
      createdAt: review.created_at,
    })),
  };

  return <StatisticsClient data={statisticsData} />;
}