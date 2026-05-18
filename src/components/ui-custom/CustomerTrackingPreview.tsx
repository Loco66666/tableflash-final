import { Bell, ChefHat, Check, CreditCard, Heart, QrCode, Table2 } from "lucide-react";
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

function getGoogleReviewUrl(settings?: CustomerReviewSettings) {
  return settings?.reviewsSettings?.googleReviewUrl || settings?.googleReviewUrl || settings?.googleReviewsUrl || settings?.reviewUrl || "";
}

const activeStepByStatus: Record<Order["status"], number> = {
  new: 0,
  accepted: 1,
  payment_pending: 1,
  paid: 2,
  preparing: 3,
  ready: 3,
  served: 4,
  refused: 1,
};

function getStatusCopy(orderStatus: Order["status"]) {
  if (orderStatus === "preparing") return { title: "Votre commande est en préparation", message: "L’équipe prépare votre commande." };
  if (orderStatus === "ready") return { title: "Votre commande est prête", message: "L’équipe arrive à votre table." };
  if (orderStatus === "served") return { title: "Bon appétit", message: "Votre commande a été servie." };
  if (orderStatus === "paid") return { title: "Règlement pris en compte", message: "La préparation peut commencer." };
  if (orderStatus === "refused") return { title: "L’équipe revient vers vous", message: "Un membre de l’équipe va vous accompagner." };
  return { title: "Votre commande a été envoyée", message: "L’équipe va valider votre commande." };
}

export function CustomerTrackingPreview({
  tableName = "Table 1",
  tableArea = "",
  total = 0,
  order,
  settings,
}: {
  tableName?: string;
  tableArea?: string;
  total?: number;
  order?: Order;
  settings?: CustomerReviewSettings;
}) {
  const status = order?.status ?? "new";
  const activeStep = activeStepByStatus[status];
  const statusCopy = getStatusCopy(status);
  const googleReviewUrl = getGoogleReviewUrl(settings);

  return (
    <div className="grid gap-6">
      <SectionCard className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-900 text-white"><Check className="size-9" /></span>
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-emerald-800">Commande envoyée</h2>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-lg text-slate-600">
            <span className="inline-flex items-center gap-2"><Table2 className="size-5" />{tableArea ? `${tableName} • ${tableArea}` : tableName}</span>
            <span className="inline-flex items-center gap-2"><QrCode className="size-5" />{formatEuro(total)}</span>
          </p>
        </div>
      </SectionCard>
      <section className="rounded-[1.6rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 text-center shadow-card">
        <span className="mx-auto mb-4 grid size-24 place-items-center rounded-full bg-emerald-100 text-emerald-800"><ChefHat className="size-14" /></span>
        <h2 className="text-3xl font-black leading-tight text-emerald-800">{statusCopy.title}</h2>
        <p className="mt-3 text-lg text-slate-600">{statusCopy.message}</p>
        <div className="mt-7 grid grid-cols-5 gap-1">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            const isDone = index <= activeStep;
            return (
              <div key={step.label} className="text-center">
                <span className={(isActive ? "ring-2 ring-emerald-700 " : "") + (isDone ? "bg-emerald-700 text-white" : "bg-white text-slate-400") + " mx-auto grid size-12 place-items-center rounded-full border border-emerald-100"}><Icon className="size-6" /></span>
                <p className={(isActive ? "text-emerald-800" : "text-slate-600") + " mt-2 text-xs font-medium leading-tight"}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </section>
      <div>
        <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Après le repas</h2>
        <SectionCard className="grid gap-4">
          <div className="flex min-h-16 items-center gap-4">
            <span className="grid size-12 place-items-center rounded-full bg-emerald-50 font-black text-blue-600">G</span>
            <span className="flex-1 text-lg font-semibold">Donner un avis sur Google</span>
          </div>
          {googleReviewUrl ? (
            <a href={googleReviewUrl} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green">
              Donner un avis sur Google
            </a>
          ) : (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-900">L’équipe vous proposera un lien d’avis après le repas.</p>
          )}
          <button type="button" className="min-h-12 rounded-2xl border border-slate-200 px-5 text-lg font-bold text-slate-700">Plus tard</button>
        </SectionCard>
      </div>
      <footer className="pb-2 text-center text-slate-600"><Heart className="mx-auto mb-2 size-8 text-emerald-800" /><strong className="text-slate-950">Merci pour votre confiance !</strong></footer>
    </div>
  );
}
