"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

type DbOrderStatus = "pending" | "accepted" | "preparing" | "ready" | "served" | "rejected" | "cancelled";
type DbPaymentStatus = "unpaid" | "paid" | "cancelled";

const ALLOWED_UI_STATUSES: readonly OrderStatus[] = [
  "new",
  "accepted",
  "payment_pending",
  "paid",
  "preparing",
  "ready",
  "served",
  "refused",
];

function cleanId(value: string) {
  return value.trim();
}

function mapUiStatusToDbStatus(status: OrderStatus): {
  status: DbOrderStatus;
  paymentStatus: DbPaymentStatus;
} {
  switch (status) {
    case "new":
      return { status: "pending", paymentStatus: "unpaid" };
    case "accepted":
    case "payment_pending":
      return { status: "accepted", paymentStatus: "unpaid" };
    case "paid":
      return { status: "accepted", paymentStatus: "paid" };
    case "preparing":
      return { status: "preparing", paymentStatus: "paid" };
    case "ready":
      return { status: "ready", paymentStatus: "paid" };
    case "served":
      return { status: "served", paymentStatus: "paid" };
    case "refused":
      return { status: "rejected", paymentStatus: "cancelled" };
  }
}

async function getRestaurantOrderOrThrow(orderId: string, restaurantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Commande introuvable.");
  }

  return data;
}

export async function updateDashboardOrderStatus(input: {
  orderId: string;
  nextStatus: OrderStatus;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const orderId = cleanId(input.orderId);

  if (!orderId) {
    throw new Error("Commande introuvable.");
  }

  if (!ALLOWED_UI_STATUSES.includes(input.nextStatus)) {
    throw new Error("Statut de commande invalide.");
  }

  await getRestaurantOrderOrThrow(orderId, restaurant.id);

  const mappedStatus = mapUiStatusToDbStatus(input.nextStatus);

  const { error } = await supabase
    .from("orders")
    .update({
      status: mappedStatus.status,
      payment_status: mappedStatus.paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    console.error("[dashboard/orders] status update failed", {
      restaurantId: restaurant.id,
      orderId,
      nextStatus: input.nextStatus,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Mise à jour de la commande impossible.");
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/r/${restaurant.slug}`);

  return { ok: true };
}