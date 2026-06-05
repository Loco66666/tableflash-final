"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Download, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { OrderCard } from "@/components/ui-custom/OrderCard";
import { updateDashboardOrderStatus } from "@/app/dashboard/orders/actions";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  applyOrderStatusTransition,
  normalizeOrders,
  orderFilters,
  orderMatchesFilter,
  type OrderFilter,
} from "@/lib/orders";

const ORDER_SOUND_STORAGE_KEY = "tableflash:orders-sound";
const SEEN_ORDER_IDS_STORAGE_KEY = "tableflash:seen-order-alerts";
const ORDERS_REFRESH_INTERVAL_MS = 18_000;
const ORDERS_FOCUS_REFRESH_MIN_DELAY_MS = 8_000;

function readSeenOrderIds() {
  try {
    const rawValue = window.localStorage.getItem(SEEN_ORDER_IDS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return new Set(Array.isArray(parsedValue) ? parsedValue.filter((value) => typeof value === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function saveSeenOrderIds(orderIds: Set<string>) {
  window.localStorage.setItem(SEEN_ORDER_IDS_STORAGE_KEY, JSON.stringify([...orderIds].slice(-80)));
}

async function playOrderSound() {
  const AudioContextConstructor =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) return;

  const audioContext = new AudioContextConstructor();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  [0, 0.42, 0.84].forEach((offset) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startAt = audioContext.currentTime + offset;

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1046, startAt);
    oscillator.frequency.setValueAtTime(784, startAt + 0.14);
    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.55, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.32);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.34);
  });

  window.setTimeout(() => void audioContext.close(), 1_500);
}

function showBrowserNotification(title: string, customerName?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  new Notification(title, {
    body: customerName ? `Client : ${customerName}` : "Une commande vient d'arriver.",
    tag: "tableflash-new-order",
  });
}

