import Link from "next/link";
import { Archive, ChevronRight, MessageCircle, Star, ThumbsUp, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { archiveReview, saveReviewResponse } from "@/app/dashboard/reviews/actions";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

type ReviewRating = 1 | 2 | 3 | 4 | 5;

type RestaurantReviewRow = {
  id: string;
  restaurant_id: string;
  order_id: string | null;
  table_id: string | null;
  customer_name: string | null;
  rating: number;
  comment: string | null;
  status: "pending" | "archived";
  response: string | null;
  response_saved: boolean;
  suggest_google: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type RestaurantTableRow = {
  id: string;
  name: string;
  slug: string;
  zone: string | null;
};

function clampRating(rating: number): ReviewRating {
  if (rating <= 1) return 1;
  if (rating === 2) return 2;
  if (rating === 3) return 3;
  if (rating === 4) return 4;
  return 5;
}

function formatAverageRating(reviews: RestaurantReviewRow[]) {
  if (reviews.length === 0) return "0/5";

  const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;

  return `${average.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}/5`;
}

function formatReviewAge(createdAt: string | null) {
  if (!createdAt) return "Date inconnue";

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "Date inconnue";
  }

  const now = new Date();
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / 60_000));

  if (diffMinutes < 1) return "A l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return createdDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function parseTableNumber(table?: RestaurantTableRow) {
  if (!table) return null;

  const match = table.name.match(/\d+/) ?? table.slug.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function GoogleMark() {
  return <span className="text-4xl font-black tracking-[-0.12em] text-blue-600">G</span>;
}

function RatingStars({ rating }: { rating: ReviewRating }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${rating} etoiles`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            index < rating ? "size-5 fill-emerald-700 stroke-emerald-700" : "size-5 fill-slate-200 stroke-slate-200"
          }
        />
      ))}
    </span>
  );
}

function getSuggestedResponse(review: RestaurantReviewRow) {
  const customerName = review.customer_name?.trim() || "Bonjour";

  if (review.rating >= 4) {
    return `${customerName}, merci beaucoup pour votre retour. Toute l'equipe est ravie que votre experience se soit bien passee. Au plaisir de vous revoir tres vite.`;
  }

  if (review.rating === 3) {
    return `${customerName}, merci pour votre retour. Nous prenons votre remarque en compte pour ameliorer l'experience lors de votre prochaine visite.`;
  }

  return `${customerName}, merci d'avoir pris le temps de nous laisser un retour. Nous sommes desoles que l'experience n'ait pas ete a la hauteur. Votre remarque va etre transmise a l'equipe pour corriger ce point rapidement.`;
}

function getReviewPriority(rating: ReviewRating) {
  if (rating <= 2) return { label: "A traiter en priorite", className: "bg-red-50 text-red-700" };
  if (rating === 3) return { label: "A surveiller", className: "bg-amber-50 text-amber-800" };
  return { label: "Avis positif", className: "bg-emerald-50 text-emerald-800" };
}

function ReviewPanel({
  review,
  table,
  googleReviewUrl,
}: {
  review: RestaurantReviewRow;
  table?: RestaurantTableRow;
  googleReviewUrl: string;
}) {
  const rating = clampRating(review.rating);
  const customerName = review.customer_name?.trim() || "Client";
  const tableNumber = parseTableNumber(table);
  const suggestedResponse = review.response?.trim() || getSuggestedResponse(review);
  const priority = getReviewPriority(rating);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <RatingStars rating={rating} />
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Avis de {customerName}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{formatReviewAge(review.created_at)}</p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-800">{rating}/5</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
        {table ? (
          <span className="rounded-full bg-slate-100 px-3 py-1.5">
            {tableNumber ? `Table ${tableNumber}` : table.name}
            {table.zone ? ` - ${table.zone}` : ""}
          </span>
        ) : null}

        {review.order_id ? <span className="rounded-full bg-slate-100 px-3 py-1.5">Commande liee</span> : null}
        <span className={`rounded-full px-3 py-1.5 ${priority.className}`}>{priority.label}</span>
        {review.response_saved ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">Reponse prete</span> : null}
      </div>

      {review.comment ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-lg leading-relaxed text-slate-800">{review.comment}</p>
      ) : (
        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-lg leading-relaxed text-slate-500">Aucun commentaire ecrit.</p>
      )}

      <form action={saveReviewResponse} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <input type="hidden" name="reviewId" value={review.id} />
        <label className="grid gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
          Reponse rapide
          <textarea
            name="response"
            defaultValue={suggestedResponse}
            rows={4}
            className="min-h-28 rounded-2xl border border-slate-200 bg-white p-3 text-base font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-base font-black text-white shadow-green"
        >
          <MessageCircle className="size-5" />
          Enregistrer la reponse
        </button>
      </form>

      <div className="mt-3 grid gap-3 min-[430px]:grid-cols-2">
        {rating >= 4 && googleReviewUrl ? (
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 px-4 text-base font-black text-emerald-800"
          >
            <GoogleMark /> Ouvrir Google
          </a>
        ) : null}

        <form action={archiveReview}>
          <input type="hidden" name="reviewId" value={review.id} />
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-base font-bold text-slate-700"
          >
            <Archive className="size-5" />
            Archiver
          </button>
        </form>
      </div>
    </article>
  );
}

