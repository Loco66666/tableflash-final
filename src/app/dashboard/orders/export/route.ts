import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExportPeriod = "today" | "7d" | "30d";

type ExportOrder = {
  id: string;
  order_number: number | null;
  table_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_note: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number | null;
  total: number | null;
  created_at: string | null;
};

type ExportOrderItem = {
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number | null;
  total: number | null;
};

type ExportTable = {
  id: string;
  name: string;
  slug: string;
  zone: string | null;
};

const periodLabels = {
  today: "aujourd-hui",
  "7d": "7-jours",
  "30d": "30-jours",
} satisfies Record<ExportPeriod, string>;

function normalizePeriod(value: string | null): ExportPeriod {
  if (value === "7d" || value === "30d") return value;
  return "today";
}

function getPeriodStart(period: ExportPeriod) {
  const now = new Date();

  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const days = period === "7d" ? 7 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return start;
}

function formatDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getOrderStatusLabel(status: string, paymentStatus: string) {
  if (status === "pending") return "Nouvelle";
  if (status === "accepted" && paymentStatus === "paid") return "Payee";
  if (status === "accepted") return "A encaisser";
  if (status === "preparing") return "En preparation";
  if (status === "ready") return "Prete";
  if (status === "served") return "Servie";
  if (status === "rejected") return "Refusee";
  if (status === "cancelled") return "Annulee";

  return status;
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function formatAmount(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return value.toFixed(2).replace(".", ",");
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET(request: Request) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const requestUrl = new URL(request.url);
  const period = normalizePeriod(requestUrl.searchParams.get("period"));
  const periodStart = getPeriodStart(period);

  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, order_number, table_id, customer_name, customer_phone, customer_note, status, payment_status, payment_method, subtotal, total, created_at",
    )
    .eq("restaurant_id", restaurant.id)
    .gte("created_at", periodStart.toISOString())
    .order("created_at", { ascending: false })
    .returns<ExportOrder[]>();

  if (ordersError) {
    console.error("[dashboard/orders/export] orders query failed", {
      restaurantId: restaurant.id,
      errorCode: ordersError.code,
      errorMessage: ordersError.message,
    });

    return new Response("Export impossible.", { status: 500 });
  }

  const orders = ordersData ?? [];
  const orderIds = orders.map((order) => order.id);
  const tableIds = [
    ...new Set(
      orders
        .map((order) => order.table_id)
        .filter((tableId): tableId is string => Boolean(tableId)),
    ),
  ];

  const { data: itemsData, error: itemsError } =
    orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("order_id, product_name, quantity, unit_price, total")
          .in("order_id", orderIds)
          .returns<ExportOrderItem[]>()
      : { data: [] as ExportOrderItem[], error: null };

  if (itemsError) {
    console.error("[dashboard/orders/export] order items query failed", {
      restaurantId: restaurant.id,
      errorCode: itemsError.code,
      errorMessage: itemsError.message,
    });

    return new Response("Export impossible.", { status: 500 });
  }

  const { data: tablesData, error: tablesError } =
    tableIds.length > 0
      ? await supabase
          .from("restaurant_tables")
          .select("id, name, slug, zone")
          .in("id", tableIds)
          .returns<ExportTable[]>()
      : { data: [] as ExportTable[], error: null };

  if (tablesError) {
    console.error("[dashboard/orders/export] tables query failed", {
      restaurantId: restaurant.id,
      errorCode: tablesError.code,
      errorMessage: tablesError.message,
    });

    return new Response("Export impossible.", { status: 500 });
  }

  const itemsByOrderId = new Map<string, ExportOrderItem[]>();
  for (const item of itemsData ?? []) {
    const items = itemsByOrderId.get(item.order_id) ?? [];
    items.push(item);
    itemsByOrderId.set(item.order_id, items);
  }

  const tablesById = new Map((tablesData ?? []).map((table) => [table.id, table]));
  const rows = [
    [
      "Date",
      "Numero",
      "Table",
      "Zone",
      "Statut",
      "Paiement",
      "Total EUR",
      "Client",
      "Telephone",
      "Produits",
      "Note client",
    ],
  ];

  for (const order of orders) {
    const table = order.table_id ? tablesById.get(order.table_id) : undefined;
    const items = itemsByOrderId.get(order.id) ?? [];
    const products = items
      .map((item) => {
        const unitPrice = formatAmount(item.unit_price);
        return `${item.quantity}x ${item.product_name}${unitPrice ? ` (${unitPrice} EUR)` : ""}`;
      })
      .join(" | ");

    rows.push([
      formatDateTime(order.created_at),
      order.order_number ? String(order.order_number) : order.id.slice(0, 8).toUpperCase(),
      table?.name ?? "",
      table?.zone ?? "",
      getOrderStatusLabel(order.status, order.payment_status),
      order.payment_status === "paid" ? "Payee" : order.payment_status === "cancelled" ? "Annulee" : "Sur place",
      formatAmount(order.total),
      order.customer_name ?? "",
      order.customer_phone ?? "",
      products,
      order.customer_note ?? "",
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const filename = [
    "commandes",
    sanitizeFilenamePart(restaurant.slug || restaurant.name || "restaurant"),
    periodLabels[period],
    new Date().toISOString().slice(0, 10),
  ].join("-");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
