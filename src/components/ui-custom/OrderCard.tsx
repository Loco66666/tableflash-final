import { Check, ChefHat, ClipboardList, Package, Table2, X } from "lucide-react";
import type { Order } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

export function OrderCard({ order }: { order: Order }) {
  const isPending = order.status === "to_accept";
  const badgeTone = order.status === "to_accept" ? "orange" : order.status === "paid" ? "green" : "blue";

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex gap-4">
        <span className={(isPending ? "bg-orange-50 text-orange-600" : order.status === "preparing" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-800") + " grid size-16 shrink-0 place-items-center rounded-full"}>
          {order.status === "preparing" ? <ChefHat className="size-8" /> : <ClipboardList className="size-8" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-2xl font-black tracking-[-0.03em]">Commande #{order.id}</h2>
            <StatusBadge label={order.paymentLabel} tone={badgeTone} />
          </div>
          <div className="mt-4 grid gap-2 text-lg text-slate-700">
            <p className="flex items-center gap-3"><Table2 className="size-6 text-emerald-800" /> Table {order.table}</p>
            <p className="flex items-center gap-3"><Package className="size-6 text-emerald-800" /> {order.items} {order.items > 1 ? "articles" : "article"}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 text-right text-4xl font-black tracking-[-0.05em]">{formatEuro(order.total)}</div>
      <div className="mt-5 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
        <button className="min-h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 px-4 text-lg font-bold text-white shadow-green">
          <span className="inline-flex items-center gap-3">{isPending ? <Check className="size-7" /> : <ChefHat className="size-6" />} {order.actionLabel}</span>
        </button>
        {isPending ? <button className="min-h-14 rounded-2xl border border-red-500 px-4 text-lg font-bold text-red-600"><span className="inline-flex items-center gap-3"><X className="size-7" /> Refuser</span></button> : null}
      </div>
    </article>
  );
}
