"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

type DbOrderStatus = "pending" | "accepted" | "preparing" | "ready" | "served" | "rejected" | "cancelled";

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

function mapUiStatusToDbStatus(status: OrderStatus): {
  status: DbOrderStatus;
  paymentStatus: string;
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

export async function updateDashboardOrderStatus(input: {
  orderId: string;
  nextStatus: OrderStatus;
}) {
  const { restaurant } = await getCurrentRestaurantContext();

  if (!ALLOWED_UI_STATUSES.includes(input.nextStatus)) {
    throw new Error("Statut de commande invalide.");
  }

  const supabase = await createClient();
  const mappedStatus = mapUiStatusToDbStatus(input.nextStatus);

  const { error } = await supabase
    .from("orders")
    .update({
      status: mappedStatus.status,
      payment_status: mappedStatus.paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    console.error("[dashboard/orders] status update failed", {
      restaurantId: restaurant.id,
      orderId: input.orderId,
      nextStatus: input.nextStatus,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Mise à jour de la commande impossible.");
  }

  revalidatePath("/dashboard/orders");

  return { ok: true };
}