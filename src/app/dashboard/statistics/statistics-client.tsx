"use client";

import { type ComponentType, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Euro,
  Flame,
  ShoppingBasket,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { cn } from "@/lib/utils";

type StatisticsFilter = "today" | "seven-days" | "thirty-days" | "lunch" | "dinner";

type StatisticsOrder = {
  id: string;
  tableId: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  createdAt: string | null;
};

type StatisticsOrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  createdAt: string | null;
};

type StatisticsTable = {
  id: string;
  name: string;
  slug: string;
  zone: string | null;
  isActive: boolean;
  scansCount: number;
};

type StatisticsReview = {
  id: string;
  rating: number;
  status: "pending" | "archived";
  createdAt: string | null;
};

export type StatisticsClientData = {
  restaurantName: string;
  orders: StatisticsOrder[];
  orderItems: StatisticsOrderItem[];
  tables: StatisticsTable[];
  reviews: StatisticsReview[];
};

type ChartPoint = {
  label: string;
  value: number;
};

type TopProduct = {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  visual: "salad" | "burger" | "dessert" | "dish";
};

type ActiveTableStat = {
  table: string;
  name: string;
  area: string;
  orders: number;
  scans: number;
};

type StatisticsModel = {
  filteredOrders: StatisticsOrder[];
  orderCount: number;
  salesTotal: number;
  averageBasket: number;
  averageRating: number;
  reviewsCount: number;
  chart: ChartPoint[];
  topProducts: TopProduct[];
  activeTables: ActiveTableStat[];
  insights: string[];
};

const periodFilters: { label: string; value: StatisticsFilter }[] = [
  { label: "Aujourd’hui", value: "today" },
  { label: "7 jours", value: "seven-days" },
  { label: "30 jours", value: "thirty-days" },
];

const serviceFilters: { label: string; value: StatisticsFilter }[] = [
  { label: "Midi", value: "lunch" },
  { label: "Soir", value: "dinner" },
];

const productVisualStyles: Record<TopProduct["visual"], string> = {
  salad: "from-emerald-100 via-lime-50 to-amber-100 text-emerald-800",
  burger: "from-amber-100 via-orange-50 to-rose-100 text-orange-800",
  dessert: "from-stone-100 via-amber-50 to-orange-100 text-stone-700",
  dish: "from-emerald-100 via-white to-slate-100 text-emerald-800",
};

const productVisualLabels: Record<TopProduct["visual"], string> = {
  salad: "🥗",
  burger: "🍔",
  dessert: "🍰",
  dish: "🍽️",
};

