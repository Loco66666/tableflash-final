"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";

type SettingsPayload = {
  lunch_enabled: boolean;
  lunch_start: string | null;
  lunch_end: string | null;
  dinner_enabled: boolean;
  dinner_start: string | null;
  dinner_end: string | null;
  orders_enabled: boolean;
  require_payment_before_preparation: boolean;
  qr_enabled: boolean;
  reviews_enabled: boolean;
};

type RestaurantPayload = {
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  cuisine_type: string | null;
  google_review_url: string | null;
  public_base_url: string | null;
  address: string | null;
  slug: string;
};

function cleanNullableText(value: string | null | undefined) {
  const trimmedValue = value?.trim() ?? "";

  return trimmedValue ? trimmedValue : null;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateRestaurantPayload(payload: RestaurantPayload) {
  const name = payload.name.trim();
  const slug = normalizeSlug(payload.slug);

  if (!name) {
    throw new Error("Le nom du restaurant est obligatoire.");
  }

  if (!slug) {
    throw new Error("Le slug public est obligatoire.");
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    throw new Error("Adresse email invalide.");
  }

  if (payload.google_review_url && !/^https?:\/\/.+\..+/.test(payload.google_review_url.trim())) {
    throw new Error("Lien Google Avis invalide.");
  }

  if (payload.public_base_url && !/^https?:\/\/.+\..+/.test(payload.public_base_url.trim())) {
    throw new Error("Lien du site web invalide.");
  }

  return {
    name,
    slug,
    city: cleanNullableText(payload.city),
    phone: cleanNullableText(payload.phone),
    email: cleanNullableText(payload.email),
    cuisine_type: cleanNullableText(payload.cuisine_type),
    google_review_url: cleanNullableText(payload.google_review_url),
    public_base_url: cleanNullableText(payload.public_base_url),
    address: cleanNullableText(payload.address),
  };
}

function validateTimePair(start: string | null, end: string | null, label: string) {
  if (Boolean(start) !== Boolean(end)) {
    throw new Error(`Renseignez le début et la fin du service ${label}.`);
  }
}

export async function updateRestaurantSettings(payload: SettingsPayload): Promise<void> {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  validateTimePair(payload.lunch_start, payload.lunch_end, "midi");
  validateTimePair(payload.dinner_start, payload.dinner_end, "soir");

  const nextPayload = {
    restaurant_id: restaurant.id,
    lunch_enabled: payload.lunch_enabled,
    lunch_start: payload.lunch_start,
    lunch_end: payload.lunch_end,
    dinner_enabled: payload.dinner_enabled,
    dinner_start: payload.dinner_start,
    dinner_end: payload.dinner_end,
    orders_enabled: payload.orders_enabled,
    require_payment_before_preparation: payload.require_payment_before_preparation,
    qr_enabled: payload.qr_enabled,
    reviews_enabled: payload.reviews_enabled,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("restaurant_settings").upsert(nextPayload, {
    onConflict: "restaurant_id",
  });

  if (error) {
    console.error("[dashboard/settings] settings update failed", {
      restaurantId: restaurant.id,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Sauvegarde des réglages impossible.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/qr");
  revalidatePath("/dashboard/reviews");
  revalidatePath("/dashboard/statistics");
}

export async function updateRestaurantProfile(payload: RestaurantPayload): Promise<void> {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const nextPayload = validateRestaurantPayload(payload);

  if (nextPayload.slug !== restaurant.slug) {
    const { data: existingRestaurant, error: existingError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", nextPayload.slug)
      .neq("id", restaurant.id)
      .maybeSingle();

    if (existingError) {
      console.error("[dashboard/settings] slug availability check failed", {
        restaurantId: restaurant.id,
        slug: nextPayload.slug,
        errorCode: existingError.code,
        errorMessage: existingError.message,
      });

      throw new Error("Vérification du slug impossible.");
    }

    if (existingRestaurant) {
      throw new Error("Ce slug public est déjà utilisé.");
    }
  }

  const { error } = await supabase
    .from("restaurants")
    .update({
      ...nextPayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", restaurant.id);

  if (error) {
    console.error("[dashboard/settings] restaurant update failed", {
      restaurantId: restaurant.id,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Sauvegarde du restaurant impossible.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/qr");
  revalidatePath("/dashboard/statistics");
}