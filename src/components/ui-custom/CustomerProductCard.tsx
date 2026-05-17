import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { ProductVisual } from "@/components/ui-custom/ProductCard";

export function CustomerProductCard({ product }: { product: Product }) {
  return (
    <article className="grid grid-cols-[7.8rem_1fr] gap-4 rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-card">
      <ProductVisual visual={product.visual} />
      <div className="min-w-0 py-2">
        <h2 className="text-2xl font-black tracking-[-0.04em]">{product.name}</h2>
        <p className="mt-2 line-clamp-3 text-base leading-relaxed text-slate-600">{product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <strong className="text-2xl font-black text-emerald-800">{formatEuro(product.price)}</strong>
          <button className="min-h-12 rounded-2xl border border-emerald-800 px-5 font-bold text-emerald-800"><span className="inline-flex items-center gap-2"><Plus className="size-5" />Ajouter</span></button>
        </div>
      </div>
    </article>
  );
}
