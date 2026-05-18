import { Plus, Tag } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { ProductVisual } from "@/components/ui-custom/ProductCard";

type CustomerProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

function formatAllergens(allergens: Product["allergens"]) {
  if (!allergens) return "";
  return Array.isArray(allergens) ? allergens.filter(Boolean).join(", ") : allergens;
}

export function CustomerProductCard({ product, onAdd }: CustomerProductCardProps) {
  const allergensLabel = formatAllergens(product.allergens);

  return (
    <article className="grid grid-cols-[7.4rem_1fr] gap-4 rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-card max-[370px]:grid-cols-[6.6rem_1fr]">
      <ProductVisual visual={product.visual} imageUrl={product.imageUrl} alt={product.name} />
      <div className="min-w-0 py-1">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="min-w-0 text-[1.35rem] font-black leading-tight tracking-[-0.04em] text-slate-950">{product.name}</h2>
          {product.promoted ? (
            <span className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 text-sm font-black text-amber-700">
              <Tag className="size-4" /> Promo
            </span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-3 text-base leading-relaxed text-slate-600">{product.description}</p>
        {allergensLabel ? <p className="mt-2 text-sm font-semibold leading-snug text-slate-500">Allergènes : {allergensLabel}</p> : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <strong className="text-2xl font-black text-emerald-800">{formatEuro(product.price)}</strong>
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="min-h-12 rounded-2xl border border-emerald-800 px-5 text-base font-black text-emerald-800 transition active:scale-[0.98]"
          >
            <span className="inline-flex items-center gap-2"><Plus className="size-5" />Ajouter</span>
          </button>
        </div>
      </div>
    </article>
  );
}
