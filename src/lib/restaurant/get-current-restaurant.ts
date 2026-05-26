import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, lookupProfileByUserId } from "@/lib/auth/get-current-user";

export async function getCurrentRestaurantContext() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const profileResult = await lookupProfileByUserId(supabase, user.id, user.email);
  if (!profileResult.ok) {
    redirect(`/unauthorized?reason=${profileResult.reason}`);
  }

  const profile = profileResult.profile;
  if (profile.role !== "restaurant_owner" && profile.role !== "restaurant_staff") {
    redirect("/unauthorized?reason=forbidden_role");
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/unauthorized?reason=missing_restaurant");
  }

  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("id", membership.restaurant_id).maybeSingle();
  if (!restaurant) {
    redirect("/unauthorized?reason=missing_restaurant");
  }

  let { data: settings } = await supabase.from("restaurant_settings").select("*").eq("restaurant_id", membership.restaurant_id).maybeSingle();

  if (!settings) {
    const { data: created } = await supabase.from("restaurant_settings").insert({ restaurant_id: membership.restaurant_id }).select("*").single();
    settings = created;
  }

  return { user, profile, restaurant, settings };
}
