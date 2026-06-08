import {
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  FileWarning,
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
    productsWithoutPrice: number;
    inactiveTables: number;
  };
  today: {
    ordersCount: number;
    estimatedSales: string;
    averageRating: string;
    reviewsCount: number;
    activeTablesCount: number;
    productsCount: number;
  };
  latest: {
    order: {
      label: string;
      detail: string;
      date: string;
    } | null;
    review: {
      label: string;
      detail: string;
      date: string;
    } | null;
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
  return (
    tasks.ordersToAccept +
    tasks.ordersToCollect +
    tasks.reviewsToHandle +
    tasks.unavailableProducts +
    tasks.productsWithoutPrice +
    tasks.inactiveTables
  );
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

function pluralize(value: number, singular: string, plural: string) {
  return value > 1 ? plural : singular;
}

export default function DashboardClient({ data }: { data: DashboardClientData }) {
  const serviceStatus = getServiceStatus(data.settings, data.tasks);
  const urgentOrdersCount = data.tasks.ordersToAccept + data.tasks.ordersToCollect;
  const beforeServiceIssuesCount = getPendingTasksCount(data.tasks);
  const hasIssues = beforeServiceIssuesCount > 0;
  const readinessTitle = hasIssues
    ? `${beforeServiceIssuesCount} vérification${beforeServiceIssuesCount > 1 ? "s" : ""} avant le service`
    : "Tout est prêt pour le service";
  const cockpitItems = [
    {
      icon: Bell,
      label: "Commandes",
      value: urgentOrdersCount > 0 ? `${urgentOrdersCount} à traiter` : "Aucune attente",
      ready: urgentOrdersCount === 0,
      href: "/dashboard/orders?filter=a-traiter",
    },
    {
      icon: PackageOpen,
      label: "Menu",
      value:
        data.today.productsCount > 0
          ? `${data.today.productsCount - data.tasks.unavailableProducts} plat${
              data.today.productsCount - data.tasks.unavailableProducts > 1 ? "s" : ""
            } visible${data.today.productsCount - data.tasks.unavailableProducts > 1 ? "s" : ""} sur ${
              data.today.productsCount
            }`
          : "Aucun plat",
      ready: data.today.productsCount > 0 && data.tasks.unavailableProducts === 0 && data.tasks.productsWithoutPrice === 0,
      href: "/dashboard/menu",
    },
    {
      icon: QrCode,
      label: "QR tables",
      value: data.settings.qrEnabled ? `${data.today.activeTablesCount} actifs` : "QR désactivés",
      ready: data.settings.qrEnabled && data.today.activeTablesCount > 0 && data.tasks.inactiveTables === 0,
      href: "/dashboard/qr",
    },
    {
      icon: Star,
      label: "Avis",
      value: data.tasks.reviewsToHandle > 0 ? `${data.tasks.reviewsToHandle} à répondre` : "À jour",
      ready: data.tasks.reviewsToHandle === 0,
      href: "/dashboard/reviews",
    },
  ];
  
  const todoItems = [
    {
      href: "/dashboard/orders?filter=a-traiter",
      icon: ShoppingBasket,
      count: data.tasks.ordersToAccept,
      title: pluralize(data.tasks.ordersToAccept, "commande à accepter", "commandes à accepter"),
      tone: "orange" as const,
    },
    {
      href: "/dashboard/orders?filter=a-traiter",
      icon: WalletCards,
      count: data.tasks.ordersToCollect,
      title: pluralize(data.tasks.ordersToCollect, "commande à encaisser", "commandes à encaisser"),
    },
    {
      href: "/dashboard/reviews",
      icon: Star,
      count: data.tasks.reviewsToHandle,
      title: pluralize(data.tasks.reviewsToHandle, "avis à traiter", "avis à traiter"),
      tone: "yellow" as const,
    },
    {
      href: "/dashboard/menu?filter=rupture",
      icon: PackageOpen,
      count: data.tasks.unavailableProducts,
      title: pluralize(data.tasks.unavailableProducts, "produit indisponible", "produits indisponibles"),
      tone: "red" as const,
    },
    {
      href: "/dashboard/menu",
      icon: FileWarning,
      count: data.tasks.productsWithoutPrice,
      title: pluralize(data.tasks.productsWithoutPrice, "produit sans prix", "produits sans prix"),
      tone: "red" as const,
    },
    {
      href: "/dashboard/qr",
      icon: QrCode,
      count: data.tasks.inactiveTables,
      title: pluralize(data.tasks.inactiveTables, "table QR inactive", "tables QR inactives"),
      tone: "orange" as const,
    },
  ];

  const pendingTodos = todoItems.filter((item) => item.count > 0);

  return (
    <AppShell>
      <PageHeader title={data.restaurant.name} subtitle={data.restaurant.city ?? serviceStatus.title} />

      <SectionCard className="mb-7 flex items-center gap-5 border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-5 shadow-[0_18px_34px_rgba(0,111,56,0.12)] min-[390px]:p-6">
        <span
          className={
            "grid size-20 shrink-0 place-items-center rounded-full shadow-green min-[390px]:size-24 " +
            (hasIssues ? "bg-orange-50 text-orange-700" : "bg-linear-to-br from-emerald-500 to-emerald-900 text-white")
          }
        >
          <Check className="size-12 min-[390px]:size-14" />
        </span>

        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-emerald-800 min-[390px]:text-3xl">
            {readinessTitle}
          </h2>

          <p className="mt-4 flex items-center gap-3 text-base leading-tight text-slate-700 min-[390px]:text-lg">
            <QrCode className="size-6 shrink-0 text-emerald-800" />
            <span>{serviceStatus.title} - {serviceStatus.subtitle}</span>
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-700">{serviceStatus.detail}</p>

          {data.settings.onSitePaymentEnabled ? (
            <p className="mt-3 flex items-center gap-3 text-base leading-tight text-slate-700 min-[390px]:text-lg">
              <CreditCard className="size-6 shrink-0 text-emerald-800" />
              <span>Paiement sur place</span>
            </p>
          ) : null}
        </div>
      </SectionCard>

      <section className="mb-7">
        <h2 className="mb-4 text-2xl font-black tracking-tight">Cockpit service</h2>

        <div className="grid gap-3 md:grid-cols-2">
          {cockpitItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href={item.href}
                className="flex min-h-20 items-center gap-4 rounded-[1.15rem] border border-slate-200 bg-white px-4 shadow-card transition active:scale-[0.99]"
              >
                <span
                  className={
                    "grid size-12 shrink-0 place-items-center rounded-full " +
                    (item.ready ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-600")
                  }
                >
                  <Icon className="size-7" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black uppercase tracking-wide text-slate-500">{item.label}</span>
                  <span className="block truncate text-lg font-semibold leading-tight text-slate-950">{item.value}</span>
                </span>

                <CheckCircle2
                  className={"size-6 shrink-0 " + (item.ready ? "text-emerald-700" : "text-orange-500")}
                />
              </a>
            );
          })}
        </div>
      </section>

      <section className="mb-7">
        <h2 className="mb-4 text-2xl font-black tracking-tight">À faire maintenant</h2>

        {pendingTodos.length > 0 ? (
          <div className="grid gap-3">
            {pendingTodos.map((item) => (
              <ActionCard
                key={item.title}
                href={item.href}
                icon={item.icon}
                count={String(item.count)}
                title={item.title}
                tone={item.tone}
              />
            ))}
          </div>
        ) : (
          <SectionCard className="p-4">
            <p className="text-base font-semibold text-slate-700">Tout est prêt. Aucune action urgente pour le moment.</p>
          </SectionCard>
        )}
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

      <section className="mb-7">
        <h2 className="mb-4 text-2xl font-black tracking-tight">Dernière activité</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <SectionCard className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-800">
                <ShoppingBasket className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wide text-slate-500">Dernière commande</p>
                {data.latest.order ? (
                  <>
                    <p className="mt-1 truncate text-lg font-black text-slate-950">{data.latest.order.label}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-600">{data.latest.order.detail}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{data.latest.order.date}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-slate-500">Aucune commande pour le moment</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600">
                <Star className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wide text-slate-500">Dernier avis</p>
                {data.latest.review ? (
                  <>
                    <p className="mt-1 truncate text-lg font-black text-slate-950">{data.latest.review.label}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">{data.latest.review.detail}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{data.latest.review.date}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-slate-500">Aucun avis pour le moment</p>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="pb-2">
        <h2 className="mb-3 text-2xl font-black tracking-tight min-[390px]:mb-4">Actions rapides</h2>

        <div className="grid grid-cols-2 gap-2 min-[390px]:gap-3 md:grid-cols-4">
          <ActionCard href="/dashboard/orders" icon={ClipboardList} title="Voir les commandes" variant="tile" />
          <ActionCard href="/dashboard/menu?action=import-photo" icon={Plus} title="Importer ma carte" variant="tile" />
          <ActionCard href="/dashboard/qr?action=print" icon={Printer} title="Gérer les QR" variant="tile" />
          <ActionCard href="/r/l-olivier" icon={Eye} title="Voir le menu client" variant="tile" />
        </div>
      </section>
    </AppShell>
  );
}
