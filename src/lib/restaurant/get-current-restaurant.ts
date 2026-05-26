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

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[restaurant] membership query failed", {
        userId: user.id,
        userEmail: user.email,
        errorCode: membershipError.code,
        errorMessage: membershipError.message,
      });
    }

    redirect("/unauthorized?reason=membership_query_error");
  }

  let restaurantId = membership?.restaurant_id ?? null;

  if (!restaurantId) {
    const {
      data: ownedRestaurant,
      error: ownedRestaurantError,
    } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownedRestaurantError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[restaurant] owned restaurant fallback query failed", {
          userId: user.id,
          userEmail: user.email,
          errorCode: ownedRestaurantError.code,
          errorMessage: ownedRestaurantError.message,
        });
      }

      redirect("/unauthorized?reason=restaurant_query_error");
    }

    restaurantId = ownedRestaurant?.id ?? null;
  }

  if (!restaurantId) {
    if (process.env.NODE_ENV === "development") {
      console.error("[restaurant] missing restaurant", {
        userId: user.id,
        userEmail: user.email,
        profileRole: profile.role,
      });
    }

    redirect("/unauthorized?reason=missing_restaurant");
  }

  const {
    data: restaurant,
    error: restaurantError,
  } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .maybeSingle();

  if (restaurantError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[restaurant] restaurant query failed", {
        userId: user.id,
        userEmail: user.email,
        restaurantId,
        errorCode: restaurantError.code,
        errorMessage: restaurantError.message,
      });
    }

    redirect("/unauthorized?reason=restaurant_query_error");
  }

  if (!restaurant) {
    if (process.env.NODE_ENV === "development") {
      console.error("[restaurant] restaurant row missing", {
        userId: user.id,
        userEmail: user.email,
        restaurantId,
      });
    }

    redirect("/unauthorized?reason=missing_restaurant");
  }

const {
  data: existingSettings,
  error: settingsError,
} = await supabase
  .from("restaurant_settings")
  .select("*")
  .eq("restaurant_id", restaurant.id)
  .maybeSingle();

let settings = existingSettings;

  if (settingsError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[restaurant] settings query failed", {
        userId: user.id,
        userEmail: user.email,
        restaurantId: restaurant.id,
        errorCode: settingsError.code,
        errorMessage: settingsError.message,
      });
    }

    redirect("/unauthorized?reason=settings_query_error");
  }

  if (!settings) {
    const {
      data: createdSettings,
      error: createSettingsError,
    } = await supabase
      .from("restaurant_settings")
      .insert({ restaurant_id: restaurant.id })
      .select("*")
      .single();

    if (createSettingsError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[restaurant] settings creation failed", {
          userId: user.id,
          userEmail: user.email,
          restaurantId: restaurant.id,
          errorCode: createSettingsError.code,
          errorMessage: createSettingsError.message,
        });
      }

      redirect("/unauthorized?reason=settings_query_error");
    }

    settings = createdSettings;
  }

  return {
    user,
    profile,
    restaurant,
    settings,
  };
}