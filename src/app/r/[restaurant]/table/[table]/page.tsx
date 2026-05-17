import { Heart, Leaf, Utensils, Cake, CupSoda } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerCartBar } from "@/components/ui-custom/CustomerCartBar";
import { CustomerProductCard } from "@/components/ui-custom/CustomerProductCard";
import { CustomerTrackingPreview } from "@/components/ui-custom/CustomerTrackingPreview";
import { products } from "@/lib/data/seed";

const chips = [
  { label: "Entrées", icon: Leaf },
  { label: "Plats", icon: Utensils },
  { label: "Desserts", icon: Cake },
  { label: "Boissons", icon: CupSoda },
];

export default function CustomerMenuPage() {
  return (
    <AppShell showNav={false}>
      <PageHeader title="Le Bistrot des Halles" subtitle="Table 1" customer />
      <div className="mb-6 flex min-h-16 items-center gap-4 rounded-[1.2rem] bg-gradient-to-br from-emerald-50 to-white px-5 text-lg text-slate-700"><Heart className="size-8 text-emerald-800" /> Commandez à votre rythme</div>
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{chips.map((chip, index) => { const Icon = chip.icon; return <button key={chip.label} className={(index === 1 ? "bg-emerald-700 text-white shadow-green" : "border border-slate-200 bg-white text-slate-700 shadow-card") + " flex min-h-14 shrink-0 items-center gap-2 rounded-full px-5 text-lg font-semibold"}><Icon className="size-5" />{chip.label}</button>; })}</div>
      <div className="grid gap-4">{products.filter((product) => product.available).map((product) => <CustomerProductCard key={product.id} product={product} />)}</div>
      <CustomerCartBar />
      <section className="mt-8"><h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Suivi de commande</h2><CustomerTrackingPreview /></section>
    </AppShell>
  );
}
