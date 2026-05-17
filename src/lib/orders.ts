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
  served: "Servie",
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
  if (filterValue === "en-preparation" || filterValue === "pretes" || filterValue === "terminees") return filterValue;
  return "a-traiter";
}

export function orderMatchesFilter(order: Order, filter: OrderFilter) {
  switch (filter) {
    case "a-traiter":
      return ["new", "accepted", "payment_pending", "paid"].includes(order.status);
    case "en-preparation":
      return order.status === "preparing";
    case "pretes":
      return order.status === "ready";
    case "terminees":
      return order.status === "served" || order.status === "refused";
  }
}

export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case "new":
      return "payment_pending";
    case "accepted":
    case "payment_pending":
      return "paid";
    case "paid":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return "served";
    case "served":
    case "refused":
      return null;
  }
}

export function getPrimaryOrderActionLabel(status: OrderStatus) {
  switch (status) {
    case "new":
      return "Accepter";
    case "accepted":
    case "payment_pending":
      return "Marquer payée";
    case "paid":
      return "Lancer préparation";
    case "preparing":
      return "Marquer prête";
    case "ready":
      return "Servie";
    case "served":
    case "refused":
      return null;
  }
}

export function normalizeOrders(orders: Order[]) {
  return orders.map((order) => {
    const legacyStatus = order.status as OrderStatus | "to_accept";

    if (legacyStatus === "to_accept") {
      return { ...order, status: "new" as const, paid: false };
    }

    return {
      ...order,
      paid: order.status === "paid" || order.status === "preparing" || order.status === "ready" || order.status === "served" ? true : order.paid,
    };
  });
}
