"use client";

import { type ComponentType, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Euro, Flame, ShoppingBasket, ShoppingCart, Star, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { useMenuStore } from "@/lib/local-store/menuStore";
import { useOrdersStore } from "@/lib/local-store/ordersStore";
import { useReviewsStore } from "@/lib/local-store/reviewsStore";
import { useTablesStore } from "@/lib/local-store/tablesStore";
import { getStatisticsModel, type ChartPoint, type StatisticsFilter } from "@/lib/statistics";
import { cn } from "@/lib/utils";

const periodFilters: { label: string; value: StatisticsFilter }[] = [
  { label: "Aujourd’hui", value: "today" },
  { label: "7 jours", value: "seven-days" },
  { label: "30 jours", value: "thirty-days" },
];

const serviceFilters: { label: string; value: StatisticsFilter }[] = [
  { label: "Midi", value: "lunch" },
  { label: "Soir", value: "dinner" },
];

const productVisualStyles: Record<string, string> = {
  salad: "from-emerald-100 via-lime-50 to-amber-100 text-emerald-800",
  burger: "from-amber-100 via-orange-50 to-rose-100 text-orange-800",
  dessert: "from-stone-100 via-amber-50 to-orange-100 text-stone-700",
  dish: "from-emerald-100 via-white to-slate-100 text-emerald-800",
};

const productVisualLabels: Record<string, string> = {
  salad: "🥗",
  burger: "🍔",
  dessert: "🍰",
  dish: "🍽️",
};

export default function StatisticsPage() {
  const [activeFilter, setActiveFilter] = useState<StatisticsFilter>("today");
  const { value: orders } = useOrdersStore();
  const { value: reviews } = useReviewsStore();
  const { value: tables } = useTablesStore();
  const { value: menu } = useMenuStore();

  const statistics = useMemo(
    () => getStatisticsModel({ filter: activeFilter, orders, reviews, products: menu.products, tables }),
    [activeFilter, menu.products, orders, reviews, tables],
  );

  const periodLabel = getFilterLabel(activeFilter);
  const peakLabel = getPeakLabel(statistics.chart);
  const hasActivity = statistics.orderCount > 0;

  return (
    <AppShell>
      <PageHeader title="Statistiques" subtitle="Vue d’ensemble de votre activité" />

      <div className="mb-5 space-y-3">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
          {periodFilters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                aria-pressed={active}
                className={cn(
                  "min-h-10 rounded-xl px-2 text-sm font-semibold transition",
                  active ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 active:bg-white/80",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {serviceFilters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold transition",
                  active
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-green"
                    : "border-slate-200 bg-white text-slate-700 active:bg-slate-50",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <SectionCard className="mb-5 border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">{periodLabel}</p>
        <p className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950">{statistics.orderCount} commandes · {formatEuroWhole(statistics.salesTotal)} estimés</p>
        <p className="mt-1 text-sm font-medium text-slate-600">{peakLabel}</p>
      </SectionCard>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <KpiCard icon={ShoppingBasket} value={statistics.orderCount.toLocaleString("fr-FR")} label="Commandes" helper={hasActivity ? `${statistics.filteredOrders.length} suivies` : "Aucune activité"} />
        <KpiCard icon={Euro} value={formatEuroWhole(statistics.salesTotal)} label="Ventes estimées" helper={hasActivity ? "Statuts encaissés inclus" : "Aucune vente"} />
        <KpiCard icon={ShoppingCart} value={formatEuro(statistics.averageBasket)} label="Panier moyen" helper={hasActivity ? "Par commande confirmée" : "En attente de données"} />
        <KpiCard icon={Star} value={`${formatRating(statistics.averageRating)}/5`} label="Note clients" helper={statistics.averageRating > 0 ? "Avis clients" : "Pas encore d’avis"} />
      </div>

      <SectionCard className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-[-0.02em]">Activité</h2>
            <p className="text-sm text-slate-600">Commandes par créneau</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <BarChart3 className="size-3.5" /> {statistics.filteredOrders.length} commandes
          </span>
        </div>
        <ActivityChart points={statistics.chart} hasActivity={hasActivity} />
      </SectionCard>

      <SectionCard className="mb-5">
        <h2 className="mb-3 text-xl font-black tracking-[-0.02em]">Top produits</h2>
        {statistics.topProducts.length > 0 ? (
          <div className="space-y-2">
            {statistics.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <span className={cn("grid size-11 place-items-center rounded-xl bg-gradient-to-br text-xl", productVisualStyles[product.visual] ?? productVisualStyles.dish)}>
                  {productVisualLabels[product.visual] ?? productVisualLabels.dish}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">{product.name}</p>
                  <p className="text-xs text-slate-600">{product.quantity} commandes · {formatEuroWhole(product.revenue)}</p>
                </div>
                <span className={cn("inline-flex min-w-7 justify-center rounded-full px-2 py-1 text-xs font-black", index === 0 ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800")}>#{index + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Aucune activité pour cette période" subtitle="Les commandes apparaîtront ici pendant le service." />
        )}
      </SectionCard>

      <SectionCard className="mb-5">
        <h2 className="mb-3 text-xl font-black tracking-[-0.02em]">Tables actives</h2>
        {statistics.activeTables.length > 0 ? (
          <div className="grid gap-3 min-[560px]:grid-cols-2">
            {statistics.activeTables.map((table) => (
              <div key={table.table} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-emerald-950">{table.name}</p>
                    <p className="text-xs font-medium text-emerald-700">{table.area}</p>
                  </div>
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700">
                    <Flame className="size-3.5" />
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-700">{table.orders} commande{table.orders > 1 ? "s" : ""} · {table.scans} scans</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Aucune activité pour cette période" subtitle="Les commandes apparaîtront ici pendant le service." />
        )}
      </SectionCard>

      <SectionCard>
        <h2 className="mb-3 text-xl font-black tracking-[-0.02em]">À retenir</h2>
        {statistics.orderCount === 0 ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Aucune donnée pour cette période</p>
            <p className="text-sm text-slate-600">Les statistiques apparaîtront après les premières commandes</p>
          </div>
        ) : (
          <div className="grid gap-2 text-sm">
            {statistics.insights.map((insight, index) => {
              const Icon = getInsightIcon(index);
              return (
                <p key={`${insight}-${index}`} className="flex items-center gap-2 text-slate-900">
                  <Icon className={cn("size-7 shrink-0 rounded-full p-1.5", getInsightTone(index))} />
                  <span>{insight}</span>
                </p>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}

function KpiCard({ icon: Icon, value, label, helper }: { icon: ComponentType<{ className?: string }>; value: string; label: string; helper: string }) {
  return (
    <SectionCard className="rounded-2xl p-3 shadow-sm">
      <div className="mb-2 inline-flex size-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="size-4" />
      </div>
      <p className="text-lg font-black tracking-[-0.02em] text-slate-950">{value}</p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-[11px] text-slate-500">{helper}</p>
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
  const chartHeight = 170;
  const chartWidth = 360;
  const left = 24;
  const right = 336;
  const top = 16;
  const bottom = 152;
  const yTicks = [maxValue, Math.ceil(maxValue * 0.66), Math.ceil(maxValue * 0.33), 0];
  const path = points
    .map((point, index) => {
      const x = points.length <= 1 ? (left + right) / 2 : left + (index / (points.length - 1)) * (right - left);
      const y = bottom - (point.value / maxValue) * (bottom - top);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const areaPath = `${path} L ${right} ${bottom} L ${left} ${bottom} Z`;

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-50/70 p-3">
      <div className="relative h-[236px]">
        <div className="absolute inset-x-0 top-2 grid h-[150px] grid-rows-4 pl-8 text-[11px] text-slate-500">
          {yTicks.map((tick, index) => (
            <div key={`${tick}-${index}`} className="relative border-t border-emerald-100/70 first:border-emerald-200">
              <span className="absolute -left-7 -top-2.5 w-6 text-right tabular-nums">{tick}</span>
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="absolute inset-x-0 top-0 h-[182px] w-full" role="img" aria-label="Courbe d’activité">
          <path d={areaPath} fill="#059669" opacity="0.12" />
          <path d={path} fill="none" stroke="#059669" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          {points.map((point, index) => {
            const x = points.length <= 1 ? (left + right) / 2 : left + (index / (points.length - 1)) * (right - left);
            const y = bottom - (point.value / maxValue) * (bottom - top);
            return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="3.5" fill="#fff" stroke="#059669" strokeWidth="2" />;
          })}
        </svg>
        <div className="absolute inset-x-6 bottom-1 grid text-[11px] font-medium text-slate-600" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
          {points.map((point) => (
            <span key={point.label} className="text-center">
              {point.label}
            </span>
          ))}
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
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), { label: "", value: 0 });
  return peak.value > 0 ? `Pic d’activité à ${peak.label}` : "Activité en cours de démarrage";
}

function formatEuro(value: number) {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function formatEuroWhole(value: number) {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

function formatRating(value: number) {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function getInsightIcon(index: number) {
  return [TrendingUp, ShoppingBasket, Users, CheckCircle2, Clock3][index] ?? TrendingUp;
}

function getInsightTone(index: number) {
  return ["bg-emerald-50 text-emerald-700", "bg-lime-50 text-lime-700", "bg-blue-50 text-blue-700", "bg-emerald-50 text-emerald-700", "bg-orange-50 text-orange-600"][index] ?? "bg-emerald-50 text-emerald-700";
}
