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
  const hasPromoPrice = typeof product.promoPrice === "number" && product.promoPrice > 0;

  return (
    <article className="grid grid-cols-[7.4rem_1fr] gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-card max-[370px]:grid-cols-[6.6rem_1fr]">
      <ProductVisual visual={product.visual} imageUrl={product.imageUrl} alt={product.name} />

      <div className="min-w-0 py-1">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="min-w-0 text-[1.35rem] font-black leading-tight tracking-tight text-slate-950">{product.name}</h2>

          {Boolean(product.featured ?? product.promoted) ? (
            <span className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 text-sm font-black text-emerald-700">
              <Tag className="size-4" />
              Suggestion
            </span>
          ) : null}
        </div>

        {product.description ? (
          <p className="mt-2 line-clamp-3 text-base leading-relaxed text-slate-600">{product.description}</p>
        ) : null}

        {allergensLabel ? (
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-500">Allergènes : {allergensLabel}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {hasPromoPrice ? (
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-black text-rose-700">{formatEuro(product.promoPrice ?? product.price)}</strong>
              <span className="text-sm font-semibold text-slate-500 line-through">{formatEuro(product.price)}</span>
            </div>
          ) : (
            <strong className="text-2xl font-black text-emerald-800">{formatEuro(product.price)}</strong>
          )}

          <button
            type="button"
            onClick={() => onAdd(product)}
            className="min-h-12 rounded-2xl border border-emerald-800 px-5 text-base font-black text-emerald-800 transition active:scale-[0.98]"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="size-5" />
              Ajouter
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}