import { ShoppingBasket, Star, TrendingUp, Users, Clock, Euro, ShoppingCart } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { StatCard } from "@/components/ui-custom/StatCard";

export default function StatisticsPage() {
  const filters = ["Aujourd’hui", "7 jours", "30 jours", "Midi", "Soir"];
  return (
    <AppShell>
      <PageHeader title="Statistiques" subtitle="Vue d’ensemble de votre activité" />
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{filters.map((filter, index) => <button key={filter} className={(index === 0 ? "bg-emerald-700 text-white shadow-green" : "border border-slate-200 bg-white text-slate-700 shadow-card") + " min-h-12 shrink-0 rounded-2xl px-5 text-lg font-semibold"}>{filter}</button>)}</div>
      <SectionCard className="mb-5 grid grid-cols-2 gap-3 min-[430px]:grid-cols-4"><StatCard icon={ShoppingBasket} value="18" label="commandes" /><StatCard icon={Euro} value="642 €" label="ventes estimées" /><StatCard icon={ShoppingCart} value="35,70 €" label="panier moyen" /><StatCard icon={Star} value="4,8/5" label="note clients" /></SectionCard>
      <SectionCard className="mb-5"><h2 className="mb-3 text-2xl font-black">Activité</h2><div className="relative h-48 overflow-hidden rounded-xl bg-[linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:100%_20%]"><svg viewBox="0 0 360 160" className="h-full w-full" aria-label="Courbe activité"><path d="M12 130 C50 110 60 88 90 78 C128 62 135 22 170 25 C205 30 210 88 250 98 C286 108 306 102 345 135" fill="none" stroke="#007a3d" strokeWidth="5" strokeLinecap="round"/><path d="M12 130 C50 110 60 88 90 78 C128 62 135 22 170 25 C205 30 210 88 250 98 C286 108 306 102 345 135 L345 160 L12 160 Z" fill="#007a3d" opacity="0.10"/></svg></div></SectionCard>
      <SectionCard className="mb-5"><h2 className="mb-4 text-2xl font-black">Top produits</h2>{["Salade César", "Burger maison", "Tiramisu"].map((name, index) => <div key={name} className="flex min-h-14 items-center border-b border-slate-100 last:border-0"><span className="mr-4 grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-800">{index + 1}</span><div className="flex-1"><strong className="text-lg">{name}</strong><p className="text-slate-600">{[8,6,4][index]} commandes</p></div><span className={(index === 0 ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800") + " grid size-10 place-items-center rounded-full font-black"}>{index + 1}</span></div>)}</SectionCard>
      <SectionCard><h2 className="mb-4 text-2xl font-black">À retenir</h2><div className="grid gap-3 text-lg"><p className="flex items-center gap-3"><TrendingUp className="size-7 rounded-full bg-emerald-50 p-1 text-emerald-800" /> Pic à 12h</p><p className="flex items-center gap-3"><Star className="size-7 rounded-full bg-emerald-50 p-1 text-emerald-800" /> Salade César fonctionne bien</p><p className="flex items-center gap-3"><Users className="size-7 rounded-full bg-blue-50 p-1 text-blue-700" /> Table 1 très active</p><p className="flex items-center gap-3"><Clock className="size-7 rounded-full bg-orange-50 p-1 text-orange-600" /> 2 retards à surveiller</p></div></SectionCard>
    </AppShell>
  );
}
