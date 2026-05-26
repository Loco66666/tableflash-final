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

export async function updateRestaurantSettings(payload: SettingsPayload) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  await supabase.from("restaurant_settings").update(payload).eq("restaurant_id", restaurant.id);
  revalidatePath("/dashboard/settings");
}

export async function updateRestaurantProfile(payload: RestaurantPayload) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  await supabase.from("restaurants").update(payload).eq("id", restaurant.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
