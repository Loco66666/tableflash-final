"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";
import type { SubscriptionPlan } from "@/lib/supabase/types";

const PLAN_MAP: Record<string, SubscriptionPlan> = {
  "Essai gratuit": "trial",
  Standard: "standard",
  Premium: "premium",
};

type AdminEventInsert = Database["public"]["Tables"]["admin_events"]["Insert"];
type AdminEventMetadata = AdminEventInsert["metadata"];

type CreatedRestaurantRow = {
  id: string;
  name: string;
  slug: string;
};

function cleanId(value: string) {
  return value.trim();
}

function cleanOptionalText(value?: string | null) {
  const cleaned = value?.trim();

  return cleaned ? cleaned : null;
}

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("fr-FR");
}

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

function getTrialEndDate(days: number) {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 14;
  const date = new Date();

  date.setDate(date.getDate() + safeDays);

  return date.toISOString();
}

function generateTemporaryPassword() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 18);

  return `TableFlash-${randomPart}!`;
}

async function createUniqueRestaurantSlug(baseName: string) {
  const supabase = createAdminClient();
  const baseSlug = createSlugBase(baseName);

  let candidateSlug = baseSlug;
  let index = 2;

  while (true) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", candidateSlug)
      .maybeSingle();

    if (error) {
      console.error("[admin/requests] slug lookup failed", {
        slug: candidateSlug,
        errorCode: error.code,
        errorMessage: error.message,
      });

      throw new Error("Vérification du nom public impossible.");
    }

    if (!data) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${index}`;
    index += 1;
  }
}

async function insertAdminEvent(input: {
  actorId: string;
  eventType: string;
  message: string;
  restaurantId?: string | null;
  metadata?: AdminEventMetadata;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("admin_events").insert({
    actor_id: input.actorId,
    restaurant_id: input.restaurantId ?? null,
    event_type: input.eventType,
    message: input.message,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("[admin/requests] admin event insert failed", {
      eventType: input.eventType,
      restaurantId: input.restaurantId,
      errorCode: error.code,
      errorMessage: error.message,
    });
  }
}

async function cleanupFailedApproval(input: { ownerUserId?: string; restaurantId?: string }) {
  const supabase = createAdminClient();

  if (input.restaurantId) {
    await supabase.from("restaurant_settings").delete().eq("restaurant_id", input.restaurantId);
    await supabase.from("restaurant_members").delete().eq("restaurant_id", input.restaurantId);
    await supabase.from("restaurants").delete().eq("id", input.restaurantId);
  }

  if (input.ownerUserId) {
    await supabase.from("profiles").delete().eq("id", input.ownerUserId);
    await supabase.auth.admin.deleteUser(input.ownerUserId);
  }
}

export async function approveApplication(input: {
  applicationId: string;
  planLabel: "Essai gratuit" | "Standard" | "Premium";
  internalNote?: string;
  trialDays?: number;
}) {
  const { profile } = await requireRole(["super_admin"]);

  if (!hasSupabaseAdminEnv) {
    throw new Error("La clé serveur Supabase n'est pas configurée.");
  }

  const applicationId = cleanId(input.applicationId);

  if (!applicationId) {
    throw new Error("Demande introuvable.");
  }

  const adminSupabase = createAdminClient();

  const { data: application, error: appError } = await adminSupabase
    .from("restaurant_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    throw new Error("Demande introuvable.");
  }

  if (application.status === "approved") {
    throw new Error("Cette demande a déjà été validée.");
  }

  if (application.status === "rejected") {
    throw new Error("Cette demande a déjà été refusée.");
  }

  const ownerEmail = normalizeEmail(application.email);
  const ownerName = application.owner_name?.trim() || "Restaurateur";
  const restaurantName = application.restaurant_name?.trim();

  if (!ownerEmail || !ownerEmail.includes("@")) {
    throw new Error("L'email de la demande est invalide.");
  }

  if (!restaurantName) {
    throw new Error("Le nom du restaurant est obligatoire.");
  }

  const temporaryPassword = generateTemporaryPassword();

  const { data: createdUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
    email: ownerEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: ownerName,
      restaurant_name: restaurantName,
    },
  });

  if (createUserError || !createdUser.user) {
    throw new Error(
      createUserError?.message?.toLocaleLowerCase("fr-FR").includes("already")
        ? "Un compte existe déjà avec cet email. Utilisez une autre demande ou réinitialisez ce compte depuis Supabase."
        : createUserError?.message || "Création du compte restaurateur impossible.",
    );
  }

  const ownerUserId = createdUser.user.id;
  let restaurantId: string | undefined;

  try {
    const plan = PLAN_MAP[input.planLabel] ?? "trial";
    const slug = await createUniqueRestaurantSlug(restaurantName);
    const trialEndsAt = plan === "trial" ? getTrialEndDate(input.trialDays ?? 14) : null;

    const { error: profileError } = await adminSupabase.from("profiles").upsert({
      id: ownerUserId,
      email: ownerEmail,
      full_name: ownerName,
      phone: cleanOptionalText(application.phone),
      role: "restaurant_owner",
    });

    if (profileError) {
      console.error("[admin/requests] profile creation failed", {
        ownerUserId,
        ownerEmail,
        errorCode: profileError.code,
        errorMessage: profileError.message,
      });

      throw new Error("Création du profil restaurateur impossible.");
    }

    const { data: restaurant, error: restaurantError } = await adminSupabase
      .from("restaurants")
      .insert({
        owner_id: ownerUserId,
        name: restaurantName,
        slug,
        status: "trial",
        city: cleanOptionalText(application.city),
        phone: cleanOptionalText(application.phone),
        email: ownerEmail,
        cuisine_type: cleanOptionalText(application.restaurant_type),
        plan,
        trial_ends_at: trialEndsAt,
      })
      .select("id, name, slug")
      .returns<CreatedRestaurantRow[]>()
      .single();

    if (restaurantError || !restaurant) {
      console.error("[admin/requests] restaurant creation failed", {
        ownerUserId,
        ownerEmail,
        slug,
        errorCode: restaurantError?.code,
        errorMessage: restaurantError?.message,
      });

      throw new Error("Création du restaurant impossible.");
    }

    restaurantId = restaurant.id;

    const { error: memberError } = await adminSupabase.from("restaurant_members").insert({
      restaurant_id: restaurant.id,
      user_id: ownerUserId,
      role: "restaurant_owner",
    });

    if (memberError) {
      console.error("[admin/requests] member creation failed", {
        restaurantId: restaurant.id,
        ownerUserId,
        errorCode: memberError.code,
        errorMessage: memberError.message,
      });

      throw new Error("Création du lien restaurateur impossible.");
    }

    const { error: settingsError } = await adminSupabase.from("restaurant_settings").insert({
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
      console.error("[admin/requests] settings creation failed", {
        restaurantId: restaurant.id,
        errorCode: settingsError.code,
        errorMessage: settingsError.message,
      });

      throw new Error("Création des paramètres restaurant impossible.");
    }

    const { error: updateError } = await adminSupabase
      .from("restaurant_applications")
      .update({
        status: "approved",
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        internal_note: cleanOptionalText(input.internalNote),
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("[admin/requests] application update failed", {
        applicationId,
        restaurantId: restaurant.id,
        errorCode: updateError.code,
        errorMessage: updateError.message,
      });

      throw new Error("Mise à jour de la demande impossible.");
    }

    await insertAdminEvent({
      actorId: profile.id,
      restaurantId: restaurant.id,
      eventType: "application_approved",
      message: `Demande approuvée pour ${restaurantName}`,
      metadata: {
        application_id: applicationId,
        owner_user_id: ownerUserId,
        restaurant_slug: restaurant.slug,
        plan,
      },
    });

    revalidatePath("/admin/requests");
    revalidatePath("/admin/restaurants");
    revalidatePath(`/admin/restaurants/${restaurant.id}`);

    return {
      ok: true,
      message: "Demande validée. Le compte restaurateur a été créé.",
      credentials: {
        email: ownerEmail,
        temporaryPassword,
      },
    };
  } catch (error) {
    await cleanupFailedApproval({ ownerUserId, restaurantId });

    throw error;
  }
}

export async function rejectApplication(input: { applicationId: string; internalNote?: string }) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();

  const applicationId = cleanId(input.applicationId);

  if (!applicationId) {
    throw new Error("Demande introuvable.");
  }

  const { error } = await supabase
    .from("restaurant_applications")
    .update({
      status: "rejected",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      internal_note: cleanOptionalText(input.internalNote),
    })
    .eq("id", applicationId);

  if (error) {
    throw new Error("Refus impossible.");
  }

  await insertAdminEvent({
    actorId: profile.id,
    eventType: "application_rejected",
    message: "Demande refusée.",
    metadata: { application_id: applicationId },
  });

  revalidatePath("/admin/requests");

  return { ok: true };
}

export async function markApplicationNeedsFollowup(input: { applicationId: string; internalNote?: string }) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();

  const applicationId = cleanId(input.applicationId);

  if (!applicationId) {
    throw new Error("Demande introuvable.");
  }

  const { error } = await supabase
    .from("restaurant_applications")
    .update({
      status: "needs_followup",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      internal_note: cleanOptionalText(input.internalNote),
    })
    .eq("id", applicationId);

  if (error) {
    throw new Error("Mise à jour impossible.");
  }

  await insertAdminEvent({
    actorId: profile.id,
    eventType: "application_needs_followup",
    message: "Demande marquée à relancer.",
    metadata: { application_id: applicationId },
  });

  revalidatePath("/admin/requests");

  return { ok: true };
}