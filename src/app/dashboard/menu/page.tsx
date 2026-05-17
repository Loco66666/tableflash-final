import { FolderPlus, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { categories, products } from "@/lib/data/seed";

export default function MenuPage() {
  return (
    <AppShell>
      <PageHeader title="Menu" subtitle="Gérez vos produits et catégories" />
      <div className="grid gap-4"><button className="min-h-20 rounded-[1.2rem] bg-gradient-to-br from-emerald-600 to-emerald-900 text-xl font-black text-white shadow-green"><span className="inline-flex items-center gap-4"><Plus className="size-9 rounded-full bg-white p-1 text-emerald-800" />Ajouter un produit</span></button><button className="min-h-16 rounded-[1.2rem] border border-slate-200 bg-white text-xl font-black text-emerald-800 shadow-card"><span className="inline-flex items-center gap-4"><FolderPlus className="size-8" />Ajouter une catégorie</span></button></div>
      <label className="my-6 flex min-h-16 items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-5 text-lg text-slate-500"><Search className="size-7" /><span>Rechercher un produit</span></label>
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{categories.map((category, index) => <button key={category.id} className={(index === 0 ? "bg-emerald-700 text-white shadow-green" : "border border-slate-200 bg-white text-slate-700 shadow-card") + " min-h-12 shrink-0 rounded-2xl px-5 text-lg font-semibold"}>{category.name}</button>)}</div>
      <div className="grid gap-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    </AppShell>
  );
}
