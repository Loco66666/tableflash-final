import { Check, ChefHat, ClipboardList, Clock3, HandPlatter, Package, Table2, X } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import {
  getOrderTimestampLabel,
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
  const timestampLabel = getOrderTimestampLabel(order);

  function handlePrimaryAction() {
    const nextStatus = getNextOrderStatus(order);

    if (nextStatus) {
      onStatusChange?.(order.id, nextStatus);
    }
  }

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-card min-[390px]:p-5">
      <div className="flex gap-3 min-[390px]:gap-4">
        <span className={`${getOrderStatusIconStyle(order.status)} grid size-14 shrink-0 place-items-center rounded-full min-[390px]:size-16`}>
          {renderOrderIcon(order.status)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-[-0.03em] min-[390px]:text-2xl">Commande #{order.id}</h2>
              {timestampLabel ? <p className="mt-1 text-sm font-semibold text-slate-500">{timestampLabel}</p> : null}
            </div>
            <StatusBadge label={getOrderStatusLabel(order.status)} tone={getOrderStatusBadgeTone(order.status)} />
          </div>
          <div className="mt-3 grid gap-1.5 text-base text-slate-700 min-[390px]:text-lg">
            <p className="flex items-center gap-2.5"><Table2 className="size-5 text-emerald-800 min-[390px]:size-6" /> {order.tableName ?? `Table ${order.table}`}</p>
            <p className="flex items-center gap-2.5"><Package className="size-5 text-emerald-800 min-[390px]:size-6" /> {order.items} {order.items > 1 ? "articles" : "article"}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 text-right text-3xl font-black tracking-[-0.04em] min-[390px]:text-4xl">{formatEuro(order.total)}</div>
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
        <div className="mt-4 flex justify-end">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">{isClosed ? getOrderStatusLabel(order.status) : "Action réalisée"}</span>
        </div>
      )}
    </article>
  );
}
