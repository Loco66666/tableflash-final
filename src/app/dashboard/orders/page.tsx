import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrdersBoard } from "@/components/ui-custom/OrdersBoard";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { normalizeOrderFilterSlug } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderLine, OrderStatus, SelectedProductOption } from "@/lib/types";

type OrdersPageProps = {
  searchParams: Promise<{ filter?: string | string[] }>;
};

type DbOrder = {
  id: string;
  order_number: number | null;
  restaurant_id: string;
  table_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_note: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  total: number;
  created_at: string | null;
  updated_at: string | null;
};

type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  total: number;
  selected_options?: SelectedProductOption[] | null;
  created_at: string | null;
};

type DbRestaurantTable = {
  id: string;
  name: string;
  slug: string;
  zone: string | null;
};

function parseTableNumber(tableName: string, tableSlug: string) {
  const match = tableName.match(/\d+/) ?? tableSlug.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function mapDbStatusToUiStatus(status: string, paymentStatus: string): OrderStatus {
  if (status === "pending") return "new";
  if (status === "accepted") return paymentStatus === "paid" ? "paid" : "payment_pending";
  if (status === "preparing") return "preparing";
  if (status === "ready") return "ready";
  if (status === "served") return "served";
  if (status === "rejected" || status === "cancelled") return "refused";

  return "new";
}

function getServiceDate(createdAt: string | null) {
  if (!createdAt) return new Date().toISOString().slice(0, 10);
  return createdAt.slice(0, 10);
}

function getServiceTime(createdAt: string | null) {
  if (!createdAt) return undefined;

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildOrderViewModel({
  order,
  lines,
  table,
  restaurantSlug,
}: {
  order: DbOrder;
  lines: DbOrderItem[];
  table?: DbRestaurantTable;
  restaurantSlug: string;
}): Order {
  const uiStatus = mapDbStatusToUiStatus(order.status, order.payment_status);
  const paid = order.payment_status === "paid";

  const orderLines: OrderLine[] = lines.map((line) => ({
    productId: line.product_id ?? line.id,
    quantity: line.quantity,
    name: line.product_name,
    unitPrice: Number(line.unit_price ?? 0),
    selectedOptions: Array.isArray(line.selected_options) ? line.selected_options : [],
  }));

  return {
    id: order.id,
    orderNumber: order.order_number ?? undefined,
    createdAt: order.created_at ?? undefined,
    table: table ? parseTableNumber(table.name, table.slug) : 0,
    tableId: order.table_id,
    tableSlug: table?.slug,
    tableName: table?.name ?? "Table",
    tableArea: table?.zone ?? "Salle",
    restaurantSlug,
    status: uiStatus,
    items: lines.reduce((total, line) => total + line.quantity, 0),
    total: Number(order.total ?? 0),
    paid,
    paymentStatus: paid ? "paid" : order.payment_status === "cancelled" ? "cancelled" : "on_site_pending",
    paymentMethod: "on_site",
    customerName: order.customer_name || "Client",
    customerPhone: order.customer_phone ?? undefined,
    customerNote: order.customer_note ?? undefined,
    serviceDate: getServiceDate(order.created_at),
    serviceTime: getServiceTime(order.created_at),
    lines: orderLines,
    source: "qr",
  };
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { filter } = await searchParams;
  const initialFilter = normalizeOrderFilterSlug(filter);
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_number, restaurant_id, table_id, customer_name, customer_phone, customer_note, status, payment_status, subtotal, total, created_at, updated_at")    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .returns<DbOrder[]>();

  if (ordersError) {
    console.error("[dashboard/orders] orders query failed", {
      restaurantId: restaurant.id,
      errorCode: ordersError.code,
      errorMessage: ordersError.message,
    });

    throw new Error("Chargement des commandes impossible.");
  }

  const orders = ordersData ?? [];
  const orderIds = orders.map((order) => order.id);
  const tableIds = [...new Set(orders.map((order) => order.table_id).filter(Boolean))];

  const { data: orderItemsData, error: orderItemsError } =
    orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("id, order_id, product_id, product_name, unit_price, quantity, total, selected_options, created_at")
          .in("order_id", orderIds)
          .returns<DbOrderItem[]>()
      : { data: [] as DbOrderItem[], error: null };

  if (orderItemsError) {
    console.error("[dashboard/orders] order items query failed", {
      restaurantId: restaurant.id,
      errorCode: orderItemsError.code,
      errorMessage: orderItemsError.message,
    });

    throw new Error("Chargement des produits commandés impossible.");
  }

  const { data: tablesData, error: tablesError } =
    tableIds.length > 0
      ? await supabase
          .from("restaurant_tables")
          .select("id, name, slug, zone")
          .in("id", tableIds)
          .returns<DbRestaurantTable[]>()
      : { data: [] as DbRestaurantTable[], error: null };

  if (tablesError) {
    console.error("[dashboard/orders] tables query failed", {
      restaurantId: restaurant.id,
      errorCode: tablesError.code,
      errorMessage: tablesError.message,
    });

    throw new Error("Chargement des tables impossible.");
  }

  const linesByOrderId = new Map<string, DbOrderItem[]>();
  for (const item of orderItemsData ?? []) {
    const currentItems = linesByOrderId.get(item.order_id) ?? [];
    currentItems.push(item);
    linesByOrderId.set(item.order_id, currentItems);
  }

  const tablesById = new Map((tablesData ?? []).map((table) => [table.id, table]));

  const initialOrders = orders.map((order) =>
    buildOrderViewModel({
      order,
      lines: linesByOrderId.get(order.id) ?? [],
      table: tablesById.get(order.table_id),
      restaurantSlug: restaurant.slug,
    }),
  );

  return (
    <AppShell>
      <PageHeader title="Commandes" subtitle={`Service en cours — ${restaurant.name}`} />
      <OrdersBoard initialFilter={initialFilter} initialOrders={initialOrders} />
    </AppShell>
  );
}
