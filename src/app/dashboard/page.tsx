"use client";

import { useEffect, useMemo, useState } from "react";
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
import { orders, products, reviews, tables } from "@/lib/data/seed";
import { getDashboardMetrics } from "@/lib/dashboardMetrics";
import { normalizeSettings, useSettingsStore } from "@/lib/local-store/settingsStore";
import type { RestaurantSettings } from "@/lib/types";

type ServiceState = {
  isOpen: boolean;
  headerLabel: string;
  cardTitle: string;
  cardDetail: string;
};

const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const loadingServiceState: ServiceState = {
  isOpen: false,
  headerLabel: "Chargement du service",
  cardTitle: "Chargement du service",
  cardDetail: "Vérification des horaires",
};

function timeToMinutes(time?: string) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isCurrentTimeInsideRange(currentMinutes: number, startTime?: string, endTime?: string) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return currentMinutes >= startMinutes && currentMinutes < endMinutes;

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

function formatServiceStart(time?: string) {
  return time ? time.replace(":", "h") : null;
}

function getNextServiceLabel(settings: RestaurantSettings) {
  const lunchStart = formatServiceStart(settings.hours.lunchStart);
  const dinnerStart = formatServiceStart(settings.hours.dinnerStart);

  if (lunchStart) return `Prochain service à ${lunchStart}`;
  if (dinnerStart) return `Prochain service à ${dinnerStart}`;
  return "Hors service";
}

function getServiceState(settings: RestaurantSettings, currentDate: Date | null): ServiceState {
  if (!currentDate) return loadingServiceState;

  if (!settings.hours.automaticMode) {
    return {
      isOpen: false,
      headerLabel: "Ouverture manuelle",
      cardTitle: "Ouverture manuelle",
      cardDetail: "Statut géré depuis vos réglages",
    };
  }

  const currentDay = dayLabels[currentDate.getDay()];
  const openDays = settings.hours.openDays ?? [];
  const isOpenDay = openDays.length === 0 || openDays.includes(currentDay);

  if (!isOpenDay) {
    return {
      isOpen: false,
      headerLabel: "Service fermé",
      cardTitle: "Service fermé",
      cardDetail: "Hors jour d’ouverture",
    };
  }

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  if (isCurrentTimeInsideRange(currentMinutes, settings.hours.lunchStart, settings.hours.lunchEnd)) {
    return {
      isOpen: true,
      headerLabel: "Service midi en cours",
      cardTitle: "Service ouvert",
      cardDetail: "Commandes QR actives",
    };
  }

  if (isCurrentTimeInsideRange(currentMinutes, settings.hours.dinnerStart, settings.hours.dinnerEnd)) {
    return {
      isOpen: true,
      headerLabel: "Service soir en cours",
      cardTitle: "Service ouvert",
      cardDetail: "Commandes QR actives",
    };
  }

  return {
    isOpen: false,
    headerLabel: "Service fermé",
    cardTitle: "Service fermé",
    cardDetail: getNextServiceLabel(settings),
  };
}

export default function DashboardPage() {
  const { value: storedSettings, hydrated } = useSettingsStore();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const settings = useMemo(() => normalizeSettings(storedSettings), [storedSettings]);
  const serviceState = useMemo(() => getServiceState(settings, hydrated ? currentDate : null), [settings, hydrated, currentDate]);
  const metrics = useMemo(
    () =>
      getDashboardMetrics({
        orders,
        products,
        reviews,
        settings: {
          ...settings,
          serviceOpen: serviceState.isOpen,
          serviceLabel: serviceState.headerLabel,
          onSitePaymentEnabled: settings.ordersSettings.onSitePaymentEnabled,
        },
        tables,
      }),
    [settings, serviceState],
  );

  useEffect(() => {
    if (!hydrated) return;

    const updateCurrentDate = () => setCurrentDate(new Date());
    const timeoutId = window.setTimeout(updateCurrentDate, 0);
    const intervalId = window.setInterval(updateCurrentDate, 60_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [hydrated]);

  return (
    <AppShell>
      <PageHeader title={settings.restaurantName} subtitle={serviceState.headerLabel} />

      <SectionCard className="mb-7 flex items-center gap-5 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-[0_18px_34px_rgba(0,111,56,0.12)] min-[390px]:p-6">
        <span className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 text-white shadow-green min-[390px]:size-24">
          <Check className="size-12 min-[390px]:size-14" />
        </span>
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-emerald-800 min-[390px]:text-3xl">
            {serviceState.cardTitle}
          </h2>
          <p className="mt-4 flex items-center gap-3 text-base leading-tight text-slate-700 min-[390px]:text-lg">
            <QrCode className="size-6 shrink-0 text-emerald-800" />
            <span>{serviceState.cardDetail}</span>
          </p>
          {metrics.service.onSitePaymentEnabled ? (
            <p className="mt-3 flex items-center gap-3 text-base leading-tight text-slate-700 min-[390px]:text-lg">
              <CreditCard className="size-6 shrink-0 text-emerald-800" />
              <span>Paiement sur place</span>
            </p>
          ) : null}
        </div>
      </SectionCard>

      <section className="mb-7">
        <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">À faire maintenant</h2>
        <div className="grid gap-3">
          <ActionCard
            href="/dashboard/orders?filter=a-traiter"
            icon={ShoppingBasket}
            count={String(metrics.tasks.ordersToAccept.count)}
            title={metrics.tasks.ordersToAccept.label}
            tone="orange"
          />
          <ActionCard
            href="/dashboard/orders?filter=a-encaisser"
            icon={WalletCards}
            count={String(metrics.tasks.ordersToCollect.count)}
            title={metrics.tasks.ordersToCollect.label}
          />
          <ActionCard
            href="/dashboard/reviews"
            icon={Star}
            count={String(metrics.tasks.reviewsToHandle.count)}
            title={metrics.tasks.reviewsToHandle.label}
            tone="yellow"
          />
          <ActionCard
            href="/dashboard/menu?filter=rupture"
            icon={PackageOpen}
            count={String(metrics.tasks.unavailableProducts.count)}
            title={metrics.tasks.unavailableProducts.label}
            tone="red"
          />
        </div>
      </section>

      <section className="mb-7">
        <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Aujourd’hui</h2>
        <div className="grid grid-cols-4 gap-2 min-[390px]:gap-3">
          <StatCard icon={ShoppingBasket} value={String(metrics.today.ordersCount)} label={metrics.today.ordersLabel} />
          <StatCard icon={CreditCard} value={metrics.today.estimatedSales} label="ventes estimées" />
          <StatCard icon={Star} value={metrics.today.averageRating} label="avis clients" />
          <StatCard icon={Table2} value={String(metrics.today.activeTablesCount)} label={metrics.today.activeTablesLabel} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-3">
          <ActionCard href="/dashboard/orders" icon={ClipboardList} title="Voir les commandes" variant="tile" />
          <ActionCard href="/dashboard/menu?action=add-product" icon={Plus} title="Ajouter un produit" variant="tile" />
          <ActionCard href="/dashboard/qr?action=print" icon={Printer} title="Imprimer les QR" variant="tile" />
        </div>
      </section>
    </AppShell>
  );
}
