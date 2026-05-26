import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type AdminEventRow = Database["public"]["Tables"]["admin_events"]["Row"];
type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];

export type AdminStats = {
  restaurants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    archived: number;
  };
  applications: {
    total: number;
    pending: number;
    needsFollowup: number;
    approved: number;
    rejected: number;
  };
  users: {
    restaurantOwners: number;
    restaurantStaff: number;
  };
  plans: {
    trial: number;
    standard: number;
    premium: number;
  };
  recentEvents: AdminEventRow[];
  trialsEndingSoon: Pick<RestaurantRow, "id" | "name" | "slug" | "trial_ends_at">[];
};

function requireCount(count: number | null, context: string): number {
  if (count === null) {
    console.error("[admin-stats] count null", { context });
    throw new Error("Chargement des statistiques admin impossible");
  }
  return count;
}

export async function getAdminStats(supabase: SupabaseClient<Database>): Promise<AdminStats> {
  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const [restaurantsTotal, restaurantsActive, restaurantsTrial, restaurantsSuspended, restaurantsArchived, applicationsTotal, applicationsPending, applicationsNeedsFollowup, applicationsApproved, applicationsRejected, usersOwners, usersStaff, plansTrial, plansStandard, plansPremium, recentEvents, trialsEndingSoon] = await Promise.all([
    supabase.from("restaurants").select("id", { count: "exact", head: true }),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("status", "trial"),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("status", "suspended"),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("status", "archived"),
    supabase.from("restaurant_applications").select("id", { count: "exact", head: true }),
    supabase.from("restaurant_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("restaurant_applications").select("id", { count: "exact", head: true }).eq("status", "needs_followup"),
    supabase.from("restaurant_applications").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("restaurant_applications").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "restaurant_owner"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "restaurant_staff"),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("plan", "trial"),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("plan", "standard"),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("plan", "premium"),
    supabase.from("admin_events").select("id, actor_id, restaurant_id, event_type, message, metadata, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("restaurants").select("id, name, slug, trial_ends_at").eq("status", "trial").not("trial_ends_at", "is", null).gte("trial_ends_at", now.toISOString()).lte("trial_ends_at", inSevenDays.toISOString()).order("trial_ends_at", { ascending: true }).limit(8),
  ]);

  const responses = [restaurantsTotal, restaurantsActive, restaurantsTrial, restaurantsSuspended, restaurantsArchived, applicationsTotal, applicationsPending, applicationsNeedsFollowup, applicationsApproved, applicationsRejected, usersOwners, usersStaff, plansTrial, plansStandard, plansPremium, recentEvents, trialsEndingSoon];
  const failed = responses.find((response) => response.error);
  if (failed?.error) {
    console.error("[admin-stats] query failed", failed.error);
    throw new Error("Chargement des statistiques admin impossible");
  }

  return {
    restaurants: {
      total: requireCount(restaurantsTotal.count, "restaurants.total"),
      active: requireCount(restaurantsActive.count, "restaurants.active"),
      trial: requireCount(restaurantsTrial.count, "restaurants.trial"),
      suspended: requireCount(restaurantsSuspended.count, "restaurants.suspended"),
      archived: requireCount(restaurantsArchived.count, "restaurants.archived"),
    },
    applications: {
      total: requireCount(applicationsTotal.count, "applications.total"),
      pending: requireCount(applicationsPending.count, "applications.pending"),
      needsFollowup: requireCount(applicationsNeedsFollowup.count, "applications.needsFollowup"),
      approved: requireCount(applicationsApproved.count, "applications.approved"),
      rejected: requireCount(applicationsRejected.count, "applications.rejected"),
    },
    users: {
      restaurantOwners: requireCount(usersOwners.count, "users.restaurantOwners"),
      restaurantStaff: requireCount(usersStaff.count, "users.restaurantStaff"),
    },
    plans: {
      trial: requireCount(plansTrial.count, "plans.trial"),
      standard: requireCount(plansStandard.count, "plans.standard"),
      premium: requireCount(plansPremium.count, "plans.premium"),
    },
    recentEvents: recentEvents.data ?? [],
    trialsEndingSoon: trialsEndingSoon.data ?? [],
  };
}
