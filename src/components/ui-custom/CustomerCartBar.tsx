import { ChevronRight, Minus, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatEuro } from "@/lib/utils";

type BasketLine = {
  product: Product;
  quantity: number;
};

type CustomerCartBarProps = {
  itemCount: number;
  total: number;
  lines: BasketLine[];
  note: string;
  validationMessage?: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
};

export function CustomerCartBar({
  itemCount,
  total,
  lines,
  note,
  validationMessage,
  isOpen,
  onOpen,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onNoteChange,
  onConfirm,
}: CustomerCartBarProps) {
  const hasItems = itemCount > 0;
  const itemLabel = itemCount > 1 ? "articles" : "article";

  return (
    <>
      <div className="sticky bottom-4 z-30 mt-6 rounded-[1.6rem] bg-white/95 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur">
        <div className="grid grid-cols-[1fr_1.15fr] gap-3 max-[370px]:grid-cols-1">
          <button type="button" onClick={onOpen} className="flex min-h-16 items-center gap-3 rounded-2xl px-1 text-left transition active:scale-[0.99]">
            <span className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-[var(--tf-primary-50)] text-[var(--tf-primary-800)]">
              <ShoppingBasket className="size-8" />
              <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-[var(--tf-primary-700)] text-sm font-black text-white">{itemCount}</span>
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">Panier • {itemCount} {itemLabel}</span>
              <strong className="block text-3xl font-black text-[var(--tf-primary-800)]">{formatEuro(total)}</strong>
            </span>
          </button>
          <button
            type="button"
            onClick={hasItems ? onOpen : onConfirm}
            className="min-h-16 rounded-2xl bg-gradient-to-br from-[var(--tf-primary-600)] to-[var(--tf-primary-900)] px-4 text-lg font-bold text-white shadow-green transition active:scale-[0.99]"
          >
            <span className="inline-flex items-center gap-2">{hasItems ? "Voir le panier" : "Confirmer la commande"} <ChevronRight className="size-6" /></span>
          </button>
        </div>
        {validationMessage ? <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-base font-bold text-red-700">{validationMessage}</p> : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="customer-basket-title">
          <section className="max-h-[92dvh] w-full max-w-[640px] overflow-y-auto rounded-[1.7rem] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 id="customer-basket-title" className="text-3xl font-black tracking-[-0.05em] text-slate-950">Votre panier</h2>
                <p className="mt-1 text-base font-semibold text-slate-600">Paiement sur place</p>
              </div>
              <button type="button" onClick={onClose} className="grid size-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700" aria-label="Fermer le panier">
                <X className="size-7" />
              </button>
            </div>

            {lines.length > 0 ? (
              <div className="grid gap-3">
                {lines.map((line) => (
                  <article key={line.product.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-black leading-tight text-slate-950">{line.product.name}</h3>
                        <p className="mt-1 text-base font-bold text-[var(--tf-primary-800)]">{formatEuro(line.product.price)} pièce</p>
                      </div>
                      <strong className="shrink-0 text-xl font-black text-slate-950">{formatEuro(line.product.price * line.quantity)}</strong>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-1">
                        <button type="button" onClick={() => onDecrease(line.product.id)} className="grid size-11 place-items-center rounded-xl bg-white text-slate-700 shadow-card" aria-label={`Diminuer ${line.product.name}`}>
                          <Minus className="size-5" />
                        </button>
                        <span className="min-w-10 text-center text-xl font-black">{line.quantity}</span>
                        <button type="button" onClick={() => onIncrease(line.product.id)} className="grid size-11 place-items-center rounded-xl bg-white text-[var(--tf-primary-800)] shadow-card" aria-label={`Ajouter ${line.product.name}`}>
                          <Plus className="size-5" />
                        </button>
                      </div>
                      <button type="button" onClick={() => onRemove(line.product.id)} className="min-h-11 rounded-xl px-3 text-red-600" aria-label={`Retirer ${line.product.name}`}>
                        <Trash2 className="size-6" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-[color:var(--tf-primary-100)] bg-[color:var(--tf-primary-50)]/60 p-6 text-center">
                <p className="text-xl font-black text-[var(--tf-primary-900)]">Ajoutez au moins un produit avant de confirmer.</p>
              </div>
            )}

            <label className="mt-5 grid gap-2 text-base font-black text-slate-800">
              <span>Note pour l’équipe</span>
              <textarea
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                rows={3}
                placeholder="Sans oignons, s’il vous plaît"
                className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="mt-5 rounded-[1.25rem] bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3 text-lg font-bold text-slate-700">
                <span>Total</span>
                <strong className="text-3xl font-black text-[var(--tf-primary-800)]">{formatEuro(total)}</strong>
              </div>
              <p className="mt-2 text-base font-semibold text-slate-600">Paiement sur place</p>
            </div>

            {validationMessage ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-base font-bold text-red-700">{validationMessage}</p> : null}

            <button
              type="button"
              onClick={onConfirm}
              className="mt-5 min-h-16 w-full rounded-2xl bg-gradient-to-br from-[var(--tf-primary-600)] to-[var(--tf-primary-900)] px-5 text-lg font-black text-white shadow-green transition active:scale-[0.99]"
            >
              Confirmer la commande
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
