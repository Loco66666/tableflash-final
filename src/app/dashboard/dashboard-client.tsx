import {
  Check,
  ClipboardList,
  CreditCard,
  PackageOpen,
  Plus,
  Printer,
  QrCode,
  ShoppingBasket,
  Star,
  Table2,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionCard } from "@/components/ui-custom/ActionCard";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { StatCard } from "@/components/ui-custom/StatCard";

export type DashboardClientData = {
  restaurant: {
    name: string;
    city: string | null;
    status: string;
    plan: string;
    email: string | null;
    phone: string | null;
  };
  settings: {
    lunchEnabled: boolean;
    lunchStart: string;
    lunchEnd: string;
    dinnerEnabled: boolean;
    dinnerStart: string;
    dinnerEnd: string;
    ordersEnabled: boolean;
    qrEnabled: boolean;
    reviewsEnabled: boolean;
    onSitePaymentEnabled: boolean;
  };
  tasks: {
    ordersToAccept: number;
    ordersToCollect: number;
    reviewsToHandle: number;
    unavailableProducts: number;
  };
  today: {
    ordersCount: number;
    estimatedSales: string;
    averageRating: string;
    reviewsCount: number;
    activeTablesCount: number;
  };
};

function parseTimeToMinutes(value: string | null | undefined) {
  if (!value) return null;

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

function formatServiceTime(value: string) {
  const [hour = "00", minute = "00"] = value.split(":");

  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function formatServiceRange(start: string, end: string) {
  return `${formatServiceTime(start)} - ${formatServiceTime(end)}`;
}

function getServiceRanges(settings: DashboardClientData["settings"]) {
  const ranges: string[] = [];

  if (settings.lunchEnabled) {
    ranges.push(formatServiceRange(settings.lunchStart, settings.lunchEnd));
  }

  if (settings.dinnerEnabled) {
    ranges.push(formatServiceRange(settings.dinnerStart, settings.dinnerEnd));
  }

  return ranges.join(" · ");
}

function isWithinTimeRange(nowMinutes: number, start: string, end: string) {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  }

  return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
}

function getPendingTasksCount(tasks: DashboardClientData["tasks"]) {
  return tasks.ordersToAccept + tasks.ordersToCollect + tasks.reviewsToHandle;
}

function getServiceStatus(settings: DashboardClientData["settings"], tasks: DashboardClientData["tasks"]) {
  const pendingTasksCount = getPendingTasksCount(tasks);
  const serviceRanges = getServiceRanges(settings);

  if (!settings.ordersEnabled) {
    return {
      isOpen: false,
      title: "Commandes désactivées",
      subtitle: "Les clients peuvent consulter le menu",
      detail: "Activez les commandes dans les réglages pour recevoir des commandes QR.",
    };
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const lunchOpen =
    settings.lunchEnabled && isWithinTimeRange(nowMinutes, settings.lunchStart, settings.lunchEnd);
  const dinnerOpen =
    settings.dinnerEnabled && isWithinTimeRange(nowMinutes, settings.dinnerStart, settings.dinnerEnd);

  if (lunchOpen) {
    return {
      isOpen: true,
      title: "Service du midi ouvert",
      subtitle: pendingTasksCount > 0 ? `${pendingTasksCount} action à traiter` : "Prêt à recevoir des commandes",
      detail: `Ouvert jusqu’à ${formatServiceTime(settings.lunchEnd)}.`,
    };
  }

  if (dinnerOpen) {
    return {
      isOpen: true,
      title: "Service du soir ouvert",
      subtitle: pendingTasksCount > 0 ? `${pendingTasksCount} action à traiter` : "Prêt à recevoir des commandes",
      detail: `Ouvert jusqu’à ${formatServiceTime(settings.dinnerEnd)}.`,
    };
  }

  return {
    isOpen: false,
    title: "Service fermé",
    subtitle: pendingTasksCount > 0 ? `${pendingTasksCount} action à terminer` : "Aucune action urgente",
    detail: serviceRanges ? `Prochains services : ${serviceRanges}` : "Aucun créneau configuré.",
  };
}

function getRestaurantStatusLabel(status: string) {
  return {
    trial: "Essai",
    active: "Actif",
    suspended: "Suspendu",
    archived: "Archivé",
  }[status] ?? status;
}

function getPlanLabel(plan: string) {
  return {
    trial: "Essai",
    standard: "Standard",
    premium: "Premium",
  }[plan] ?? plan;
}

function pluralize(value: number, singular: string, plural: string) {
  return value > 1 ? plural : singular;
}

export default function DashboardClient({ data }: { data: DashboardClientData }) {
  const serviceStatus = getServiceStatus(data.settings, data.tasks);

  return (
    <AppShell>
      <PageHeader title={data.restaurant.name} subtitle={data.restaurant.city ?? serviceStatus.title} />

      <SectionCard className="mb-7 flex items-center gap-5 border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-5 shadow-[0_18px_34px_rgba(0,111,56,0.12)] min-[390px]:p-6">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-900 text-white shadow-green min-[390px]:size-24">
          <Check className="size-12 min-[390px]:size-14" />
        </span>

        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-emerald-800 min-[390px]:text-3xl">
            {serviceStatus.title}
          </h2>

          <p className="mt-4 flex items-center gap-3 text-base leading-tight text-slate-700 min-[390px]:text-lg">
            <QrCode className="size-6 shrink-0 text-emerald-800" />
            <span>{serviceStatus.subtitle}</span>
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-700">{serviceStatus.detail}</p>

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Statut : {getRestaurantStatusLabel(data.restaurant.status)} · Offre : {getPlanLabel(data.restaurant.plan)}
          </p>

          {data.restaurant.email ? <p className="mt-1 text-sm text-slate-600">{data.restaurant.email}</p> : null}
          {data.restaurant.phone ? <p className="mt-1 text-sm text-slate-600">{data.restaurant.phone}</p> : null}

          {data.settings.onSitePaymentEnabled ? (
            <p className="mt-3 flex items-center gap-3 text-base leading-tight text-slate-700 min-[390px]:text-lg">
              <CreditCard className="size-6 shrink-0 text-emerald-800" />
              <span>Paiement sur place</span>
            </p>
          ) : null}
        </div>
      </SectionCard>

      <section className="mb-7">
        <h2 className="mb-4 text-2xl font-black tracking-tight">À faire maintenant</h2>

        <div className="grid gap-3">
          <ActionCard
            href="/dashboard/orders?filter=a-traiter"
            icon={ShoppingBasket}
            count={String(data.tasks.ordersToAccept)}
            title={`${pluralize(data.tasks.ordersToAccept, "commande à accepter", "commandes à accepter")}`}
            tone="orange"
          />

          <ActionCard
            href="/dashboard/orders?filter=a-traiter"
            icon={WalletCards}
            count={String(data.tasks.ordersToCollect)}
            title={`${pluralize(data.tasks.ordersToCollect, "commande à encaisser", "commandes à encaisser")}`}
          />

          <ActionCard
            href="/dashboard/reviews"
            icon={Star}
            count={String(data.tasks.reviewsToHandle)}
            title={`${pluralize(data.tasks.reviewsToHandle, "avis à traiter", "avis à traiter")}`}
            tone="yellow"
          />

          <ActionCard
            href="/dashboard/menu?filter=rupture"
            icon={PackageOpen}
            count={String(data.tasks.unavailableProducts)}
            title={`${pluralize(data.tasks.unavailableProducts, "produit indisponible", "produits indisponibles")}`}
            tone="red"
          />
        </div>
      </section>

      <section className="mb-6 md:mb-7">
        <h2 className="mb-3 text-2xl font-black tracking-tight min-[390px]:mb-4">Aujourd’hui</h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={ShoppingBasket}
            value={String(data.today.ordersCount)}
            label={`${pluralize(data.today.ordersCount, "commande", "commandes")}`}
          />

          <StatCard icon={CreditCard} value={data.today.estimatedSales} label="ventes estimées" />

          <StatCard
            icon={Star}
            value={data.today.averageRating}
            label={data.today.reviewsCount > 0 ? `${data.today.reviewsCount} avis aujourd’hui` : "avis clients"}
          />

          <StatCard
            icon={Table2}
            value={String(data.today.activeTablesCount)}
            label={`${pluralize(data.today.activeTablesCount, "QR actif", "QR actifs")}`}
          />
        </div>
      </section>

      <section className="pb-2">
        <h2 className="mb-3 text-2xl font-black tracking-tight min-[390px]:mb-4">Actions rapides</h2>

        <div className="grid grid-cols-3 gap-2 min-[390px]:gap-3">
          <ActionCard href="/dashboard/orders" icon={ClipboardList} title="Voir les commandes" variant="tile" />
          <ActionCard href="/dashboard/menu?action=add-product" icon={Plus} title="Ajouter un produit" variant="tile" />
          <ActionCard href="/dashboard/qr?action=print" icon={Printer} title="Imprimer les QR" variant="tile" />
        </div>
      </section>
    </AppShell>
  );
}