"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw } from "lucide-react";
import { OrderCard } from "@/components/ui-custom/OrderCard";
import { updateDashboardOrderStatus } from "@/app/dashboard/orders/actions";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  applyOrderStatusTransition,
  normalizeOrders,
  orderFilters,
  orderMatchesFilter,
  type OrderFilter,
} from "@/lib/orders";

export function OrdersBoard({
  initialFilter,
  initialOrders,
}: {
  initialFilter: OrderFilter;
  initialOrders: Order[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>(initialFilter);
  const [orders, setOrders] = useState<Order[]>(() => normalizeOrders(initialOrders));
  const [actionError, setActionError] = useState("");
  const [exportPeriod, setExportPeriod] = useState("today");
  const [lastRefreshLabel, setLastRefreshLabel] = useState("");

  const visibleOrders = useMemo(
    () => orders.filter((order) => orderMatchesFilter(order, activeFilter)),
    [orders, activeFilter],
  );

  const emptyLabel = orderFilters.find((filter) => filter.value === activeFilter)?.emptyLabel ?? "Aucune commande";
  const exportHref = `/dashboard/orders/export?period=${exportPeriod}`;

  useEffect(() => {
    const refreshOrders = () => {
      startTransition(() => {
        router.refresh();
        setLastRefreshLabel(
          new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      });
    };

    const timer = window.setInterval(refreshOrders, 10_000);
    window.addEventListener("focus", refreshOrders);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshOrders);
    };
  }, [router, startTransition]);

  useEffect(() => {
    const timer = window.setTimeout(() => setOrders(normalizeOrders(initialOrders)), 0);

    return () => window.clearTimeout(timer);
  }, [initialOrders]);

  function selectFilter(nextFilter: OrderFilter) {
    setActiveFilter(nextFilter);
    router.replace(`/dashboard/orders?filter=${nextFilter}`, { scroll: false });
  }

  function refreshNow() {
    startTransition(() => {
      router.refresh();
      setLastRefreshLabel(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    });
  }

  function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
    const previousOrders = orders;
    const shouldMoveToClosedFilter = nextStatus === "served" || nextStatus === "refused";

    setOrders((currentOrders) =>
      normalizeOrders(currentOrders).map((order) =>
        order.id === orderId ? applyOrderStatusTransition(order, nextStatus) : order,
      ),
    );

    if (shouldMoveToClosedFilter) {
      setActiveFilter("terminees");
    }

    startTransition(async () => {
      try {
        setActionError("");

        await updateDashboardOrderStatus({
          orderId,
          nextStatus,
        });

        if (shouldMoveToClosedFilter) {
          router.replace("/dashboard/orders?filter=terminees", { scroll: false });
        }

        router.refresh();
      } catch (error) {
        setOrders(previousOrders);
        setActionError(error instanceof Error ? error.message : "Mise à jour impossible.");
      }
    });
  }

  function refuseOrder(orderId: string) {
    updateOrderStatus(orderId, "refused");
  }

  return (
    <>
      {actionError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card min-[430px]:grid-cols-[1fr_auto] min-[430px]:items-center">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select
            value={exportPeriod}
            onChange={(event) => setExportPeriod(event.target.value)}
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            aria-label="Période d'export"
          >
            <option value="today">Aujourd&apos;hui</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>

          <a
            href={exportHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white shadow-green transition active:scale-[0.99]"
          >
            <Download className="size-5" />
            CSV
          </a>
        </div>

        <div className="flex items-center justify-between gap-3 min-[430px]:justify-end">
          {lastRefreshLabel ? (
            <span className="text-xs font-semibold text-slate-500">Mis à jour {lastRefreshLabel}</span>
          ) : (
            <span className="text-xs font-semibold text-slate-500">Actualisation active</span>
          )}

          <button
            type="button"
            onClick={refreshNow}
            disabled={isPending}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-700 transition active:scale-[0.99] disabled:opacity-60"
            aria-label="Actualiser les commandes"
            title="Actualiser"
          >
            <RefreshCw className={`size-5 ${isPending ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mb-6 -mx-1 overflow-x-auto px-1 pb-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full gap-2 rounded-[1.2rem] border border-slate-200 bg-white p-1.5 shadow-card min-[430px]:grid min-[430px]:grid-cols-4">
          {orderFilters.map((filter) => {
            const active = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => selectFilter(filter.value)}
                disabled={isPending}
                className={cn(
                  "min-h-12 min-w-36 shrink-0 rounded-2xl px-3 text-sm font-semibold whitespace-nowrap transition min-[390px]:text-base min-[430px]:min-w-0 disabled:opacity-60",
                  active ? "bg-emerald-700 text-white shadow-green" : "text-slate-700 active:bg-emerald-50",
                )}
                aria-pressed={active}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {visibleOrders.length > 0 ? (
        <div className="grid gap-5">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              statusChangeAction={updateOrderStatus}
              refuseAction={refuseOrder}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-card">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-emerald-900">{emptyLabel}</h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">
            Les prochaines commandes apparaîtront ici pendant le service.
          </p>
        </section>
      )}
    </>
  );
}
