import { Check, ChefHat, ClipboardList, Clock3, HandPlatter, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";

export type OrderFilter = "a-traiter" | "en-preparation" | "pretes" | "terminees";
export type OrderFilterSlug = OrderFilter | "a-encaisser";

export const orderFilters: { label: string; value: OrderFilter; emptyLabel: string }[] = [
  { label: "À traiter", value: "a-traiter", emptyLabel: "Aucune commande à traiter" },
  { label: "En préparation", value: "en-preparation", emptyLabel: "Aucune commande en préparation" },
  { label: "Prêtes", value: "pretes", emptyLabel: "Aucune commande prête" },
  { label: "Terminées", value: "terminees", emptyLabel: "Aucune commande terminée" },
];

const statusLabels = {
  new: "Nouvelle",
  accepted: "À payer",
  payment_pending: "À payer",
  paid: "Payée",
  preparing: "En préparation",
  ready: "Prête",
  served: "Terminée",
  refused: "Refusée",
} satisfies Record<OrderStatus, string>;

const statusBadgeTones = {
  new: "orange",
  accepted: "orange",
  payment_pending: "orange",
  paid: "green",
  preparing: "blue",
  ready: "green",
  served: "gray",
  refused: "red",
} satisfies Record<OrderStatus, "green" | "orange" | "blue" | "red" | "gray">;

const statusIconStyles = {
  new: "bg-orange-50 text-orange-600",
  accepted: "bg-orange-50 text-orange-600",
  payment_pending: "bg-orange-50 text-orange-600",
  paid: "bg-emerald-50 text-emerald-800",
  preparing: "bg-blue-50 text-blue-700",
  ready: "bg-emerald-50 text-emerald-800",
  served: "bg-slate-100 text-slate-600",
  refused: "bg-rose-50 text-rose-700",
} satisfies Record<OrderStatus, string>;

const statusIcons = {
  new: ClipboardList,
  accepted: Clock3,
  payment_pending: Clock3,
  paid: Check,
  preparing: ChefHat,
  ready: HandPlatter,
  served: Check,
  refused: X,
} satisfies Record<OrderStatus, LucideIcon>;

export function getOrderStatusLabel(status: OrderStatus) {
  return statusLabels[status];
}

export function getOrderStatusBadgeTone(status: OrderStatus) {
  return statusBadgeTones[status];
}

export function getOrderStatusIconStyle(status: OrderStatus) {
  return statusIconStyles[status];
}

export function getOrderStatusIcon(status: OrderStatus) {
  return statusIcons[status];
}

export function normalizeOrderFilterSlug(value: string | string[] | undefined): OrderFilter {
  const filterValue = Array.isArray(value) ? value[0] : value;

  if (filterValue === "a-encaisser") return "a-traiter";
  if (filterValue === "en-preparation" || filterValue === "pretes" || filterValue === "terminees") {
    return filterValue;
  }

  return "a-traiter";
}

export function orderMatchesFilter(order: Order, filter: OrderFilter) {
  switch (filter) {
    case "a-traiter":
      return ["new", "payment_pending", "paid"].includes(order.status);
    case "en-preparation":
      return order.status === "preparing";
    case "pretes":
      return order.status === "ready";
    case "terminees":
      return order.status === "served" || order.status === "refused";
  }
}

export function canStartOrderPreparation(order: Order) {
  return order.status === "paid" && (order.paid === true || order.paymentStatus === "paid");
}

export function getNextOrderStatus(order: Order): OrderStatus | null {
  switch (order.status) {
    case "new":
      return "payment_pending";
    case "accepted":
    case "payment_pending":
      return "paid";
    case "paid":
      return canStartOrderPreparation(order) ? "preparing" : null;
    case "preparing":
      return "ready";
    case "ready":
      return "served";
    case "served":
    case "refused":
      return null;
  }
}

export function getPrimaryOrderActionLabel(order: Order) {
  switch (order.status) {
    case "new":
      return "Accepter la commande";
    case "accepted":
    case "payment_pending":
      return "Marquer payée";
    case "paid":
      return canStartOrderPreparation(order) ? "Lancer la préparation" : null;
    case "preparing":
      return "Marquer prête";
    case "ready":
      return "Commande servie";
    case "served":
    case "refused":
      return null;
  }
}

export function applyOrderStatusTransition(order: Order, nextStatus: OrderStatus): Order {
  switch (nextStatus) {
    case "new":
      return {
        ...order,
        status: "new",
        paid: false,
        paymentStatus: "on_site_pending",
        paymentMethod: "on_site",
      };

    case "accepted":
    case "payment_pending":
      return {
        ...order,
        status: "payment_pending",
        paid: false,
        paymentStatus: "on_site_pending",
        paymentMethod: "on_site",
      };

    case "paid":
      return {
        ...order,
        status: "paid",
        paid: true,
        paymentStatus: "paid",
        paymentMethod: "on_site",
      };

    case "preparing":
      if (!canStartOrderPreparation(order)) return order;

      return {
        ...order,
        status: "preparing",
        paid: true,
        paymentStatus: "paid",
        paymentMethod: "on_site",
      };

    case "ready":
      return {
        ...order,
        status: "ready",
        paid: true,
        paymentStatus: "paid",
        paymentMethod: "on_site",
      };

    case "served":
      return {
        ...order,
        status: "served",
        paid: true,
        paymentStatus: "paid",
        paymentMethod: "on_site",
      };

    case "refused":
      return {
        ...order,
        status: "refused",
        paid: false,
        paymentStatus: "cancelled",
        paymentMethod: "on_site",
      };
  }
}

export function normalizeOrders(orders: Order[]) {
  return orders.map((order) => {
    const legacyStatus = order.status as OrderStatus | "to_accept";

    if (legacyStatus === "to_accept") {
      return {
        ...order,
        status: "new" as const,
        paid: false,
        paymentStatus: "on_site_pending" as const,
        paymentMethod: "on_site" as const,
      };
    }

    if (order.status === "refused") {
      return {
        ...order,
        paid: false,
        paymentStatus: order.paymentStatus ?? "cancelled",
        paymentMethod: order.paymentMethod ?? "on_site",
      };
    }

    if (order.status === "new") {
      return {
        ...order,
        paid: false,
        paymentStatus: order.paymentStatus ?? "on_site_pending",
        paymentMethod: order.paymentMethod ?? "on_site",
      };
    }

    if (order.status === "accepted" || order.status === "payment_pending") {
      return {
        ...order,
        status: "payment_pending" as const,
        paid: false,
        paymentStatus: "on_site_pending" as const,
        paymentMethod: order.paymentMethod ?? "on_site",
      };
    }

    if (order.status === "paid" || order.status === "preparing" || order.status === "ready" || order.status === "served") {
      return {
        ...order,
        paid: true,
        paymentStatus: "paid" as const,
        paymentMethod: order.paymentMethod ?? "on_site",
      };
    }

    return {
      ...order,
      serviceDate: order.serviceDate,
      serviceTime: order.serviceTime,
    };
  });
}

const shortMonthFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

function parseOrderDate(order: Order) {
  if (order.createdAt) {
    const parsedCreatedAt = new Date(order.createdAt);
    if (!Number.isNaN(parsedCreatedAt.getTime())) return parsedCreatedAt;
  }

  const explicitDate = order.createdDate ?? order.serviceDate;
  const explicitTime = order.createdTime ?? order.serviceTime;

  if (!explicitDate) return null;

  const dateText = explicitTime ? `${explicitDate}T${explicitTime}` : `${explicitDate}T00:00`;
  const parsed = new Date(dateText);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateLabel(target: Date, reference: Date) {
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const referenceMidnight = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()).getTime();
  const dayDiff = Math.round((targetMidnight - referenceMidnight) / 86_400_000);

  if (dayDiff === 0) return "Aujourd’hui";
  if (dayDiff === -1) return "Hier";

  return shortMonthFormatter.format(target).replace(".", "");
}

export function getOrderTimestampLabel(order: Order, now = new Date()) {
  if (order.timeLabel) return order.timeLabel;

  const orderDate = parseOrderDate(order);
  if (!orderDate) return null;

  const dateLabel = getDateLabel(orderDate, now);
  const timeLabel = orderDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dateLabel} • ${timeLabel}`;
}

export function isActiveOrderStatus(status: OrderStatus) {
  return status === "new" || status === "payment_pending" || status === "paid" || status === "preparing" || status === "ready";
}

export function getWaitingLabel(order: Order, now = new Date()) {
  const orderDate = parseOrderDate(order);
  if (!orderDate) return null;

  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - orderDate.getTime()) / 60_000));

  if (order.status === "preparing") return `En préparation depuis ${elapsedMinutes} min`;
  if (order.status === "new" || order.status === "payment_pending") return `À traiter depuis ${elapsedMinutes} min`;
  if (order.status === "paid" || order.status === "ready") return `Attente : ${elapsedMinutes} min`;

  return null;
}

export function getWaitingToneClass(minutes: number) {
  if (minutes >= 20) return "text-amber-700";
  if (minutes >= 10) return "text-amber-600";

  return "text-slate-500";
}

export function getElapsedMinutes(order: Order, now = new Date()) {
  const orderDate = parseOrderDate(order);
  if (!orderDate) return null;

  return Math.max(0, Math.floor((now.getTime() - orderDate.getTime()) / 60_000));
}
