"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    throw new Error("Donnée manquante.");
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Donnée manquante.");
  }

  return trimmedValue;
}

export async function saveReviewResponse(formData: FormData): Promise<void> {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const reviewId = getRequiredString(formData, "reviewId");
  const response = getRequiredString(formData, "response");

  const { error } = await supabase
    .from("restaurant_reviews")
    .update({
      response,
      response_saved: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    console.error("[dashboard/reviews] response update failed", {
      restaurantId: restaurant.id,
      reviewId,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Enregistrement de la réponse impossible.");
  }

  revalidatePath("/dashboard/reviews");
}

export async function archiveReview(formData: FormData): Promise<void> {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const reviewId = getRequiredString(formData, "reviewId");

  const { error } = await supabase
    .from("restaurant_reviews")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    console.error("[dashboard/reviews] archive failed", {
      restaurantId: restaurant.id,
      reviewId,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Archivage de l’avis impossible.");
  }

  revalidatePath("/dashboard/reviews");
}