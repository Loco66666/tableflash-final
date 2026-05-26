"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const { data: application, error: appError } = await supabase
    .from("restaurant_applications")
    .select("*")
    .eq("id", input.applicationId)
    .single();

  if (appError || !application) throw new Error("Demande introuvable");

  const plan = PLAN_MAP[input.planLabel] ?? "trial";
  const slug = await uniqueRestaurantSlug(application.restaurant_name);
  const trialEndsAt = plan === "trial" ? new Date(Date.now() + (input.trialDays ?? 14) * 86400000).toISOString() : null;

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .insert({
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

  if (restaurantError || !restaurant) throw new Error("Création restaurant impossible");

  const { error: settingsError } = await supabase.from("restaurant_settings").insert({ restaurant_id: restaurant.id });
  if (settingsError) throw new Error("Création paramètres impossible");

  const { error: updateError } = await supabase
    .from("restaurant_applications")
    .update({
      status: "approved",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      internal_note: input.internalNote?.trim() || null,
    })
    .eq("id", input.applicationId);

  if (updateError) throw new Error("Mise à jour de la demande impossible");

  await supabase.from("admin_events").insert({
    actor_id: profile.id,
    restaurant_id: restaurant.id,
    event_type: "application_approved",
    message: `Demande approuvée pour ${application.restaurant_name}`,
    metadata: { application_id: input.applicationId },
  });

  revalidatePath("/admin/requests");
  return { ok: true, message: "Demande validée. Le restaurant a été créé." };
}

export async function rejectApplication(input: { applicationId: string; internalNote?: string }) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurant_applications")
    .update({ status: "rejected", reviewed_by: profile.id, reviewed_at: new Date().toISOString(), internal_note: input.internalNote?.trim() || null })
    .eq("id", input.applicationId);

  if (error) throw new Error("Refus impossible");

  await supabase.from("admin_events").insert({ actor_id: profile.id, event_type: "application_rejected", message: "Demande refusée", metadata: { application_id: input.applicationId } });
  revalidatePath("/admin/requests");
  return { ok: true };
}

export async function markApplicationNeedsFollowup(input: { applicationId: string; internalNote?: string }) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurant_applications")
    .update({ status: "needs_followup", reviewed_by: profile.id, reviewed_at: new Date().toISOString(), internal_note: input.internalNote?.trim() || null })
    .eq("id", input.applicationId);

  if (error) throw new Error("Mise à jour impossible");

  revalidatePath("/admin/requests");
  return { ok: true };
}