function getOrderDate(order: Pick<StatisticsOrder, "createdAt">) {
  if (!order.createdAt) return null;

  const parsedDate = new Date(order.createdAt);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isWithinLastDays(date: Date, days: number, now: Date) {
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  return date >= startDate && date <= now;
}

function isLunch(date: Date) {
  const hour = date.getHours();
  return hour >= 10 && hour < 16;
}

function isDinner(date: Date) {
  const hour = date.getHours();
  return hour >= 16 || hour < 3;
}

function orderMatchesFilter(order: StatisticsOrder, filter: StatisticsFilter, now: Date) {
  const orderDate = getOrderDate(order);

  if (!orderDate) return false;

  switch (filter) {
    case "today":
      return isSameDay(orderDate, now);
    case "seven-days":
      return isWithinLastDays(orderDate, 7, now);
    case "thirty-days":
      return isWithinLastDays(orderDate, 30, now);
    case "lunch":
      return isSameDay(orderDate, now) && isLunch(orderDate);
    case "dinner":
      return isSameDay(orderDate, now) && isDinner(orderDate);
  }
}

function isRevenueOrder(order: StatisticsOrder) {
  return order.status !== "rejected" && order.status !== "cancelled" && order.status !== "refused";
}

function getOrderHours(filter: StatisticsFilter) {
  if (filter === "lunch") return [10, 11, 12, 13, 14, 15];
  if (filter === "dinner") return [18, 19, 20, 21, 22, 23];

  return [10, 12, 14, 16, 18, 20, 22];
}

function getOrderHourBucket(hour: number, buckets: number[]) {
  return buckets.reduce((bestBucket, bucket) => {
    const bestDistance = Math.abs(hour - bestBucket);
    const nextDistance = Math.abs(hour - bucket);

    return nextDistance < bestDistance ? bucket : bestBucket;
  }, buckets[0] ?? hour);
}

function buildChart(orders: StatisticsOrder[], filter: StatisticsFilter) {
  const buckets = getOrderHours(filter);
  const valuesByHour = new Map(buckets.map((hour) => [hour, 0]));

  for (const order of orders) {
    const orderDate = getOrderDate(order);
    if (!orderDate) continue;

    const bucket = getOrderHourBucket(orderDate.getHours(), buckets);
    valuesByHour.set(bucket, (valuesByHour.get(bucket) ?? 0) + 1);
  }

  return buckets.map((hour) => ({
    label: `${hour}h`,
    value: valuesByHour.get(hour) ?? 0,
  }));
}

function getProductVisual(productName: string): TopProduct["visual"] {
  const name = productName
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (name.includes("burger") || name.includes("kebab") || name.includes("sandwich")) return "burger";
  if (name.includes("dessert") || name.includes("tarte") || name.includes("gateau") || name.includes("glace")) {
    return "dessert";
  }
  if (name.includes("salade") || name.includes("veggie") || name.includes("vege")) return "salad";

  return "dish";
}

function buildTopProducts(orderItems: StatisticsOrderItem[]) {
  const productsByName = new Map<string, TopProduct>();

  for (const item of orderItems) {
    const key = item.productId ?? item.productName;
    const currentProduct = productsByName.get(key) ?? {
      id: key,
      name: item.productName,
      quantity: 0,
      revenue: 0,
      visual: getProductVisual(item.productName),
    };

    currentProduct.quantity += item.quantity;
    currentProduct.revenue += item.total;
    productsByName.set(key, currentProduct);
  }

  return [...productsByName.values()]
    .sort((firstProduct, secondProduct) => {
      if (secondProduct.quantity !== firstProduct.quantity) {
        return secondProduct.quantity - firstProduct.quantity;
      }

      return secondProduct.revenue - firstProduct.revenue;
    })
    .slice(0, 5);
}

function buildActiveTables({
  filteredOrders,
  tables,
}: {
  filteredOrders: StatisticsOrder[];
  tables: StatisticsTable[];
}) {
  const ordersByTableId = new Map<string, number>();

  for (const order of filteredOrders) {
    ordersByTableId.set(order.tableId, (ordersByTableId.get(order.tableId) ?? 0) + 1);
  }

  return tables
    .map((table) => ({
      table: table.id,
      name: table.name,
      area: table.zone ?? "Salle",
      orders: ordersByTableId.get(table.id) ?? 0,
      scans: table.scansCount,
    }))
    .filter((table) => table.orders > 0 || table.scans > 0)
    .sort((firstTable, secondTable) => {
      if (secondTable.orders !== firstTable.orders) {
        return secondTable.orders - firstTable.orders;
      }

      return secondTable.scans - firstTable.scans;
    })
    .slice(0, 5);
}

function buildInsights(model: {
  orderCount: number;
  salesTotal: number;
  averageBasket: number;
  averageRating: number;
  reviewsCount: number;
  topProducts: TopProduct[];
  activeTables: ActiveTableStat[];
}) {
  const insights: string[] = [];

  if (model.orderCount > 0) {
    insights.push(`${model.orderCount} commande${model.orderCount > 1 ? "s" : ""} sur la période sélectionnée.`);
    insights.push(`Total commandes : ${formatEuroWhole(model.salesTotal)}.`);
  }

  if (model.averageBasket > 0) {
    insights.push(`Panier moyen : ${formatEuro(model.averageBasket)}.`);
  }

  const bestProduct = model.topProducts[0];
  if (bestProduct) {
    insights.push(`${bestProduct.name} est le produit le plus vendu.`);
  }

  const bestTable = model.activeTables[0];
  if (bestTable) {
    insights.push(`${bestTable.name} est la table la plus utilisée.`);
  }

  if (model.reviewsCount > 0) {
    insights.push(`Note moyenne client : ${formatRating(model.averageRating)}/5.`);
  }

  return insights.length > 0 ? insights : ["Les enseignements apparaîtront après les premières commandes."];
}

function getStatisticsModel({
  data,
  filter,
}: {
  data: StatisticsClientData;
  filter: StatisticsFilter;
}): StatisticsModel {
  const now = new Date();

  const filteredOrders = data.orders.filter((order) => orderMatchesFilter(order, filter, now));
  const revenueOrders = filteredOrders.filter(isRevenueOrder);
  const revenueOrderIds = new Set(revenueOrders.map((order) => order.id));

  const filteredOrderItems = data.orderItems.filter((item) => revenueOrderIds.has(item.orderId));
  const salesTotal = revenueOrders.reduce((total, order) => total + order.total, 0);
  const orderCount = filteredOrders.length;
  const averageBasket = revenueOrders.length > 0 ? salesTotal / revenueOrders.length : 0;

  const visibleReviews = data.reviews.filter((review) => review.status !== "archived");
  const averageRating =
    visibleReviews.length > 0
      ? visibleReviews.reduce((total, review) => total + review.rating, 0) / visibleReviews.length
      : 0;

  const topProducts = buildTopProducts(filteredOrderItems);
  const activeTables = buildActiveTables({
    filteredOrders,
    tables: data.tables,
  });

  const insightBase = {
    orderCount,
    salesTotal,
    averageBasket,
    averageRating,
    reviewsCount: visibleReviews.length,
    topProducts,
    activeTables,
  };

  return {
    filteredOrders,
    orderCount,
    salesTotal,
    averageBasket,
    averageRating,
    reviewsCount: visibleReviews.length,
    chart: buildChart(filteredOrders, filter),
    topProducts,
    activeTables,
    insights: buildInsights(insightBase),
  };
}

export default function StatisticsClient({ data }: { data: StatisticsClientData }) {
  const [activeFilter, setActiveFilter] = useState<StatisticsFilter>("today");

  const statistics = useMemo(
    () =>
      getStatisticsModel({
        data,
        filter: activeFilter,
      }),
    [activeFilter, data],
  );

  const periodLabel = getFilterLabel(activeFilter);
  const peakLabel = getPeakLabel(statistics.chart);
  const hasActivity = statistics.orderCount > 0;

  return (
    <AppShell>
      <PageHeader title={data.restaurantName} subtitle="Vue d’ensemble de votre activité" />

      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
          {periodFilters.map((filter) => {
            const active = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-xl px-2 py-2 text-xs font-semibold leading-tight transition",
                  active ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 active:bg-white/80",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="inline-flex rounded-full bg-slate-100 p-1">
          {serviceFilters.map((filter) => {
            const active = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active ? "bg-emerald-700 text-white shadow-green" : "text-slate-700",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <SectionCard className="mb-4 border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-emerald-50/30 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{periodLabel}</p>
        <p className="mt-1 text-lg font-black tracking-tight text-slate-950">
          {statistics.orderCount} commande{statistics.orderCount > 1 ? "s" : ""} · Total commandes :{" "}
          {formatEuroWhole(statistics.salesTotal)}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-600">{peakLabel}</p>
      </SectionCard>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <KpiCard
          icon={ShoppingBasket}
          value={statistics.orderCount.toLocaleString("fr-FR")}
          label="Commandes"
          helper={hasActivity ? "Sur la période sélectionnée" : "Aucune activité"}
        />

        <KpiCard
          icon={Euro}
          value={formatEuroWhole(statistics.salesTotal)}
          label="Total commandes"
          helper={hasActivity ? "Hors commandes refusées" : "Aucune commande"}
        />

        <KpiCard
          icon={ShoppingCart}
          value={formatEuro(statistics.averageBasket)}
          label="Panier moyen"
          helper={hasActivity ? "Par commande validée" : "En attente de données"}
        />

        <KpiCard
          icon={Star}
          value={`${formatRating(statistics.averageRating)}/5`}
          label="Note clients"
          helper={statistics.reviewsCount > 0 ? `${statistics.reviewsCount} avis reçu${statistics.reviewsCount > 1 ? "s" : ""}` : "Pas encore d’avis"}
        />
      </div>

      <SectionCard className="mb-4 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight">Activité du service</h2>
            <p className="text-xs text-slate-600">Commandes par heure</p>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
            <BarChart3 className="size-3.5" /> {statistics.filteredOrders.length} commandes
          </span>
        </div>

        <ActivityChart points={statistics.chart} hasActivity={hasActivity} />
      </SectionCard>

      <SectionCard className="mb-4 p-4">
        <h2 className="mb-3 text-lg font-black tracking-tight">Top produits</h2>

        {statistics.topProducts.length > 0 ? (
          <div className="space-y-2">
            {statistics.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <span className="inline-flex min-w-8 justify-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                  #{index + 1}
                </span>

                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-lg bg-linear-to-br text-base",
                    productVisualStyles[product.visual],
                  )}
                >
                  {productVisualLabels[product.visual]}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">{product.name}</p>
                  <p className="text-xs text-slate-600">
                    {product.quantity} vendu{product.quantity > 1 ? "s" : ""} · {formatEuroWhole(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Aucune activité pour cette période" subtitle="Les commandes apparaîtront ici pendant le service." />
        )}
      </SectionCard>

      <SectionCard className="mb-4 p-4">
        <h2 className="mb-3 text-lg font-black tracking-tight">Tables utilisées</h2>

        {statistics.activeTables.length > 0 ? (
          <div className="space-y-3">
            {statistics.activeTables.map((table) => (
              <div key={table.table} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-900">{table.name}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {table.area} · {table.orders} commande{table.orders > 1 ? "s" : ""} · {table.scans} scans
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    <Flame className="size-3" /> Utilisée
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Aucune table utilisée" subtitle="Les tables avec commandes apparaîtront ici." />
        )}
      </SectionCard>

      <SectionCard className="p-4">
        <h2 className="mb-3 text-lg font-black tracking-tight">À retenir</h2>

        {statistics.orderCount === 0 ? (
          <p className="text-sm text-slate-600">Les enseignements apparaîtront après les premières commandes.</p>
        ) : (
          <div className="space-y-2">
            {statistics.insights.slice(0, 4).map((insight, index) => {
              const Icon = getInsightIcon(index);

              return (
                <div key={`${insight}-${index}`} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                  <Icon className={cn("size-6 shrink-0 rounded-full p-1.5", getInsightTone(index))} />
                  <span className="text-sm text-slate-900">{insight}</span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}

function KpiCard({
  icon: Icon,
  value,
  label,
  helper,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
  label: string;
  helper: string;
}) {
  return (
    <SectionCard className="rounded-2xl border border-slate-100 p-3 shadow-sm">
      <div className="mb-1.5 inline-flex size-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="size-3.5" />
      </div>

      <p className="text-base font-black tracking-tight text-slate-950">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{helper}</p>
    </SectionCard>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

function ActivityChart({ points, hasActivity }: { points: ChartPoint[]; hasActivity: boolean }) {
  if (!hasActivity) {
    return <EmptyState title="Aucune activité pour cette période" subtitle="Les commandes apparaîtront ici pendant le service." />;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const yTicks = [maxValue, Math.ceil(maxValue * 0.66), Math.ceil(maxValue * 0.33), 0];

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-100/70 bg-emerald-50/30 px-2 pt-2">
      <div className="flex h-52 gap-2">
        <div className="grid w-8 grid-rows-4 text-xs text-slate-500">
          {yTicks.map((tick, index) => (
            <span key={`${tick}-${index}`} className="text-right tabular-nums">
              {tick}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0 grid grid-rows-4">
            {yTicks.map((tick, index) => (
              <div key={`${tick}-${index}-line`} className="border-t border-emerald-100/70" />
            ))}
          </div>

          <div className="absolute inset-x-0 top-0 h-40">
            <div className="grid h-full items-end" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
              {points.map((point, index) => {
                const height = Math.max((point.value / maxValue) * 100, point.value > 0 ? 8 : 2);

                return (
                  <div key={`${point.label}-${index}`} className="flex h-full items-end justify-center px-1">
                    <div className="w-full rounded-t-md bg-linear-to-t from-emerald-500 to-emerald-300/90" style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-2 grid text-xs font-medium text-slate-600"
            style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
          >
            {points.map((point, index) => (
              <span key={`${point.label}-${index}-x`} className="text-center">
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getFilterLabel(filter: StatisticsFilter) {
  return {
    today: "Aujourd’hui",
    "seven-days": "7 derniers jours",
    "thirty-days": "30 derniers jours",
    lunch: "Service du midi",
    dinner: "Service du soir",
  }[filter];
}

function getPeakLabel(points: ChartPoint[]) {
  const peak = points.reduce(
    (bestPoint, point) => (point.value > bestPoint.value ? point : bestPoint),
    { label: "", value: 0 },
  );

  return peak.value > 0 ? `Pic d’activité à ${peak.label}` : "Activité en cours de démarrage";
}

function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

function formatEuroWhole(value: number) {
  return `${value.toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  })} €`;
}

function formatRating(value: number) {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function getInsightIcon(index: number) {
  return [TrendingUp, ShoppingBasket, Users, CheckCircle2, Clock3][index] ?? TrendingUp;
}

function getInsightTone(index: number) {
  return (
    [
      "bg-emerald-50 text-emerald-700",
      "bg-lime-50 text-lime-700",
      "bg-blue-50 text-blue-700",
      "bg-emerald-50 text-emerald-700",
      "bg-orange-50 text-orange-600",
    ][index] ?? "bg-emerald-50 text-emerald-700"
  );
}