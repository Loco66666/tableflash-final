import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderCard } from "@/components/ui-custom/OrderCard";
import { orders } from "@/lib/data/seed";

export default function OrdersPage() {
  return (
    <AppShell>
      <PageHeader title="Commandes" subtitle="Service en cours" />
      <div className="mb-6 grid grid-cols-4 rounded-[1.2rem] border border-slate-200 bg-white p-1 shadow-card">
        {["À traiter", "En préparation", "Prêtes", "Terminées"].map((label, index) => <button key={label} className={(index === 0 ? "bg-emerald-700 text-white shadow-green" : "text-slate-700") + " min-h-12 rounded-2xl px-2 text-sm font-semibold sm:text-base"}>{label}</button>)}
      </div>
      <div className="grid gap-5">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
    </AppShell>
  );
}
