"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";

function toCents(euros: number) {
  return Math.round(euros * 100);
}

export async function createCategory(input: { name: string; description?: string | null }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const name = input.name.trim();
  if (!name) throw new Error("Le nom de la catégorie est requis.");

  const { data: last } = await supabase
    .from("menu_categories")
    .select("sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("menu_categories").insert({
    restaurant_id: restaurant.id,
    name,
    description: input.description?.trim() || null,
    sort_order: nextSortOrder,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/menu");
}

export async function updateCategory(input: { id: string; name: string; description?: string | null; is_active: boolean; sort_order: number }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_categories")
    .update({ name: input.name.trim(), description: input.description?.trim() || null, is_active: input.is_active, sort_order: input.sort_order })
    .eq("id", input.id)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/menu");
}

export async function deleteCategory(input: { id: string }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").delete().eq("id", input.id).eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/menu");
}

export async function createItem(input: { name: string; description?: string | null; category_id?: string | null; price_eur: number; is_available?: boolean }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("menu_items").insert({
    restaurant_id: restaurant.id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    category_id: input.category_id || null,
    price_cents: toCents(input.price_eur),
    is_available: input.is_available ?? true,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/menu");
}

export async function updateItem(input: { id: string; name: string; description?: string | null; category_id?: string | null; price_eur: number; is_available: boolean; is_featured: boolean; sort_order: number }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category_id: input.category_id || null,
      price_cents: toCents(input.price_eur),
      is_available: input.is_available,
      is_featured: input.is_featured,
      sort_order: input.sort_order,
    })
    .eq("id", input.id)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/menu");
}

export async function deleteItem(input: { id: string }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", input.id).eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/menu");
}

export async function toggleItemAvailability(input: { id: string; is_available: boolean }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: input.is_available })
    .eq("id", input.id)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/menu");
}
