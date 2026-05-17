import { Edit3, Tag } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const visuals = {
  salad: "from-lime-100 via-emerald-50 to-yellow-100 before:bg-[radial-gradient(circle_at_35%_35%,#65a30d_0_10%,transparent_11%),radial-gradient(circle_at_60%_40%,#facc15_0_7%,transparent_8%),radial-gradient(circle_at_50%_65%,#15803d_0_14%,transparent_15%)]",
  burger: "from-amber-100 via-orange-100 to-yellow-50 before:bg-[radial-gradient(ellipse_at_50%_32%,#b45309_0_22%,transparent_23%),radial-gradient(ellipse_at_50%_54%,#7f1d1d_0_24%,transparent_25%),radial-gradient(ellipse_at_50%_72%,#facc15_0_22%,transparent_23%)]",
  dessert: "from-stone-100 via-amber-50 to-rose-50 before:bg-[linear-gradient(180deg,#92400e_0_18%,#fff7ed_18%_46%,#78350f_46%_62%,#ffedd5_62%)]",
};

export function ProductVisual({ visual }: { visual: Product["visual"] }) {
  return <div className={`relative min-h-32 overflow-hidden rounded-2xl bg-gradient-to-br ${visuals[visual as keyof typeof visuals]} before:absolute before:inset-3 before:rounded-2xl before:bg-no-repeat before:content-['']`} />;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="grid grid-cols-[7rem_1fr_auto] gap-4 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-card max-[380px]:grid-cols-[6rem_1fr]">
      <ProductVisual visual={product.visual} />
      <div className="min-w-0 py-1">
        <h2 className="text-xl font-black tracking-[-0.03em]">{product.name}</h2>
        <p className="mt-2 text-2xl font-black text-emerald-800">{formatEuro(product.price)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge label={product.available ? "Disponible" : "Rupture"} tone={product.available ? "green" : "red"} />
          {product.promoted ? <span className="inline-flex min-h-8 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-amber-600"><Tag className="size-4" /> Promo</span> : null}
        </div>
      </div>
      <button className="flex min-h-24 min-w-20 flex-col items-center justify-center gap-2 self-center rounded-2xl bg-emerald-50 px-3 text-emerald-800 max-[380px]:col-span-2 max-[380px]:min-h-12 max-[380px]:flex-row">
        <Edit3 className="size-8" />
        <span className="font-semibold">Modifier</span>
      </button>
    </article>
  );
}
