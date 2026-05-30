"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RestaurantStatus, SubscriptionPlan } from "@/lib/supabase/types";

type CreateRestaurantWithOwnerInput = {
  restaurantName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerFullName?: string;
  city?: string;
  address?: string;
  phone?: string;
  cuisineType?: string;
  plan?: SubscriptionPlan;
  status?: RestaurantStatus;
  trialDays?: number;
  googleReviewUrl?: string;
  createDefaultTables?: boolean;
};

type CreatedRestaurantRow = {
  id: string;
  slug: string;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function createSlugBase(value: string) {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "restaurant";
}

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("fr-FR");
}

function cleanOptionalText(value: string | undefined) {
  const cleaned = value?.trim();

  return cleaned ? cleaned : null;
}

function getTrialEndDate(days: number) {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 14;
  const date = new Date();

  date.setDate(date.getDate() + safeDays);

  return date.toISOString();
}

async function createUniqueRestaurantSlug(name: string) {
  const supabase = createAdminClient();
  const baseSlug = createSlugBase(name);

  const { data, error } = await supabase.from("restaurants").select("slug").returns<{ slug: string }[]>();

  if (error) {
    console.error("[admin/restaurants] slug lookup failed", {
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Vérification du nom public impossible.");
  }

  const existingSlugs = new Set((data ?? []).map((restaurant) => restaurant.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;

  while (existingSlugs.has(`${baseSlug}-${index}`)) {
    index += 1;
  }

  return `${baseSlug}-${index}`;
}

async function updateRestaurantStatus(restaurantId: string, status: RestaurantStatus) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("restaurants")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", restaurantId);

  if (error) {
    console.error("[admin/restaurants] status update failed", {
      restaurantId,
      status,
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Mise à jour du statut impossible.");
  }

  await supabase.from("admin_events").insert({
    actor_id: profile.id,
    restaurant_id: restaurantId,
    event_type: "restaurant_status_updated",
    message: `Statut restaurant mis à jour : ${status}`,
    metadata: { status },
  });

  revalidatePath("/admin/restaurants");
  revalidatePath(`/admin/restaurants/${restaurantId}`);
}

export async function createRestaurantWithOwner(input: CreateRestaurantWithOwnerInput) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();

  const restaurantName = input.restaurantName.trim();
  const ownerEmail = normalizeEmail(input.ownerEmail);
  const ownerPassword = input.ownerPassword.trim();
  const ownerFullName = input.ownerFullName?.trim() || "Restaurateur";

  const status = input.status ?? "trial";
  const plan = input.plan ?? "trial";
  const trialDays = input.trialDays ?? 14;
  const shouldCreateDefaultTables = input.createDefaultTables ?? true;

  if (!restaurantName) {
    throw new Error("Le nom du restaurant est obligatoire.");
  }

  if (!ownerEmail || !ownerEmail.includes("@")) {
    throw new Error("L’email du restaurateur est invalide.");
  }

  if (ownerPassword.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  const slug = await createUniqueRestaurantSlug(restaurantName);

  const { data: createdUser, error: authError } = await supabase.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: {
      full_name: ownerFullName,
      restaurant_name: restaurantName,
    },
  });

  if (authError || !createdUser.user) {
    console.error("[admin/restaurants] auth user creation failed", {
      ownerEmail,
      errorMessage: authError?.message,
    });

    if (authError?.message?.toLocaleLowerCase("fr-FR").includes("already")) {
      throw new Error("Un compte existe déjà avec cet email.");
    }

    throw new Error("Création du compte restaurateur impossible.");
  }

  const ownerId = createdUser.user.id;

  try {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: ownerId,
      email: ownerEmail,
      full_name: ownerFullName,
      phone: cleanOptionalText(input.phone),
      role: "restaurant_owner",
    });

    if (profileError) {
      console.error("[admin/restaurants] profile creation failed", {
        ownerId,
        ownerEmail,
        errorCode: profileError.code,
        errorMessage: profileError.message,
      });

      throw new Error("Création du profil restaurateur impossible.");
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .insert({
        name: restaurantName,
        slug,
        status,
        owner_id: ownerId,
        city: cleanOptionalText(input.city),
        address: cleanOptionalText(input.address),
        phone: cleanOptionalText(input.phone),
        email: ownerEmail,
        cuisine_type: cleanOptionalText(input.cuisineType),
        plan,
        trial_ends_at: status === "trial" ? getTrialEndDate(trialDays) : null,
        google_review_url: cleanOptionalText(input.googleReviewUrl),
      })
      .select("id, slug")
      .returns<CreatedRestaurantRow[]>()
      .single();

    if (restaurantError || !restaurant) {
      console.error("[admin/restaurants] restaurant creation failed", {
        ownerId,
        ownerEmail,
        slug,
        errorCode: restaurantError?.code,
        errorMessage: restaurantError?.message,
      });

      throw new Error("Création du restaurant impossible.");
    }

    const { error: settingsError } = await supabase.from("restaurant_settings").insert({
      restaurant_id: restaurant.id,
      lunch_enabled: true,
      lunch_start: "11:30:00",
      lunch_end: "14:30:00",
      dinner_enabled: true,
      dinner_start: "18:30:00",
      dinner_end: "23:00:00",
      orders_enabled: true,
      require_payment_before_preparation: true,
      qr_enabled: true,
      reviews_enabled: true,
    });

    if (settingsError) {
      console.error("[admin/restaurants] settings creation failed", {
        restaurantId: restaurant.id,
        errorCode: settingsError.code,
        errorMessage: settingsError.message,
      });

      throw new Error("Création des réglages restaurant impossible.");
    }

    if (shouldCreateDefaultTables) {
      const { error: tablesError } = await supabase.from("restaurant_tables").insert([
        {
          restaurant_id: restaurant.id,
          name: "Table 1",
          slug: "table-1",
          zone: "Salle",
          is_active: true,
          scans_count: 0,
        },
        {
          restaurant_id: restaurant.id,
          name: "Table 2",
          slug: "table-2",
          zone: "Salle",
          is_active: true,
          scans_count: 0,
        },
      ]);

      if (tablesError) {
        console.error("[admin/restaurants] default tables creation failed", {
          restaurantId: restaurant.id,
          errorCode: tablesError.code,
          errorMessage: tablesError.message,
        });

        throw new Error("Création des tables par défaut impossible.");
      }
    }

    await supabase.from("admin_events").insert({
      actor_id: profile.id,
      restaurant_id: restaurant.id,
      event_type: "restaurant_created",
      message: `Restaurant créé : ${restaurantName}`,
      metadata: {
        restaurant_name: restaurantName,
        restaurant_slug: restaurant.slug,
        owner_id: ownerId,
        owner_email: ownerEmail,
        status,
        plan,
      },
    });

    revalidatePath("/admin/restaurants");
    revalidatePath(`/admin/restaurants/${restaurant.id}`);

    return {
      ok: true,
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      ownerId,
    };
  } catch (error) {
    await supabase.auth.admin.deleteUser(ownerId);

    throw error;
  }
}

export async function suspendRestaurant(input: { restaurantId: string }) {
  await updateRestaurantStatus(input.restaurantId, "suspended");

  return { ok: true };
}

export async function reactivateRestaurant(input: { restaurantId: string }) {
  await updateRestaurantStatus(input.restaurantId, "active");

  return { ok: true };
}