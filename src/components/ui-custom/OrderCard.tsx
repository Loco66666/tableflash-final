import { Check, ChefHat, ClipboardList, Clock3, HandPlatter, Package, Table2, X } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import {
  getOrderStatusBadgeTone,
  getOrderStatusIconStyle,
  getOrderStatusLabel,
  getNextOrderStatus,
  getPrimaryOrderActionLabel,
} from "@/lib/orders";

type OrderCardProps = {
  order: Order;
  onStatusChange?: (orderId: string, nextStatus: OrderStatus) => void;
  onRefuse?: (orderId: string) => void;
};

function renderOrderIcon(status: OrderStatus) {
  switch (status) {
    case "new":
      return <ClipboardList className="size-8" />;
    case "accepted":
    case "payment_pending":
      return <Clock3 className="size-8" />;
    case "paid":
    case "served":
      return <Check className="size-8" />;
    case "preparing":
      return <ChefHat className="size-8" />;
    case "ready":
      return <HandPlatter className="size-8" />;
    case "refused":
      return <X className="size-8" />;
  }
}

export function OrderCard({ order, onStatusChange, onRefuse }: OrderCardProps) {
  const primaryActionLabel = getPrimaryOrderActionLabel(order);
  const isNew = order.status === "new";
  const isClosed = order.status === "served" || order.status === "refused";

  function handlePrimaryAction() {
    const nextStatus = getNextOrderStatus(order);

    if (nextStatus) {
      onStatusChange?.(order.id, nextStatus);
    }
  }

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex gap-4">
        <span className={`${getOrderStatusIconStyle(order.status)} grid size-16 shrink-0 place-items-center rounded-full`}>
          {renderOrderIcon(order.status)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
            <h2 className="text-2xl font-black tracking-[-0.03em]">Commande #{order.id}</h2>
            <StatusBadge label={getOrderStatusLabel(order.status)} tone={getOrderStatusBadgeTone(order.status)} />
          </div>
          <div className="mt-4 grid gap-2 text-lg text-slate-700">
            <p className="flex items-center gap-3"><Table2 className="size-6 text-emerald-800" /> {order.tableName ?? `Table ${order.table}`}</p>
            <p className="flex items-center gap-3"><Package className="size-6 text-emerald-800" /> {order.items} {order.items > 1 ? "articles" : "article"}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 text-right text-4xl font-black tracking-[-0.05em]">{formatEuro(order.total)}</div>
      {primaryActionLabel ? (
        <div className="mt-5 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="min-h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 px-4 text-lg font-bold text-white shadow-green transition active:scale-[0.99]"
          >
            <span className="inline-flex items-center gap-3">{order.status === "paid" || order.status === "preparing" ? <ChefHat className="size-6" /> : <Check className="size-7" />} {primaryActionLabel}</span>
          </button>
          {isNew ? (
            <button
              type="button"
              onClick={() => onRefuse?.(order.id)}
              className="min-h-14 rounded-2xl border border-red-500 px-4 text-lg font-bold text-red-600 transition active:scale-[0.99]"
            >
              <span className="inline-flex items-center gap-3"><X className="size-7" /> Refuser</span>
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-center text-base font-semibold text-slate-600">
          {isClosed ? getOrderStatusLabel(order.status) : "Action réalisée"}
        </p>
      )}
    </article>
  );
}
