"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RestaurantStatus } from "@/lib/supabase/types";

async function updateRestaurantStatus(restaurantId: string, status: RestaurantStatus) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("restaurants")
    .update({ status })
    .eq("id", restaurantId);

  if (error) {
    console.error("[admin/restaurants] status update failed", {
      restaurantId,
      status,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Mise à jour du statut impossible");
  }

  await supabase.from("admin_events").insert({
    actor_id: profile.id,
    restaurant_id: restaurantId,
    event_type: "restaurant_status_updated",
    message: `Statut restaurant mis à jour: ${status}`,
    metadata: { status },
  });

  revalidatePath("/admin/restaurants");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
}

export async function suspendRestaurant(input: { restaurantId: string }) {
  await updateRestaurantStatus(input.restaurantId, "suspended");
  return { ok: true };
}

export async function reactivateRestaurant(input: { restaurantId: string }) {
  await updateRestaurantStatus(input.restaurantId, "active");
  return { ok: true };
}