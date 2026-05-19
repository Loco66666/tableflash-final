"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderCard } from "@/components/ui-custom/OrderCard";
import { useOrdersStore } from "@/lib/local-store/ordersStore";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { applyOrderStatusTransition, normalizeOrders, orderFilters, orderMatchesFilter, type OrderFilter } from "@/lib/orders";

export function OrdersBoard({ initialFilter }: { initialFilter: OrderFilter }) {
  const router = useRouter();
  const { value: storedOrders, setValue } = useOrdersStore();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>(initialFilter);
  const orders = useMemo(() => normalizeOrders(storedOrders), [storedOrders]);
  const visibleOrders = orders.filter((order) => orderMatchesFilter(order, activeFilter));
  const emptyLabel = orderFilters.find((filter) => filter.value === activeFilter)?.emptyLabel ?? "Aucune commande";

  function selectFilter(nextFilter: OrderFilter) {
    setActiveFilter(nextFilter);
    router.replace(`/dashboard/orders?filter=${nextFilter}`, { scroll: false });
  }

  function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
    setValue((currentOrders) =>
      normalizeOrders(currentOrders).map((order) => (order.id === orderId ? applyOrderStatusTransition(order, nextStatus) : order)),
    );
  }

  function refuseOrder(orderId: string) {
    updateOrderStatus(orderId, "refused");
  }

  return (
    <>
      <div className="mb-6 -mx-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full gap-2 rounded-[1.2rem] border border-slate-200 bg-white p-1.5 shadow-card min-[430px]:grid min-[430px]:grid-cols-4">
        {orderFilters.map((filter) => {
          const active = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => selectFilter(filter.value)}
              className={cn(
                "min-h-12 min-w-[9rem] shrink-0 rounded-2xl px-3 text-sm font-semibold whitespace-nowrap transition min-[390px]:text-base min-[430px]:min-w-0",
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
            <OrderCard key={order.id} order={order} onStatusChange={updateOrderStatus} onRefuse={refuseOrder} />
          ))}
        </div>
      ) : (
        <section className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-card">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-emerald-900">{emptyLabel}</h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">Les prochaines commandes apparaîtront ici pendant le service.</p>
        </section>
      )}
    </>
  );
}
