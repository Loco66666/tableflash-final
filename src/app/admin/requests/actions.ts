"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import type { SubscriptionPlan } from "@/lib/supabase/types";

const PLAN_MAP: Record<string, SubscriptionPlan> = {
  "Essai gratuit": "trial",
  Standard: "standard",
  Premium: "premium",
};

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateTemporaryPassword() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);

  return `TableFlash-${randomPart}!`;
}

async function uniqueRestaurantSlug(baseName: string) {
  const supabase = await createClient();
  const base = slugify(baseName) || "restaurant";
  const candidate = `${base}-${Date.now().toString(36).slice(-6)}`;

  const { data } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("slug", candidate)
    .maybeSingle();

  if (!data) return candidate;
  return `${candidate}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function approveApplication(input: {
  applicationId: string;
  planLabel: "Essai gratuit" | "Standard" | "Premium";
  internalNote?: string;
  trialDays?: number;
}) {
  const { profile } = await requireRole(["super_admin"]);

  if (!hasSupabaseAdminEnv) {
    throw new Error("La clé serveur Supabase n’est pas configurée.");
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: application, error: appError } = await supabase
    .from("restaurant_applications")
    .select("*")
    .eq("id", input.applicationId)
    .single();

  if (appError || !application) {
    throw new Error("Demande introuvable");
  }

  if (application.status === "approved") {
    throw new Error("Cette demande a déjà été validée.");
  }

  const temporaryPassword = generateTemporaryPassword();

  const { data: createdUser, error: createUserError } =
    await adminSupabase.auth.admin.createUser({
      email: application.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: application.owner_name,
        restaurant_name: application.restaurant_name,
      },
    });

  if (createUserError || !createdUser.user) {
    throw new Error(
      createUserError?.message?.includes("already")
        ? "Un compte existe déjà avec cet email. Utilisez une autre demande ou réinitialisez ce compte depuis Supabase."
        : createUserError?.message || "Création du compte restaurateur impossible",
    );
  }

  const ownerUserId = createdUser.user.id;
  const plan = PLAN_MAP[input.planLabel] ?? "trial";
  const slug = await uniqueRestaurantSlug(application.restaurant_name);
  const trialEndsAt =
    plan === "trial"
      ? new Date(Date.now() + (input.trialDays ?? 14) * 86400000).toISOString()
      : null;

  const { error: profileError } = await adminSupabase.from("profiles").upsert({
    id: ownerUserId,
    email: application.email,
    full_name: application.owner_name,
    phone: application.phone,
    role: "restaurant_owner",
  });

  if (profileError) {
    throw new Error("Création du profil restaurateur impossible");
  }

  const { data: restaurant, error: restaurantError } = await adminSupabase
    .from("restaurants")
    .insert({
      owner_id: ownerUserId,
      name: application.restaurant_name,
      slug,
      status: "trial",
      city: application.city,
      phone: application.phone,
      email: application.email,
      cuisine_type: application.restaurant_type,
      plan,
      trial_ends_at: trialEndsAt,
    })
    .select("id,name")
    .single();

  if (restaurantError || !restaurant) {
    throw new Error("Création restaurant impossible");
  }

  const { error: memberError } = await adminSupabase
    .from("restaurant_members")
    .insert({
      restaurant_id: restaurant.id,
      user_id: ownerUserId,
      role: "restaurant_owner",
    });

  if (memberError) {
    throw new Error("Création du lien restaurateur impossible");
  }

  const { error: settingsError } = await adminSupabase
    .from("restaurant_settings")
    .insert({ restaurant_id: restaurant.id });

  if (settingsError) {
    throw new Error("Création paramètres impossible");
  }

  const { error: updateError } = await adminSupabase
    .from("restaurant_applications")
    .update({
      status: "approved",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      internal_note: input.internalNote?.trim() || null,
    })
    .eq("id", input.applicationId);

  if (updateError) {
    throw new Error("Mise à jour de la demande impossible");
  }

  await adminSupabase.from("admin_events").insert({
    actor_id: profile.id,
    restaurant_id: restaurant.id,
    event_type: "application_approved",
    message: `Demande approuvée pour ${application.restaurant_name}`,
    metadata: {
      application_id: input.applicationId,
      owner_user_id: ownerUserId,
    },
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/restaurants");

  return {
    ok: true,
    message: "Demande validée. Le compte restaurateur a été créé.",
    credentials: {
      email: application.email,
      temporaryPassword,
    },
  };
}

export async function rejectApplication(input: { applicationId: string; internalNote?: string }) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurant_applications")
    .update({
      status: "rejected",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      internal_note: input.internalNote?.trim() || null,
    })
    .eq("id", input.applicationId);

  if (error) throw new Error("Refus impossible");

  await supabase.from("admin_events").insert({
    actor_id: profile.id,
    event_type: "application_rejected",
    message: "Demande refusée",
    metadata: { application_id: input.applicationId },
  });

  revalidatePath("/admin/requests");
  return { ok: true };
}

export async function markApplicationNeedsFollowup(input: { applicationId: string; internalNote?: string }) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurant_applications")
    .update({
      status: "needs_followup",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      internal_note: input.internalNote?.trim() || null,
    })
    .eq("id", input.applicationId);

  if (error) throw new Error("Mise à jour impossible");

  revalidatePath("/admin/requests");
  return { ok: true };
}