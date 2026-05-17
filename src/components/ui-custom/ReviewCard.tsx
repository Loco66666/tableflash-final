import { Archive, MessageCircle, ReceiptText, Star, Table2 } from "lucide-react";
import type { Review } from "@/lib/types";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-800"><span className="size-6 rounded-full bg-current" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-black tracking-[-0.03em]">Avis de {review.customer}</h2>
            <span className="shrink-0 text-sm text-slate-500">{review.ageLabel}</span>
          </div>
          <p className="mt-3 flex items-center gap-1 text-lg text-slate-700">
            {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`size-6 ${index < review.rating ? "fill-emerald-700 stroke-emerald-700" : "fill-slate-200 stroke-slate-200"}`} />)}
            <span className="ml-2">{review.rating} étoiles</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-slate-700"><Table2 className="size-5 text-emerald-800" /> Table {review.table}</span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-slate-700"><ReceiptText className="size-5 text-emerald-800" /> Commande #{review.orderId}</span>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 min-[430px]:grid-cols-3">
        <button className="min-h-12 rounded-xl border border-emerald-700 px-3 font-semibold text-emerald-800"><span className="inline-flex items-center gap-2"><MessageCircle className="size-5" /> Répondre</span></button>
        {review.suggestGoogle ? <button className="min-h-12 rounded-xl border border-slate-200 px-3 font-semibold">Suggérer Google</button> : null}
        <button className="min-h-12 rounded-xl border border-slate-200 px-3 font-semibold"><span className="inline-flex items-center gap-2"><Archive className="size-5" /> Archiver</span></button>
      </div>
    </article>
  );
}
