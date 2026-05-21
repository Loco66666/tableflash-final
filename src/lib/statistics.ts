import type { Order, OrderLine, Product, Review, TableInfo } from "@/lib/types";

export const REFERENCE_DATE = "2026-05-17";

export type StatisticsFilter = "today" | "seven-days" | "thirty-days" | "lunch" | "dinner";
export type StatisticsOrderService = "midi" | "soir";

export type ChartPoint = {
  label: string;
  value: number;
};

export type TopProduct = {
  id: string;
  name: string;
  visual: string;
  quantity: number;
  revenue: number;
};

export type ActiveTable = {
  table: number;
  name: string;
  area: string;
  orders: number;
  scans: number;
};

export type StatisticsModel = {
  filteredOrders: Order[];
  salesOrders: Order[];
  orderCount: number;
  salesTotal: number;
  averageBasket: number;
  averageRating: number;
  chart: ChartPoint[];
  topProducts: TopProduct[];
  activeTables: ActiveTable[];
  insights: string[];
};

const SALES_STATUSES = new Set(["paid", "preparing", "ready", "served"]);
const LUNCH_START = 11;
const LUNCH_END = 15;
const DINNER_START = 18;
const DINNER_END = 23;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getStatisticsModel(params: {
  filter: StatisticsFilter;
  orders: Order[];
  reviews: Review[];
  products: Product[];
  tables: TableInfo[];
}): StatisticsModel {
  const filteredOrders = filterOrders(params.orders, params.filter);
  const salesOrders = filteredOrders.filter(isSalesOrder);
  const orderCount = filteredOrders.filter((order) => order.status !== "refused").length;
  const salesTotal = roundMoney(salesOrders.reduce((sum, order) => sum + order.total, 0));
  const averageBasket = orderCount > 0 ? roundMoney(salesTotal / orderCount) : 0;
  const averageRating = getAverageRating(params.reviews, filteredOrders);
  const chart = getActivityChart(filteredOrders, params.filter);
  const topProducts = getTopProducts(filteredOrders, params.products);
  const activeTables = getActiveTables(filteredOrders, params.tables);
  const insights = getInsights({ chart, topProducts, activeTables, filteredOrders });

  return { filteredOrders, salesOrders, orderCount, salesTotal, averageBasket, averageRating, chart, topProducts, activeTables, insights };
}

function filterOrders(orders: Order[], filter: StatisticsFilter) {
  return orders.filter((order) => {
    if (filter === "lunch") return isInService(order, "midi");
    if (filter === "dinner") return isInService(order, "soir");
    const distance = daysBetween(order.serviceDate, REFERENCE_DATE);
    if (filter === "today") return distance === 0;
    if (filter === "seven-days") return distance >= 0 && distance <= 6;
    return distance >= 0 && distance <= 29;
  });
}

function isSalesOrder(order: Order) {
  return SALES_STATUSES.has(order.status);
}

function getAverageRating(reviews: Review[], orders: Order[]) {
  const orderIds = new Set(orders.map((order) => order.id));
  const relatedReviews = reviews.filter((review) => orderIds.has(review.orderId));
  const sourceReviews = relatedReviews.length > 0 ? relatedReviews : reviews;

  if (sourceReviews.length === 0) return 0;

  const average = sourceReviews.reduce((sum, review) => sum + review.rating, 0) / sourceReviews.length;
  return Math.round(average * 10) / 10;
}

function getActivityChart(orders: Order[], filter: StatisticsFilter): ChartPoint[] {
  if (filter === "today" || filter === "lunch" || filter === "dinner") {
    const labels = filter === "dinner" ? ["18h", "19h", "20h", "21h", "22h", "23h"] : filter === "lunch" ? ["11h", "12h", "13h", "14h", "15h"] : ["6h", "8h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"];
    return labels.map((label) => {
      const hour = Number.parseInt(label, 10);
      return { label, value: orders.filter((order) => getOrderHour(order) === hour).length };
    });
  }

  if (filter === "seven-days") {
    const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const dateLabels = getPreviousDates(6).reverse();
    return dateLabels.map((date, index) => ({ label: labels[index], value: orders.filter((order) => order.serviceDate === date).length }));
  }

  const segments = [
    { label: "S-3", min: 22, max: 29 },
    { label: "S-2", min: 15, max: 21 },
    { label: "S-1", min: 8, max: 14 },
    { label: "Semaine", min: 0, max: 7 },
  ];

  return segments.map((segment) => ({
    label: segment.label,
    value: orders.filter((order) => {
      const distance = daysBetween(order.serviceDate, REFERENCE_DATE);
      return distance >= segment.min && distance <= segment.max;
    }).length,
  }));
}

