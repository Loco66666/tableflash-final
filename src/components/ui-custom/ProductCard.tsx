"use client";

import { Edit3, IceCreamBowl, Leaf, Tag, Utensils, Wine } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

type ProductCardProduct = Product & { categoryName?: string };

function getVisualStyle(categoryName?: string) {
  const name = (categoryName ?? "").toLocaleLowerCase("fr-FR");
  if (name.includes("entr")) return { tone: "from-emerald-100 via-lime-50 to-white", Icon: Leaf };
  if (name.includes("dess")) return { tone: "from-amber-50 via-rose-50 to-white", Icon: IceCreamBowl };
  if (name.includes("boiss")) return { tone: "from-sky-100 via-cyan-50 to-white", Icon: Wine };
  return { tone: "from-orange-100 via-amber-50 to-white", Icon: Utensils };
}

export function ProductVisual({ visual, imageUrl, alt, categoryName }: { visual: Product["visual"]; imageUrl?: string; alt?: string; categoryName?: string }) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(imageUrl) && !broken;
  const style = useMemo(() => getVisualStyle(categoryName ?? visual), [categoryName, visual]);

  if (showImage) {
    return (
      <div className="relative h-24 overflow-hidden rounded-xl bg-emerald-50 sm:h-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt ?? "Produit"} className="absolute inset-0 size-full object-cover" onError={() => setBroken(true)} />
      </div>
    );
  }

  const Icon = style.Icon;
  return (
    <div className={`relative grid h-24 place-items-center overflow-hidden rounded-xl bg-gradient-to-br ${style.tone} sm:h-28`} aria-hidden="true">
      <span className="rounded-full bg-white/85 p-2.5 text-slate-700 shadow-card"><Icon className="size-6" /></span>
    </div>
  );
}

export function ProductCard({ product, onEdit }: { product: ProductCardProduct; onEdit?: (product: Product) => void }) {
  const featured = Boolean(product.featured ?? product.promoted);
  const promoPrice = typeof product.promoPrice === "number" && product.promoPrice > 0 ? product.promoPrice : null;
  return (
    <article className="grid grid-cols-[6rem_1fr] gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card sm:grid-cols-[7rem_1fr_auto] sm:gap-4 sm:p-4">
      <ProductVisual visual={product.visual} imageUrl={product.imageUrl} alt={product.name} categoryName={product.categoryName} />
      <div className="min-w-0">
        <h2 className="text-lg font-black leading-tight tracking-[-0.02em] text-slate-950 [overflow-wrap:anywhere]">{product.name}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">{product.categoryName}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          {promoPrice ? <span className="text-xl font-black text-rose-700">{formatEuro(promoPrice)}</span> : <span className="text-xl font-black text-emerald-800">{formatEuro(product.price)}</span>}
          {promoPrice ? <span className="text-sm font-semibold text-slate-500 line-through">{formatEuro(product.price)}</span> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{product.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge label={product.available ? "Disponible" : "Rupture"} tone={product.available ? "green" : "red"} />
          {featured ? <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"><Tag className="size-3.5" />Mis en avant</span> : null}
        </div>
      </div>
      <button type="button" onClick={() => onEdit?.(product)} className="col-span-2 min-h-11 rounded-xl bg-emerald-50 px-3 text-sm font-bold text-emerald-800 sm:col-span-1 sm:min-h-20 sm:min-w-20">
        <span className="inline-flex items-center gap-1.5"><Edit3 className="size-4 sm:size-5" />Modifier</span>
      </button>
    </article>
  );
}