export default async function ReviewsPage() {
  const { restaurant, settings } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { data: reviewsData, error: reviewsError } = await supabase
    .from("restaurant_reviews")
    .select(
      "id, restaurant_id, order_id, table_id, customer_name, rating, comment, status, response, response_saved, suggest_google, created_at, updated_at",
    )
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .returns<RestaurantReviewRow[]>();

  if (reviewsError) {
    console.error("[dashboard/reviews] reviews query failed", {
      restaurantId: restaurant.id,
      errorCode: reviewsError.code,
      errorMessage: reviewsError.message,
    });

    throw new Error("Chargement des avis impossible.");
  }

  const reviews = reviewsData ?? [];
  const activeReviews = reviews.filter((review) => review.status !== "archived");

  const tableIds = [...new Set(activeReviews.map((review) => review.table_id).filter(Boolean))] as string[];

  const { data: tablesData, error: tablesError } =
    tableIds.length > 0
      ? await supabase
          .from("restaurant_tables")
          .select("id, name, slug, zone")
          .in("id", tableIds)
          .returns<RestaurantTableRow[]>()
      : { data: [] as RestaurantTableRow[], error: null };

  if (tablesError) {
    console.error("[dashboard/reviews] tables query failed", {
      restaurantId: restaurant.id,
      errorCode: tablesError.code,
      errorMessage: tablesError.message,
    });

    throw new Error("Chargement des tables impossible.");
  }

  const tablesById = new Map((tablesData ?? []).map((table) => [table.id, table]));
  const sortedReviews = [...activeReviews].sort((first, second) => {
    const firstRating = clampRating(first.rating);
    const secondRating = clampRating(second.rating);
    const firstPriority = firstRating <= 2 ? 0 : firstRating === 3 ? 1 : 2;
    const secondPriority = secondRating <= 2 ? 0 : secondRating === 3 ? 1 : 2;

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    return new Date(second.created_at ?? 0).getTime() - new Date(first.created_at ?? 0).getTime();
  });

  const negativeReviewsCount = activeReviews.filter((review) => review.rating <= 2).length;
  const positiveReviewsCount = activeReviews.filter((review) => review.rating >= 4).length;
  const averageRating = formatAverageRating(activeReviews);
  const googleReviewUrl = restaurant.google_review_url?.trim() ?? "";
  const reviewsEnabled = settings?.reviews_enabled ?? true;

  return (
    <AppShell>
      <PageHeader title="Avis clients" subtitle={`Avis - ${restaurant.name}`} />

      {reviewsEnabled === false ? (
        <SectionCard className="mb-6 border-amber-200 bg-amber-50">
          <h2 className="text-xl font-black text-amber-900">Avis desactives</h2>
          <p className="mt-2 text-base font-semibold text-amber-800">
            Les demandes avis sont actuellement desactivees dans les reglages du restaurant.
          </p>
        </SectionCard>
      ) : null}

      <SectionCard className="mb-6 border-emerald-100 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-800">
            {negativeReviewsCount > 0 ? <TriangleAlert className="size-6 text-amber-600" /> : <ThumbsUp className="size-6" />}
          </span>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              {negativeReviewsCount > 0
                ? `${negativeReviewsCount} avis sensible(s) a traiter`
                : activeReviews.length > 0
                  ? "Avis clients sous controle"
                  : "Aucun avis en attente"}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">
              Les avis faibles sont affiches en premier. Les avis positifs servent a encourager le partage Google.
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard icon={Star} value={averageRating} label="note moyenne" />
        <StatCard icon={Star} value={String(activeReviews.length)} label="avis a traiter" warm />
        <StatCard icon={ThumbsUp} value={String(positiveReviewsCount)} label="avis positifs" />
      </div>

      {googleReviewUrl ? (
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-7 flex min-h-20 w-full items-center gap-4 rounded-[1.4rem] border border-slate-200/80 bg-white p-5 text-left shadow-card"
        >
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50">
            <GoogleMark />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-black">Lien Google Avis</span>
            <span className="block truncate text-slate-600">Voir et gerer vos avis sur Google</span>
          </span>
          <ChevronRight className="size-6 shrink-0 text-slate-500" />
        </a>
      ) : (
        <Link
          href="/dashboard/settings"
          className="mb-7 flex min-h-20 items-center gap-4 rounded-[1.4rem] border border-slate-200/80 bg-white p-5 shadow-card"
        >
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50">
            <GoogleMark />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-black">Lien Google Avis</span>
            <span className="block truncate text-slate-600">Ajoutez votre lien dans les reglages</span>
          </span>
          <ChevronRight className="size-6 shrink-0 text-slate-500" />
        </Link>
      )}

      <h2 className="mb-4 text-2xl font-black tracking-tight">A traiter</h2>

      {sortedReviews.length > 0 ? (
        <div className="grid gap-5">
          {sortedReviews.map((review) => (
            <ReviewPanel
              key={review.id}
              review={review}
              table={review.table_id ? tablesById.get(review.table_id) : undefined}
              googleReviewUrl={googleReviewUrl}
            />
          ))}
        </div>
      ) : (
        <SectionCard className="py-8 text-center">
          <h3 className="text-2xl font-black tracking-tight">Aucun avis a traiter</h3>
          <p className="mt-2 text-lg text-slate-600">Les nouveaux avis apparaitront ici.</p>
        </SectionCard>
      )}
    </AppShell>
  );
}
