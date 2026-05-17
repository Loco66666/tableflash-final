"use client";

import Link from "next/link";
import { ChevronRight, Star, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReviewCard } from "@/components/ui-custom/ReviewCard";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { useReviewsStore } from "@/lib/local-store/reviewsStore";
import { useSettingsStore } from "@/lib/local-store/settingsStore";
import type { Review } from "@/lib/types";
import { useMemo, useState } from "react";

function formatAverageRating(reviews: Review[]) {
  if (reviews.length === 0) return "0/5";

  const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  return `${average.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5`;
}

function GoogleMark() {
  return <span className="text-4xl font-black tracking-[-0.12em] text-blue-600">G</span>;
}

function RatingStars({ rating }: { rating: Review["rating"] }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${rating} étoiles`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className={index < rating ? "size-5 fill-emerald-700 stroke-emerald-700" : "size-5 fill-slate-200 stroke-slate-200"} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { value: reviewItems, setValue: setReviewItems } = useReviewsStore();
  const { value: settings } = useSettingsStore();
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [googleReview, setGoogleReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [copied, setCopied] = useState(false);

  const activeReviews = useMemo(() => reviewItems.filter((review) => review.status !== "archived"), [reviewItems]);
  const sortedReviews = useMemo(
    () => [...activeReviews].sort((first, second) => Number(second.rating >= 4) - Number(first.rating >= 4)),
    [activeReviews],
  );
  const positiveReviewsCount = activeReviews.filter((review) => review.rating >= 4).length;
  const averageRating = formatAverageRating(activeReviews);
  const googleReviewUrl = settings.googleReviewUrl?.trim() ?? "";

  function openReply(review: Review) {
    setReplyReview(review);
    setReplyText(review.response ?? "");
    setReplyError("");
  }

  function saveReply() {
    const nextReply = replyText.trim();

    if (!nextReply) {
      setReplyError("Écrivez une réponse avant d’enregistrer");
      return;
    }

    if (!replyReview) return;

    setReviewItems((currentReviews) =>
      currentReviews.map((review) => (review.id === replyReview.id ? { ...review, response: nextReply, responseSaved: true } : review)),
    );
    setReplyReview(null);
    setReplyText("");
    setReplyError("");
  }

  function archiveReview(reviewId: string) {
    setReviewItems((currentReviews) =>
      currentReviews.map((review) => (review.id === reviewId ? { ...review, status: "archived" } : review)),
    );
  }

  function openGoogleDialog(review: Review) {
    setGoogleReview(review);
    setCopied(false);
  }

  async function copyGoogleLink() {
    if (!googleReviewUrl) return;
    await navigator.clipboard.writeText(googleReviewUrl);
    setCopied(true);
  }

  return (
    <AppShell>
      <PageHeader title="Avis clients" subtitle="Avis" />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard icon={Star} value={averageRating} label="note moyenne" />
        <StatCard icon={Star} value={String(activeReviews.length)} label="avis à traiter" warm />
        <StatCard icon={ThumbsUp} value={String(positiveReviewsCount)} label="avis positifs" />
      </div>

      {googleReviewUrl ? (
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-7 flex min-h-20 w-full items-center gap-4 rounded-[1.4rem] border border-slate-200/80 bg-white p-5 text-left shadow-card"
        >
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50"><GoogleMark /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-black">Lien Google Avis</span>
            <span className="block truncate text-slate-600">Voir et gérer vos avis sur Google</span>
          </span>
          <ChevronRight className="size-6 shrink-0 text-slate-500" />
        </a>
      ) : (
        <Link href="/dashboard/settings" className="mb-7 flex min-h-20 items-center gap-4 rounded-[1.4rem] border border-slate-200/80 bg-white p-5 shadow-card">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50"><GoogleMark /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-black">Lien Google Avis</span>
            <span className="block truncate text-slate-600">Voir et gérer vos avis sur Google</span>
          </span>
          <ChevronRight className="size-6 shrink-0 text-slate-500" />
        </Link>
      )}

      <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">À traiter</h2>
      {sortedReviews.length > 0 ? (
        <div className="grid gap-5">
          {sortedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} onReply={openReply} onArchive={archiveReview} onSuggestGoogle={openGoogleDialog} />
          ))}
        </div>
      ) : (
        <SectionCard className="py-8 text-center">
          <h3 className="text-2xl font-black tracking-[-0.03em]">Aucun avis à traiter</h3>
          <p className="mt-2 text-lg text-slate-600">Les nouveaux avis apparaîtront ici.</p>
        </SectionCard>
      )}

      {replyReview ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="reply-title">
          <div className="w-full rounded-[1.6rem] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-w-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-800">Réponse client</p>
                <h3 id="reply-title" className="mt-1 text-2xl font-black tracking-[-0.04em]">Avis de {replyReview.customer}</h3>
              </div>
              <button type="button" onClick={() => setReplyReview(null)} className="min-h-11 rounded-xl px-3 font-semibold text-slate-600">Fermer</button>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <RatingStars rating={replyReview.rating} />
              <p className="mt-3 text-slate-700">{replyReview.text}</p>
            </div>
            <label htmlFor="reply" className="mt-5 block text-lg font-black">Réponse</label>
            <textarea
              id="reply"
              value={replyText}
              onChange={(event) => {
                setReplyText(event.target.value);
                setReplyError("");
              }}
              className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-lg outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            />
            {replyError ? <p className="mt-2 font-semibold text-red-600">{replyError}</p> : null}
            <button type="button" onClick={saveReply} className="mt-5 min-h-14 w-full rounded-2xl bg-emerald-800 px-4 text-lg font-black text-white shadow-green">Enregistrer la réponse</button>
          </div>
        </div>
      ) : null}

      {googleReview ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="google-title">
          <div className="w-full rounded-[1.6rem] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-w-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-800">Avis positif</p>
                <h3 id="google-title" className="mt-1 text-2xl font-black tracking-[-0.04em]">Suggérer Google</h3>
              </div>
              <button type="button" onClick={() => setGoogleReview(null)} className="min-h-11 rounded-xl px-3 font-semibold text-slate-600">Fermer</button>
            </div>
            <p className="text-lg text-slate-700">Cet avis de {googleReview.customer} est positif. Vous pouvez proposer au client de partager son expérience sur Google.</p>
            {googleReviewUrl ? (
              <>
                <p className="mt-4 break-words rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{googleReviewUrl}</p>
                <div className="mt-5 grid gap-3 min-[430px]:grid-cols-2">
                  <a href={googleReviewUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-800 px-4 text-center text-lg font-black text-white shadow-green">Ouvrir Google Avis</a>
                  <button type="button" onClick={copyGoogleLink} className="min-h-14 rounded-2xl border border-emerald-700 px-4 text-lg font-black text-emerald-800">Copier le lien</button>
                </div>
                {copied ? <p className="mt-3 text-center font-black text-emerald-800">Lien copié</p> : null}
              </>
            ) : (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                <p className="text-lg font-semibold text-emerald-950">Ajoutez votre lien Google Avis dans les réglages.</p>
                <Link href="/dashboard/settings" className="mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-800 px-4 text-lg font-black text-white shadow-green">Ouvrir les réglages</Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
