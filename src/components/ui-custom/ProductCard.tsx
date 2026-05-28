import { Edit3, IceCreamBowl, ImageIcon, Leaf, Sparkles, Star, Tag, Utensils, Wine } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

type ProductCardProduct = Product & {
  categoryName?: string;
};

function getVisualStyle(categoryName?: string) {
  const name = (categoryName ?? "").toLocaleLowerCase("fr-FR");

  if (name.includes("entr")) return { tone: "from-emerald-100 via-lime-50 to-white", Icon: Leaf };
  if (name.includes("dess")) return { tone: "from-amber-50 via-rose-50 to-white", Icon: IceCreamBowl };
  if (name.includes("boiss")) return { tone: "from-sky-100 via-cyan-50 to-white", Icon: Wine };
  if (name.includes("plat")) return { tone: "from-amber-100 via-orange-50 to-white", Icon: Utensils };

  return { tone: "from-slate-100 via-slate-50 to-white", Icon: Sparkles };
}

export function ProductVisual({
  visual,
  imageUrl,
  alt,
  categoryName,
}: {
  visual: Product["visual"];
  imageUrl?: string;
  alt?: string;
  categoryName?: string;
}) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(imageUrl) && !broken;
  const style = useMemo(() => getVisualStyle(categoryName ?? visual), [categoryName, visual]);

  if (showImage) {
    return (
      <div className="relative h-24 overflow-hidden rounded-xl bg-emerald-50 sm:h-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt ?? "Produit"}
          className="absolute inset-0 size-full object-cover"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  const Icon = style.Icon;

  return (
    <div
      className={`relative grid h-24 place-items-center overflow-hidden rounded-xl bg-linear-to-br ${style.tone} sm:h-24`}      aria-hidden="true"
    >
      <span className="rounded-full bg-white/90 p-2 text-slate-700 shadow-card">
        {imageUrl ? <ImageIcon className="size-5" /> : <Icon className="size-5" />}
      </span>
    </div>
  );
}

export function ProductCard({
  product,
  onEdit,
}: {
  product: ProductCardProduct;
  onEdit?: (product: Product) => void;
}) {
  const featured = Boolean(product.featured ?? product.promoted);
  const promoPrice = typeof product.promoPrice === "number" && product.promoPrice > 0 ? product.promoPrice : null;

  return (
    <article className="grid grid-cols-[5.9rem_1fr_auto] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.08)] sm:grid-cols-[6rem_1fr_auto]">
      <ProductVisual
        visual={product.visual}
        imageUrl={product.imageUrl}
        alt={product.name}
        categoryName={product.categoryName}
      />

      <div className="min-w-0">
        <h2 className="line-clamp-2 text-base font-black leading-tight tracking-tight text-slate-950 sm:text-lg">
          {product.name}
        </h2>

        <p className="mt-0.5 truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
          {product.categoryName}
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          {promoPrice ? (
            <>
              <span className="text-xl font-black text-rose-700">{formatEuro(promoPrice)}</span>
              <span className="text-sm font-semibold text-slate-500 line-through">{formatEuro(product.price)}</span>
            </>
          ) : (
            <span className="text-xl font-black text-emerald-800">{formatEuro(product.price)}</span>
          )}
        </div>

        {product.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600 wrap-anywhere">
            {product.description}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge label={product.available ? "Disponible" : "Indisponible"} tone={product.available ? "green" : "red"} />

          {featured ? (
            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
              <Star className="size-3.5" />
              Recommandé
            </span>
          ) : null}

          {promoPrice ? (
            <span className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
              <Tag className="size-3.5" />
              Promo
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit?.(product)}
        className="min-h-11 self-center rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-800 sm:px-3 sm:text-sm"
      >
        <span className="inline-flex items-center gap-1.5">
          <Edit3 className="size-3.5 sm:size-4" />
          Modifier
        </span>
      </button>
    </article>
  );
}