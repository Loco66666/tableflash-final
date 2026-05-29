"use client";

import { useState } from "react";
import { Bell, ChefHat, Check, CreditCard, Heart, QrCode, Star, Table2 } from "lucide-react";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import type { Order, RestaurantSettings } from "@/lib/types";
import { formatEuro } from "@/lib/utils";

const steps = [
  { label: "Commande envoyée", icon: Check },
  { label: "Validation", icon: Check },
  { label: "Règlement", icon: CreditCard },
  { label: "Préparation", icon: ChefHat },
  { label: "Service", icon: Bell },
];

type CustomerReviewSettings = Partial<RestaurantSettings> & {
  googleReviewsUrl?: string;
  reviewUrl?: string;
  reviewsSettings?: Partial<RestaurantSettings["reviewsSettings"]>;
};

type SubmitReviewResult = {
  ok: boolean;
  message: string;
  alreadySubmitted?: boolean;
  suggestGoogle?: boolean;
  googleReviewUrl?: string;
};

function getGoogleReviewUrl(settings?: CustomerReviewSettings) {
  return settings?.reviewsSettings?.googleReviewUrl || settings?.googleReviewUrl || settings?.googleReviewsUrl || settings?.reviewUrl || "";
}

function getReviewsEnabled(settings?: CustomerReviewSettings) {
  return settings?.reviewsSettings?.enabledAfterMeal !== false;
}

function getSuggestGoogleOnPositive(settings?: CustomerReviewSettings) {
  return settings?.reviewsSettings?.suggestGoogleOnPositive !== false;
}

const activeStepByStatus: Record<Order["status"], number> = {
  new: 0,
  accepted: 1,
  payment_pending: 2,
  paid: 2,
  preparing: 3,
  ready: 4,
  served: 4,
  refused: 1,
};

function getStatusCopy(orderStatus: Order["status"]) {
  if (orderStatus === "accepted" || orderStatus === "payment_pending") {
    return { title: "Commande validée", message: "Le règlement se fait sur place." };
  }

  if (orderStatus === "paid") {
    return { title: "Règlement noté", message: "L’équipe va lancer la préparation." };
  }

  if (orderStatus === "preparing") {
    return { title: "Votre commande est en préparation", message: "L’équipe prépare votre commande." };
  }

  if (orderStatus === "ready") {
    return { title: "Votre commande est prête", message: "L’équipe va vous la servir." };
  }

  if (orderStatus === "served") {
    return { title: "Commande servie", message: "Bon appétit." };
  }

  if (orderStatus === "refused") {
    return { title: "Commande refusée", message: "Demandez plus d’informations à l’équipe." };
  }

  return { title: "Votre commande a été envoyée", message: "L’équipe va valider votre commande." };
}

function RatingButton({
  active,
  index,
  onClick,
}: {
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        (active ? "bg-emerald-700 text-white shadow-green" : "border border-slate-200 bg-white text-slate-400") +
        " grid size-12 place-items-center rounded-full transition active:scale-95"
      }
      aria-label={`${index} étoile${index > 1 ? "s" : ""}`}
    >
      <Star className={active ? "size-6 fill-white stroke-white" : "size-6 fill-slate-100 stroke-slate-300"} />
    </button>
  );
}

