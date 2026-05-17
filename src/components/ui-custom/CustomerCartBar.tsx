import { ChevronRight, ShoppingBasket } from "lucide-react";

export function CustomerCartBar() {
  return (
    <div className="sticky bottom-4 z-30 mt-6 rounded-[1.6rem] bg-white/95 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur">
      <div className="grid grid-cols-[1fr_1.2fr] gap-3 max-[370px]:grid-cols-1">
        <div className="flex items-center gap-3">
          <span className="relative grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><ShoppingBasket className="size-8" /><span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-emerald-700 text-sm font-black text-white">2</span></span>
          <div><p className="font-semibold">Panier • 2 articles</p><strong className="text-3xl font-black text-emerald-800">28,40 €</strong></div>
        </div>
        <button className="min-h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 px-4 text-lg font-bold text-white shadow-green"><span className="inline-flex items-center gap-2">Confirmer la commande <ChevronRight className="size-6" /></span></button>
      </div>
    </div>
  );
}
