import { ClipboardList, CreditCard, PackageOpen, Plus, Printer, QrCode, ShoppingBasket, Star, Table2, WalletCards, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionCard } from "@/components/ui-custom/ActionCard";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { StatCard } from "@/components/ui-custom/StatCard";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader title="Le Bistrot des Halles" subtitle="Service midi en cours" />
      <SectionCard className="mb-7 flex items-center gap-5 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
        <span className="grid size-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 text-white shadow-green"><Check className="size-14" /></span>
        <div><h2 className="text-3xl font-black text-emerald-800">Service ouvert</h2><p className="mt-4 flex items-center gap-3 text-lg text-slate-700"><QrCode className="size-6 text-emerald-800" /> Commandes QR actives</p><p className="mt-3 flex items-center gap-3 text-lg text-slate-700"><CreditCard className="size-6 text-emerald-800" /> Paiement sur place</p></div>
      </SectionCard>
      <section className="mb-7"><h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">À faire maintenant</h2><div className="grid gap-3"><ActionCard href="/dashboard/orders" icon={ShoppingBasket} count="2" title="commandes à accepter" tone="orange" /><ActionCard href="/dashboard/orders" icon={WalletCards} count="1" title="commande à encaisser" /><ActionCard href="/dashboard/reviews" icon={Star} count="1" title="avis à traiter" tone="yellow" /><ActionCard href="/dashboard/menu" icon={PackageOpen} count="1" title="produit en rupture" tone="red" /></div></section>
      <section className="mb-7"><h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Aujourd’hui</h2><div className="grid grid-cols-2 gap-3 min-[430px]:grid-cols-4"><StatCard icon={ShoppingBasket} value="18" label="commandes" /><StatCard icon={CreditCard} value="642 €" label="ventes estimées" /><StatCard icon={Star} value="4,8/5" label="avis clients" /><StatCard icon={Table2} value="6" label="tables actives" /></div></section>
      <section><h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Actions rapides</h2><div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-3"><ActionCard href="/dashboard/orders" icon={ClipboardList} title="Voir les commandes" /><ActionCard href="/dashboard/menu" icon={Plus} title="Ajouter un produit" /><ActionCard href="/dashboard/qr" icon={Printer} title="Imprimer les QR" /></div></section>
    </AppShell>
  );
}