function getTopProducts(orders: Order[], products: Product[]): TopProduct[] {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const totals = new Map<string, { quantity: number; revenue: number }>();

  orders.forEach((order) => {
    getOrderLines(order).forEach((line) => {
      const current = totals.get(line.productId) ?? { quantity: 0, revenue: 0 };
      const product = productMap.get(line.productId);
      const unitPrice = line.unitPrice ?? product?.price ?? 0;
      totals.set(line.productId, { quantity: current.quantity + line.quantity, revenue: current.revenue + unitPrice * line.quantity });
    });
  });

  return Array.from(totals.entries())
    .map(([productId, total]) => {
      const product = productMap.get(productId);
      return { id: productId, name: product?.name ?? "Produit", visual: product?.visual ?? "dish", quantity: total.quantity, revenue: roundMoney(total.revenue) };
    })
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);
}

function getActiveTables(orders: Order[], tables: TableInfo[]): ActiveTable[] {
  const tableMap = new Map(tables.map((table) => [Number(table.id.replace("table-", "")), table]));
  const counts = new Map<number, number>();
  orders.forEach((order) => counts.set(order.table, (counts.get(order.table) ?? 0) + 1));

  return Array.from(counts.entries())
    .map(([table, orderCount]) => {
      const tableInfo = tableMap.get(table);
      return { table, name: tableInfo?.name ?? `Table ${table}`, area: tableInfo?.area ?? "Salle", orders: orderCount, scans: tableInfo?.scans ?? 0 };
    })
    .sort((a, b) => b.orders + b.scans / 100 - (a.orders + a.scans / 100))
    .slice(0, 2);
}

function getInsights({ chart, topProducts, activeTables, filteredOrders }: Pick<StatisticsModel, "chart" | "topProducts" | "activeTables" | "filteredOrders">) {
  if (filteredOrders.length === 0) return ["Aucune donnée pour cette période", "Les statistiques apparaîtront après les premières commandes"];

  const peak = chart.reduce((best, point) => (point.value > best.value ? point : best), chart[0] ?? { label: "", value: 0 });
  const delays = filteredOrders.filter((order) => order.status === "payment_pending" || order.status === "preparing").length;
  const insights: string[] = [];

  if (peak.value > 0) insights.push(`Pic à ${peak.label}`);
  if (topProducts[0]) insights.push(`${topProducts[0].name} est le produit le plus commandé`);
  if (activeTables[0]) insights.push(`${activeTables[0].name} génère le plus de scans`);
  insights.push(delays > 0 ? `${delays} retards à surveiller` : "Aucun retard à signaler");

  return insights.slice(0, 4);
}

function getOrderLines(order: Order): OrderLine[] {
  if (order.lines && order.lines.length > 0) return order.lines;

  const fallbackProductIds = ["p1", "p2", "p3"];
  return Array.from({ length: Math.max(order.items, 1) }, (_, index) => ({
    productId: fallbackProductIds[(Number(order.id) + index) % fallbackProductIds.length],
    quantity: 1,
  }));
}

function isInService(order: Order, service: StatisticsOrderService) {
  if (order.service) return order.service === service;
  const hour = getOrderHour(order);
  return service === "midi" ? hour >= LUNCH_START && hour <= LUNCH_END : hour >= DINNER_START && hour <= DINNER_END;
}

function getOrderHour(order: Order) {
  if (order.serviceTime) return Number.parseInt(order.serviceTime.slice(0, 2), 10);
  return order.service === "soir" ? 20 : 12;
}

function daysBetween(date: string, referenceDate: string) {
  return Math.round((parseDate(referenceDate).getTime() - parseDate(date).getTime()) / DAY_MS);
}

function getPreviousDates(daysBack: number) {
  const reference = parseDate(REFERENCE_DATE);
  return Array.from({ length: daysBack + 1 }, (_, index) => {
    const date = new Date(reference.getTime() - index * DAY_MS);
    return date.toISOString().slice(0, 10);
  });
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
