"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function createSlugBase(value: string) {
  const slug = normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return slug || "table";
}

async function createUniqueTableSlug(name: string, restaurantId: string) {
  const supabase = await createClient();
  const baseSlug = createSlugBase(name);

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("slug")
    .eq("restaurant_id", restaurantId)
    .returns<{ slug: string }[]>();

  if (error) {
    throw new Error("Lecture des tables impossible.");
  }

  const existingSlugs = new Set((data ?? []).map((table) => table.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;

  while (existingSlugs.has(`${baseSlug}-${index}`)) {
    index += 1;
  }

  return `${baseSlug}-${index}`;
}

async function assertUniqueTableName({
  restaurantId,
  name,
  ignoredTableId,
}: {
  restaurantId: string;
  name: string;
  ignoredTableId?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id, name")
    .eq("restaurant_id", restaurantId)
    .returns<{ id: string; name: string }[]>();

  if (error) {
    throw new Error("Vérification des tables impossible.");
  }

  const normalizedName = normalizeText(name);
  const duplicate = (data ?? []).some(
    (table) => table.id !== ignoredTableId && normalizeText(table.name) === normalizedName,
  );

  if (duplicate) {
    throw new Error("Une table porte déjà ce nom.");
  }
}

export async function createRestaurantTable(input: {
  name: string;
  zone: string;
  isActive: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const name = input.name.trim();
  const zone = input.zone.trim();

  if (!name) {
    throw new Error("Le nom de la table est requis.");
  }

  if (!zone) {
    throw new Error("La zone est requise.");
  }

  await assertUniqueTableName({
    restaurantId: restaurant.id,
    name,
  });

  const slug = await createUniqueTableSlug(name, restaurant.id);

  const { error } = await supabase.from("restaurant_tables").insert({
    restaurant_id: restaurant.id,
    name,
    slug,
    zone,
    is_active: input.isActive,
    scans_count: 0,
  });

  if (error) {
    throw new Error("Création de la table impossible.");
  }

  revalidatePath("/dashboard/qr");
  revalidatePath(`/r/${restaurant.slug}/table/${slug}`);

  return { ok: true };
}

export async function updateRestaurantTable(input: {
  tableId: string;
  name: string;
  zone: string;
  isActive: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const name = input.name.trim();
  const zone = input.zone.trim();

  if (!input.tableId) {
    throw new Error("Table introuvable.");
  }

  if (!name) {
    throw new Error("Le nom de la table est requis.");
  }

  if (!zone) {
    throw new Error("La zone est requise.");
  }

  await assertUniqueTableName({
    restaurantId: restaurant.id,
    name,
    ignoredTableId: input.tableId,
  });

  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("slug")
    .eq("id", input.tableId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (tableError || !table) {
    throw new Error("Table introuvable.");
  }

  const { error } = await supabase
    .from("restaurant_tables")
    .update({
      name,
      zone,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.tableId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Modification de la table impossible.");
  }

  revalidatePath("/dashboard/qr");
  revalidatePath(`/r/${restaurant.slug}/table/${table.slug}`);

  return { ok: true };
}

export async function toggleRestaurantTable(input: {
  tableId: string;
  isActive: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurant_tables")
    .update({
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.tableId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Mise à jour de la table impossible.");
  }

  revalidatePath("/dashboard/qr");

  return { ok: true };
}

export async function deleteRestaurantTable(input: {
  tableId: string;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  if (!input.tableId) {
    throw new Error("Table introuvable.");
  }

  const { count, error: countError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .eq("table_id", input.tableId);

  if (countError) {
    throw new Error("Vérification des commandes impossible.");
  }

  if ((count ?? 0) > 0) {
    throw new Error("Cette table a déjà des commandes. Désactivez-la plutôt que de la supprimer.");
  }

  const { error } = await supabase
    .from("restaurant_tables")
    .delete()
    .eq("id", input.tableId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Suppression de la table impossible.");
  }

  revalidatePath("/dashboard/qr");

  return { ok: true };
}