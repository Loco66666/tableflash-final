"use client";

import { useMemo, useState } from "react";
import { BarChart3, Clock, Euro, ShoppingBasket, ShoppingCart, Star, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { useMenuStore } from "@/lib/local-store/menuStore";
import { useOrdersStore } from "@/lib/local-store/ordersStore";
import { useReviewsStore } from "@/lib/local-store/reviewsStore";
import { useTablesStore } from "@/lib/local-store/tablesStore";
import { getStatisticsModel, type ChartPoint, type StatisticsFilter } from "@/lib/statistics";
import { cn } from "@/lib/utils";

const filters: { label: string; value: StatisticsFilter }[] = [
  { label: "Aujourd’hui", value: "today" },
  { label: "7 jours", value: "seven-days" },
  { label: "30 jours", value: "thirty-days" },
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

  return (
    <AppShell>
      <PageHeader title="Statistiques" subtitle="Vue d’ensemble de votre activité" />

      <div className="mb-6 flex flex-wrap gap-3">
        {filters.map((filter) => {
          const active = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              aria-pressed={active}
              className={cn(
                "min-h-12 rounded-2xl px-5 text-base font-semibold transition min-[390px]:text-lg",
                active ? "bg-emerald-700 text-white shadow-green" : "border border-slate-200 bg-white text-slate-700 shadow-card active:bg-emerald-50",
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <SectionCard className="mb-5 grid grid-cols-2 gap-3 min-[430px]:grid-cols-4 min-[430px]:gap-0 min-[430px]:divide-x min-[430px]:divide-slate-200/90">
        <StatCard icon={ShoppingBasket} value={statistics.orderCount.toLocaleString("fr-FR")} label="commandes" />
        <StatCard icon={Euro} value={formatEuroWhole(statistics.salesTotal)} label="ventes estimées" />
        <StatCard icon={ShoppingCart} value={formatEuro(statistics.averageBasket)} label="panier moyen" />
        <StatCard icon={Star} value={`${formatRating(statistics.averageRating)}/5`} label="note clients" />
      </SectionCard>

      <SectionCard className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black tracking-[-0.03em]">Activité</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
            <BarChart3 className="size-4" /> {statistics.filteredOrders.length} commandes
          </span>
        </div>
        <ActivityChart points={statistics.chart} />
      </SectionCard>

      <SectionCard className="mb-5">
        <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Top produits</h2>
        {statistics.topProducts.length > 0 ? (
          <div className="grid gap-1">
            {statistics.topProducts.map((product, index) => (
              <div key={product.id} className="flex min-h-16 items-center gap-4 border-b border-slate-100 py-2 last:border-0">
                <span
                  className={cn(
                    "grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]",
                    productVisualStyles[product.visual] ?? productVisualStyles.dish,
                  )}
                  aria-hidden="true"
                >
                  {productVisualLabels[product.visual] ?? productVisualLabels.dish}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-xl font-black tracking-[-0.03em] text-slate-950">{product.name}</strong>
                  <p className="text-base text-slate-600">{product.quantity.toLocaleString("fr-FR")} commandes</p>
                </div>
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-full text-lg font-black", index === 0 ? "bg-emerald-700 text-white shadow-green" : "bg-emerald-50 text-emerald-800")}>{index + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-emerald-50/70 p-4 text-base font-semibold text-emerald-900">Aucun produit vendu sur cette période</p>
        )}
      </SectionCard>

      {statistics.activeTables.length > 0 ? (
        <SectionCard className="mb-5">
          <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Tables actives</h2>
          <div className="grid gap-3 min-[560px]:grid-cols-2">
            {statistics.activeTables.map((table) => (
              <div key={table.table} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <strong className="text-lg font-black text-emerald-950">{table.name}</strong>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  {table.orders.toLocaleString("fr-FR")} commandes · {table.scans.toLocaleString("fr-FR")} scans
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard>
        <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">À retenir</h2>
        <div className="grid gap-3 text-lg">
          {statistics.insights.map((insight, index) => {
            const Icon = getInsightIcon(index);
            return (
              <p key={`${insight}-${index}`} className="flex items-center gap-3 leading-snug text-slate-900">
                <Icon className={cn("size-8 shrink-0 rounded-full p-1.5", getInsightTone(index))} />
                <span>{insight}</span>
              </p>
            );
          })}
        </div>
      </SectionCard>
    </AppShell>
  );
}

function ActivityChart({ points }: { points: ChartPoint[] }) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const path = getChartPath(points, maxValue);
  const areaPath = `${path} L 340 150 L 20 150 Z`;
  const yTicks = [maxValue, Math.ceil(maxValue * 0.66), Math.ceil(maxValue * 0.33), 0];

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <div className="relative h-56 w-full">
        <div className="absolute inset-x-0 left-9 right-2 top-2 grid h-[160px] grid-rows-4 text-sm text-slate-500">
          {yTicks.map((tick, index) => (
            <div key={`${tick}-${index}`} className="flex items-start gap-3 border-t border-slate-200 first:border-t-slate-300">
              <span className="-ml-9 w-7 -translate-y-2 text-right tabular-nums">{tick}</span>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 360 170" className="absolute inset-x-0 top-0 h-[180px] w-full" aria-label="Courbe d’activité" role="img">
          <path d={areaPath} fill="#007a3d" opacity="0.10" />
          <path d={path} fill="none" stroke="#007a3d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
          {points.map((point, index) => {
            const { x, y } = getChartPoint(index, points.length, point.value, maxValue);
            return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="5.5" fill="white" stroke="#007a3d" strokeWidth="4" />;
          })}
        </svg>
        <div className="absolute inset-x-9 bottom-0 grid" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
          {points.map((point) => (
            <span key={point.label} className="text-center text-sm font-medium text-slate-600 min-[390px]:text-base">
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function getChartPath(points: ChartPoint[], maxValue: number) {
  return points
    .map((point, index) => {
      const { x, y } = getChartPoint(index, points.length, point.value, maxValue);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function getChartPoint(index: number, total: number, value: number, maxValue: number) {
  const left = 20;
  const right = 340;
  const top = 15;
  const bottom = 150;
  const x = total <= 1 ? (left + right) / 2 : left + (index / (total - 1)) * (right - left);
  const y = bottom - (value / maxValue) * (bottom - top);
  return { x, y };
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
  return [TrendingUp, Star, Users, Clock][index] ?? TrendingUp;
}

function getInsightTone(index: number) {
  return ["bg-emerald-50 text-emerald-800", "bg-emerald-50 text-emerald-800", "bg-blue-50 text-blue-700", "bg-orange-50 text-orange-600"][index] ?? "bg-emerald-50 text-emerald-800";
}