export function CustomerTrackingPreview({
  tableName = "Table 1",
  tableArea = "",
  total = 0,
  order,
  orderNumber,
  settings,
  submitReviewAction,
}: {
  tableName?: string;
  tableArea?: string;
  total?: number;
  order?: Order;
  orderNumber?: number | null;
  settings?: CustomerReviewSettings;
  submitReviewAction?: (input: { rating: number; comment: string }) => Promise<SubmitReviewResult>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewSuggestGoogle, setReviewSuggestGoogle] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const status = order?.status ?? "new";
  const activeStep = activeStepByStatus[status] ?? 0;
  const statusCopy = getStatusCopy(status);
  const googleReviewUrl = getGoogleReviewUrl(settings);
  const reviewsEnabled = getReviewsEnabled(settings);
  const suggestGoogleOnPositive = getSuggestGoogleOnPositive(settings);
  const displayOrderNumber = orderNumber ?? order?.orderNumber ?? null;
  const canReview = status === "served" && reviewsEnabled;
  const shouldShowGoogleButton = reviewSubmitted && reviewSuggestGoogle && suggestGoogleOnPositive && Boolean(googleReviewUrl);

  async function submitReview() {
    if (!submitReviewAction) {
      setReviewError("Avis indisponible pour le moment.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");
    setReviewMessage("");

    const result = await submitReviewAction({
      rating,
      comment,
    });

    setIsSubmittingReview(false);

    if (!result.ok) {
      setReviewError(result.message);
      return;
    }

    setReviewSubmitted(true);
    setReviewMessage(result.message);
    setReviewSuggestGoogle(Boolean(result.suggestGoogle));
  }

  return (
    <div className="grid gap-6">
      <SectionCard className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-linear-to-br from-emerald-600 to-emerald-900 text-white">
          <Check className="size-9" />
        </span>

        <div className="min-w-0">
          <h2 className="text-2xl font-black text-emerald-800">Commande envoyée</h2>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-lg text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Table2 className="size-5" />
              {tableArea ? `${tableName} · ${tableArea}` : tableName}
            </span>
            <span className="inline-flex items-center gap-2">
              <QrCode className="size-5" />
              {formatEuro(total)}
            </span>
          </p>
          {displayOrderNumber ? (
            <p className="mt-2 text-xl font-black text-emerald-900">Commande n°{displayOrderNumber}</p>
          ) : null}
        </div>
      </SectionCard>

      <section className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-white p-5 text-center shadow-card">
        <span className="mx-auto mb-4 grid size-24 place-items-center rounded-full bg-emerald-100 text-emerald-800">
          <ChefHat className="size-14" />
        </span>

        <h2 className="text-3xl font-black leading-tight text-emerald-800">{statusCopy.title}</h2>
        <p className="mt-3 text-lg text-slate-600">{statusCopy.message}</p>

        <div className="mt-7 grid grid-cols-5 gap-1">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            const isDone = index <= activeStep;

            return (
              <div key={step.label} className="text-center">
                <span
                  className={
                    (isActive ? "ring-2 ring-emerald-700 " : "") +
                    (isDone ? "bg-emerald-700 text-white" : "bg-white text-slate-400") +
                    " mx-auto grid size-12 place-items-center rounded-full border border-emerald-100"
                  }
                >
                  <Icon className="size-6" />
                </span>
                <p className={(isActive ? "text-emerald-800" : "text-slate-600") + " mt-2 text-xs font-medium leading-tight"}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div>
        <h2 className="mb-4 text-2xl font-black tracking-tight">Après le repas</h2>

        <SectionCard className="grid gap-4">
          {!reviewsEnabled ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-base font-semibold text-slate-600">
              Les avis ne sont pas activés pour ce restaurant.
            </p>
          ) : null}

          {reviewsEnabled && !canReview ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-left">
              <p className="text-lg font-black text-emerald-900">Votre avis compte</p>
              <p className="mt-1 text-base font-semibold text-slate-700">
                Vous pourrez laisser un avis ici après le service.
              </p>
            </div>
          ) : null}

          {canReview && !reviewSubmitted ? (
            <div className="grid gap-4">
              <div>
                <p className="text-xl font-black text-slate-950">Comment s’est passé votre repas ?</p>
                <p className="mt-1 text-base font-semibold text-slate-600">
                  Votre retour sera transmis directement au restaurant.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2" aria-label="Note du repas">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;

                  return (
                    <RatingButton
                      key={value}
                      index={value}
                      active={value <= rating}
                      onClick={() => setRating(value)}
                    />
                  );
                })}
              </div>

              <label className="grid gap-2 text-base font-black text-slate-800">
                Votre avis
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Exemple : très bon repas, service rapide..."
                />
              </label>

              {reviewError ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-base font-bold text-red-700">{reviewError}</p>
              ) : null}

              <button
                type="button"
                onClick={submitReview}
                disabled={isSubmittingReview}
                className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green disabled:opacity-60"
              >
                {isSubmittingReview ? "Envoi de l’avis..." : "Envoyer mon avis"}
              </button>
            </div>
          ) : null}

          {reviewSubmitted ? (
            <div className="grid gap-4">
              <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-center">
                <Heart className="mx-auto mb-2 size-8 text-emerald-800" />
                <p className="text-xl font-black text-emerald-900">Merci pour votre avis !</p>
                <p className="mt-1 text-base font-semibold text-slate-700">{reviewMessage}</p>
              </div>

              {shouldShowGoogleButton ? (
                <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-white p-4 text-center">
                  <p className="text-lg font-black text-slate-950">
                    Vous pouvez aussi aider le restaurant sur Google.
                  </p>

                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green"
                  >
                    Publier aussi sur Google
                  </a>
                </div>
              ) : null}

              {reviewSuggestGoogle && suggestGoogleOnPositive && !googleReviewUrl ? (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-900">
                  Votre avis positif a bien été transmis au restaurant.
                </p>
              ) : null}
            </div>
          ) : null}
        </SectionCard>
      </div>

      <footer className="pb-2 text-center text-slate-600">
        <Heart className="mx-auto mb-2 size-8 text-emerald-800" />
        <strong className="text-slate-950">Merci pour votre confiance !</strong>
      </footer>
    </div>
  );
}