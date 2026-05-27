"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

function parsePositivePrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Indiquez un prix positif.");
  }

  return Math.round(price * 100) / 100;
}

async function ensureCategoryBelongsToRestaurant(categoryId: string, restaurantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Catégorie introuvable.");
  }
}

export async function createMenuCategory(input: { name: string }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const name = input.name.trim();

  if (!name) {
    throw new Error("Le nom de la catégorie est requis.");
  }

  const { count, error: countError } = await supabase
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);

  if (countError) {
    throw new Error("Lecture des catégories impossible.");
  }

  const { error } = await supabase.from("menu_categories").insert({
    restaurant_id: restaurant.id,
    name,
    sort_order: count ?? 0,
    is_active: true,
  });

  if (error) {
    throw new Error("Création de la catégorie impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}/table/table-1`);

  return { ok: true };
}

export async function createMenuProduct(input: {
  name: string;
  categoryId: string;
  price: number;
  description?: string;
  available?: boolean;
  imageUrl?: string;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const name = input.name.trim();
  const categoryId = input.categoryId.trim();
  const description = input.description?.trim() || null;
  const imageUrl = input.imageUrl?.trim() || null;

  if (!name) {
    throw new Error("Le nom du produit est requis.");
  }

  if (!categoryId) {
    throw new Error("La catégorie est requise.");
  }

  await ensureCategoryBelongsToRestaurant(categoryId, restaurant.id);

  const price = parsePositivePrice(input.price);

  const { count, error: countError } = await supabase
    .from("menu_products")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);

  if (countError) {
    throw new Error("Lecture des produits impossible.");
  }

  const { error } = await supabase.from("menu_products").insert({
    restaurant_id: restaurant.id,
    category_id: categoryId,
    name,
    description,
    price,
    promo_price: null,
    image_url: imageUrl,
    is_available: input.available ?? true,
    is_featured: false,
    sort_order: count ?? 0,
  });

  if (error) {
    throw new Error("Création du produit impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}/table/table-1`);

  return { ok: true };
}

export async function updateMenuProduct(input: {
  productId: string;
  name: string;
  categoryId: string;
  price: number;
  description?: string;
  available?: boolean;
  imageUrl?: string;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const name = input.name.trim();
  const categoryId = input.categoryId.trim();
  const description = input.description?.trim() || null;
  const imageUrl = input.imageUrl?.trim() || null;

  if (!name) {
    throw new Error("Le nom du produit est requis.");
  }

  if (!categoryId) {
    throw new Error("La catégorie est requise.");
  }

  await ensureCategoryBelongsToRestaurant(categoryId, restaurant.id);

  const price = parsePositivePrice(input.price);

  const { error } = await supabase
    .from("menu_products")
    .update({
      name,
      category_id: categoryId,
      description,
      price,
      image_url: imageUrl,
      is_available: input.available ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Modification du produit impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}/table/table-1`);

  return { ok: true };
}

export async function deleteMenuProduct(input: { productId: string }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("menu_products")
    .delete()
    .eq("id", input.productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Suppression du produit impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}/table/table-1`);

  return { ok: true };
}

export async function toggleMenuProductAvailability(input: {
  productId: string;
  available: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("menu_products")
    .update({
      is_available: input.available,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Mise à jour de la disponibilité impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}/table/table-1`);

  return { ok: true };
}