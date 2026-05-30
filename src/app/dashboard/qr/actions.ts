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
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "table";
}

function cleanId(value: string) {
  return value.trim();
}

function revalidateQrPaths(restaurantSlug: string, tableSlug?: string) {
  revalidatePath("/dashboard/qr");

  if (tableSlug) {
    revalidatePath(`/r/${restaurantSlug}/table/${tableSlug}`);
  }
}

async function createUniqueTableSlug(name: string, restaurantId: string) {
  const supabase = await createClient();
  const baseSlug = createSlugBase(name);

  let candidateSlug = baseSlug;
  let index = 2;

  while (true) {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("slug", candidateSlug)
      .maybeSingle();

    if (error) {
      throw new Error("Lecture des tables impossible.");
    }

    if (!data) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${index}`;
    index += 1;
  }
}

async function getRestaurantTableOrThrow(tableId: string, restaurantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id, slug")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Table introuvable.");
  }

  return data;
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

  revalidateQrPaths(restaurant.slug, slug);

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

  const tableId = cleanId(input.tableId);
  const name = input.name.trim();
  const zone = input.zone.trim();

  if (!tableId) {
    throw new Error("Table introuvable.");
  }

  if (!name) {
    throw new Error("Le nom de la table est requis.");
  }

  if (!zone) {
    throw new Error("La zone est requise.");
  }

  const table = await getRestaurantTableOrThrow(tableId, restaurant.id);

  await assertUniqueTableName({
    restaurantId: restaurant.id,
    name,
    ignoredTableId: tableId,
  });

  const { error } = await supabase
    .from("restaurant_tables")
    .update({
      name,
      zone,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tableId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Modification de la table impossible.");
  }

  revalidateQrPaths(restaurant.slug, table.slug);

  return { ok: true };
}

export async function toggleRestaurantTable(input: {
  tableId: string;
  isActive: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const tableId = cleanId(input.tableId);

  if (!tableId) {
    throw new Error("Table introuvable.");
  }

  const table = await getRestaurantTableOrThrow(tableId, restaurant.id);

  const { error } = await supabase
    .from("restaurant_tables")
    .update({
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tableId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Mise à jour de la table impossible.");
  }

  revalidateQrPaths(restaurant.slug, table.slug);

  return { ok: true };
}

export async function deleteRestaurantTable(input: {
  tableId: string;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const tableId = cleanId(input.tableId);

  if (!tableId) {
    throw new Error("Table introuvable.");
  }

  const table = await getRestaurantTableOrThrow(tableId, restaurant.id);

  const { count, error: countError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .eq("table_id", tableId);

  if (countError) {
    throw new Error("Vérification des commandes impossible.");
  }

  if ((count ?? 0) > 0) {
    throw new Error("Cette table a déjà des commandes. Désactivez-la plutôt que de la supprimer.");
  }

  const { error } = await supabase
    .from("restaurant_tables")
    .delete()
    .eq("id", tableId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Suppression de la table impossible.");
  }

  revalidateQrPaths(restaurant.slug, table.slug);

  return { ok: true };
}