export function OrdersBoard({
  initialFilter,
  initialOrders,
}: {
  initialFilter: OrderFilter;
  initialOrders: Order[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>(initialFilter);
  const [orders, setOrders] = useState<Order[]>(() => normalizeOrders(initialOrders));
  const [actionError, setActionError] = useState("");
  const [exportPeriod, setExportPeriod] = useState("today");
  const [lastRefreshLabel, setLastRefreshLabel] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(ORDER_SOUND_STORAGE_KEY) === "enabled",
  );
  const [incomingAlert, setIncomingAlert] = useState("");
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const lastRefreshAtRef = useRef(0);
  const refreshInFlightRef = useRef(false);

  const visibleOrders = useMemo(
    () => orders.filter((order) => orderMatchesFilter(order, activeFilter)),
    [orders, activeFilter],
  );

  const emptyLabel = orderFilters.find((filter) => filter.value === activeFilter)?.emptyLabel ?? "Aucune commande";
  const exportHref = `/dashboard/orders/export?period=${exportPeriod}`;

  useEffect(() => {
    const refreshOrders = (force = false) => {
      if (!force && document.visibilityState !== "visible") return;
      if (refreshInFlightRef.current) return;

      const now = Date.now();
      if (!force && now - lastRefreshAtRef.current < ORDERS_FOCUS_REFRESH_MIN_DELAY_MS) return;

      refreshInFlightRef.current = true;
      lastRefreshAtRef.current = now;

      startTransition(() => {
        router.refresh();
        setLastRefreshLabel(
          new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        window.setTimeout(() => {
          refreshInFlightRef.current = false;
        }, 1_500);
      });
    };

    const refreshOnFocus = () => refreshOrders(false);
    const refreshOnVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshOrders(true);
      }
    };

    const timer = window.setInterval(() => refreshOrders(false), ORDERS_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibility);
    };
  }, [router, startTransition]);

  useEffect(() => {
    const normalizedOrders = normalizeOrders(initialOrders);
    const nextOrderIds = new Set(normalizedOrders.map((order) => order.id));
    const previousOrderIds = knownOrderIdsRef.current;
    const seenOrderIds = readSeenOrderIds();

    const newActiveOrders = normalizedOrders.filter((order) => {
      const isActive = ["new", "payment_pending", "paid"].includes(order.status);
      const wasAlreadyInThisTab = previousOrderIds?.has(order.id) ?? false;
      const wasAlreadyAlerted = seenOrderIds.has(order.id);

      return isActive && !wasAlreadyInThisTab && !wasAlreadyAlerted;
    });

    if (newActiveOrders.length > 0) {
      const latestOrder = newActiveOrders[0];
      const label = latestOrder.orderNumber ? `Commande n°${latestOrder.orderNumber}` : "Nouvelle commande";

      setIncomingAlert(`${label} à traiter`);

      for (const order of newActiveOrders) {
        seenOrderIds.add(order.id);
      }

      saveSeenOrderIds(seenOrderIds);

      if (notificationsEnabled) {
        void playOrderSound();
        showBrowserNotification(label, latestOrder.customerName);
      }
    }

    knownOrderIdsRef.current = nextOrderIds;

    const timer = window.setTimeout(() => setOrders(normalizedOrders), 0);

    return () => window.clearTimeout(timer);
  }, [initialOrders, notificationsEnabled]);

  async function enableNotifications() {
    window.localStorage.setItem(ORDER_SOUND_STORAGE_KEY, "enabled");
    setNotificationsEnabled(true);
    await playOrderSound();

    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  function disableNotifications() {
    window.localStorage.removeItem(ORDER_SOUND_STORAGE_KEY);
    setNotificationsEnabled(false);
  }

  function selectFilter(nextFilter: OrderFilter) {
    setActiveFilter(nextFilter);
    router.replace(`/dashboard/orders?filter=${nextFilter}`, { scroll: false });
  }

  function refreshNow() {
    refreshInFlightRef.current = true;
    lastRefreshAtRef.current = Date.now();

    startTransition(() => {
      router.refresh();
      setLastRefreshLabel(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      window.setTimeout(() => {
        refreshInFlightRef.current = false;
      }, 1_500);
    });
  }

  function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
    const previousOrders = orders;
    const shouldMoveToClosedFilter = nextStatus === "served" || nextStatus === "refused";

    setOrders((currentOrders) =>
      normalizeOrders(currentOrders).map((order) =>
        order.id === orderId ? applyOrderStatusTransition(order, nextStatus) : order,
      ),
    );

    if (shouldMoveToClosedFilter) {
      setActiveFilter("terminees");
    }

    startTransition(async () => {
      try {
        setActionError("");

        await updateDashboardOrderStatus({
          orderId,
          nextStatus,
        });

        if (shouldMoveToClosedFilter) {
          router.replace("/dashboard/orders?filter=terminees", { scroll: false });
        }

        router.refresh();
      } catch (error) {
        setOrders(previousOrders);
        setActionError(error instanceof Error ? error.message : "Mise à jour impossible.");
      }
    });
  }

  function refuseOrder(orderId: string) {
    updateOrderStatus(orderId, "refused");
  }

  return (
    <>
      {actionError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {actionError}
        </div>
      ) : null}

      {incomingAlert ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800">
          <Bell className="size-5 shrink-0" />
          <span className="min-w-0 flex-1">{incomingAlert}</span>
          <button type="button" onClick={() => setIncomingAlert("")} className="text-xs font-black text-orange-900">
            OK
          </button>
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card min-[430px]:grid-cols-[1fr_auto] min-[430px]:items-center">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select
            value={exportPeriod}
            onChange={(event) => setExportPeriod(event.target.value)}
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            aria-label="Période d'export"
          >
            <option value="today">Aujourd&apos;hui</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>

          <a
            href={exportHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white shadow-green transition active:scale-[0.99]"
          >
            <Download className="size-5" />
            CSV
          </a>
        </div>

        <div className="flex items-center justify-between gap-3 min-[430px]:justify-end">
          <span className="min-w-0 text-xs font-semibold text-slate-500">
            {lastRefreshLabel ? `Mis à jour ${lastRefreshLabel}` : "Actualisation active"}
            {!notificationsEnabled ? " · activez le son avant service" : ""}
          </span>

          <button
            type="button"
            onClick={notificationsEnabled ? disableNotifications : enableNotifications}
            className={cn(
              "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition active:scale-[0.99]",
              notificationsEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 text-slate-700",
            )}
            aria-label={notificationsEnabled ? "Couper le son des commandes" : "Activer le son des commandes"}
            title={notificationsEnabled ? "Son commandes actif" : "Activer le son commandes"}
          >
            {notificationsEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            <span className="hidden sm:inline">{notificationsEnabled ? "Alertes ON" : "Alertes OFF"}</span>
          </button>

          <button
            type="button"
            onClick={refreshNow}
            disabled={isPending}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-700 transition active:scale-[0.99] disabled:opacity-60"
            aria-label="Actualiser les commandes"
            title="Actualiser"
          >
            <RefreshCw className={`size-5 ${isPending ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mb-6 -mx-1 overflow-x-auto px-1 pb-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full gap-2 rounded-[1.2rem] border border-slate-200 bg-white p-1.5 shadow-card min-[430px]:grid min-[430px]:grid-cols-4">
          {orderFilters.map((filter) => {
            const active = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => selectFilter(filter.value)}
                disabled={isPending}
                className={cn(
                  "min-h-12 min-w-36 shrink-0 rounded-2xl px-3 text-sm font-semibold whitespace-nowrap transition min-[390px]:text-base min-[430px]:min-w-0 disabled:opacity-60",
                  active ? "bg-emerald-700 text-white shadow-green" : "text-slate-700 active:bg-emerald-50",
                )}
                aria-pressed={active}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {visibleOrders.length > 0 ? (
        <div className="grid gap-5">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              statusChangeAction={updateOrderStatus}
              refuseAction={refuseOrder}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-card">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-emerald-900">{emptyLabel}</h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">
            Les prochaines commandes apparaîtront ici pendant le service.
          </p>
        </section>
      )}
    </>
  );
}
