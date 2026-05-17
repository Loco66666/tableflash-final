import { Archive, MessageCircle, ReceiptText, Star, Table2, UserRound } from "lucide-react";
import type { Review } from "@/lib/types";

function ReviewStars({ rating }: { rating: Review["rating"] }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${rating} étoiles`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-5 min-[390px]:size-6 ${index < rating ? "fill-emerald-700 stroke-emerald-700" : "fill-slate-200 stroke-slate-200"}`}
        />
      ))}
    </span>
  );
}

function GoogleIcon() {
  return <span className="text-xl font-black tracking-[-0.12em] text-blue-600">G</span>;
}

export function ReviewCard({
  review,
  onReply,
  onArchive,
  onSuggestGoogle,
}: {
  review: Review;
  onReply?: (review: Review) => void;
  onArchive?: (reviewId: string) => void;
  onSuggestGoogle?: (review: Review) => void;
}) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-card min-[390px]:p-5">
      <div className="flex gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <UserRound className="size-8 fill-emerald-700/10" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 text-[1.35rem] font-black leading-tight tracking-[-0.03em] min-[390px]:text-2xl">Avis de {review.customer}</h2>
            <span className="shrink-0 pt-1 text-sm text-slate-500">{review.ageLabel}</span>
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-slate-700 min-[390px]:text-lg">
            <ReviewStars rating={review.rating} />
            <span>{review.rating} étoiles</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {review.table ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-slate-700">
                <Table2 className="size-5 text-emerald-800" /> Table {review.table}
              </span>
            ) : null}
            {review.orderId ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-slate-700">
                <ReceiptText className="size-5 text-emerald-800" /> Commande #{review.orderId}
              </span>
            ) : null}
          </div>
          {review.responseSaved ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">Réponse enregistrée</p> : null}
        </div>
      </div>
      <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 min-[430px]:grid-cols-2 min-[640px]:grid-cols-3">
        <button
          type="button"
          onClick={() => onReply?.(review)}
          className="min-h-12 rounded-xl border border-emerald-700 px-3 font-semibold text-emerald-800"
        >
          <span className="inline-flex items-center gap-2"><MessageCircle className="size-5" /> Répondre</span>
        </button>
        {review.rating >= 4 && review.status !== "archived" ? (
          <button type="button" onClick={() => onSuggestGoogle?.(review)} className="min-h-12 rounded-xl border border-slate-200 px-3 font-semibold">
            <span className="inline-flex items-center gap-2"><GoogleIcon /> Suggérer Google</span>
          </button>
        ) : null}
        <button type="button" onClick={() => onArchive?.(review.id)} className="min-h-12 rounded-xl border border-slate-200 px-3 font-semibold">
          <span className="inline-flex items-center gap-2"><Archive className="size-5" /> Archiver</span>
        </button>
      </div>
    </article>
  );
}
