"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

const PRODUCT_IMAGES_BUCKET = "menu-product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parsePositivePrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Indiquez un prix positif.");
  }

  return Math.round(price * 100) / 100;
}

function parseOptionalPromoPrice(price?: number | null) {
  if (price === undefined || price === null || Number.isNaN(price) || price <= 0) {
    return null;
  }

  return Math.round(price * 100) / 100;
}

function getImageExtension(file: File) {
  const nameExtension = file.name.split(".").pop()?.toLowerCase();

  if (nameExtension && ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"].includes(nameExtension)) {
    return nameExtension === "jpg" ? "jpeg" : nameExtension;
  }

  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/heic") return "heic";
  if (file.type === "image/heif") return "heif";
  if (file.type === "image/avif") return "avif";

  return "jpeg";
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

async function assertUniqueCategoryName({
  restaurantId,
  name,
  ignoredCategoryId,
}: {
  restaurantId: string;
  name: string;
  ignoredCategoryId?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, name")
    .eq("restaurant_id", restaurantId)
    .returns<{ id: string; name: string }[]>();

  if (error) {
    throw new Error("Vérification des catégories impossible.");
  }

  const normalizedName = normalizeText(name);
  const duplicate = (data ?? []).some(
    (category) => category.id !== ignoredCategoryId && normalizeText(category.name) === normalizedName,
  );

  if (duplicate) {
    throw new Error("Cette catégorie existe déjà.");
  }
}

export async function uploadMenuProductImage(formData: FormData) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Aucune photo sélectionnée.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(`Le fichier doit être une image. Type reçu : ${file.type || "inconnu"}`);
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("La photo est trop lourde. Maximum 5 Mo.");
  }

  const extension = getImageExtension(file);
  const path = `${restaurant.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    console.error("[dashboard/menu] product image upload failed", {
      bucket: PRODUCT_IMAGES_BUCKET,
      path,
      restaurantId: restaurant.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      errorName: error.name,
      errorMessage: error.message,
    });

    throw new Error(`Upload de la photo impossible : ${error.message}`);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

  if (!data.publicUrl) {
    throw new Error("URL de la photo introuvable.");
  }

  return {
    ok: true,
    imageUrl: data.publicUrl,
  };
}

export async function createMenuCategory(input: { name: string }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const name = input.name.trim();

  if (!name) {
    throw new Error("Le nom de la catégorie est requis.");
  }

  await assertUniqueCategoryName({
    restaurantId: restaurant.id,
    name,
  });

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
  revalidatePath(`/r/${restaurant.slug}`);

  return { ok: true };
}

export async function updateMenuCategory(input: {
  categoryId: string;
  name: string;
  isActive: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const name = input.name.trim();

  if (!input.categoryId) {
    throw new Error("Catégorie introuvable.");
  }

  if (!name) {
    throw new Error("Le nom de la catégorie est requis.");
  }

  await assertUniqueCategoryName({
    restaurantId: restaurant.id,
    name,
    ignoredCategoryId: input.categoryId,
  });

  const { error } = await supabase
    .from("menu_categories")
    .update({
      name,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.categoryId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Modification de la catégorie impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}`);

  return { ok: true };
}

export async function deleteMenuCategory(input: { categoryId: string }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("menu_products")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .eq("category_id", input.categoryId);

  if (countError) {
    throw new Error("Vérification des produits impossible.");
  }

  if ((count ?? 0) > 0) {
    throw new Error("Cette catégorie contient des produits. Déplacez-les ou supprimez-les avant.");
  }

  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", input.categoryId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Suppression de la catégorie impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}`);

  return { ok: true };
}

export async function createMenuProduct(input: {
  name: string;
  categoryId: string;
  price: number;
  promoPrice?: number | null;
  description?: string;
  available?: boolean;
  featured?: boolean;
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
  const promoPrice = parseOptionalPromoPrice(input.promoPrice);

  if (promoPrice !== null && promoPrice >= price) {
    throw new Error("Le prix promo doit être inférieur au prix normal.");
  }

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
    promo_price: promoPrice,
    image_url: imageUrl,
    is_available: input.available ?? true,
    is_featured: input.featured ?? false,
    sort_order: count ?? 0,
  });

  if (error) {
    throw new Error("Création du produit impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}`);

  return { ok: true };
}

export async function updateMenuProduct(input: {
  productId: string;
  name: string;
  categoryId: string;
  price: number;
  promoPrice?: number | null;
  description?: string;
  available?: boolean;
  featured?: boolean;
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
  const promoPrice = parseOptionalPromoPrice(input.promoPrice);

  if (promoPrice !== null && promoPrice >= price) {
    throw new Error("Le prix promo doit être inférieur au prix normal.");
  }

  const { error } = await supabase
    .from("menu_products")
    .update({
      name,
      category_id: categoryId,
      description,
      price,
      promo_price: promoPrice,
      image_url: imageUrl,
      is_available: input.available ?? true,
      is_featured: input.featured ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Modification du produit impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}`);

  return { ok: true };
}

export async function deleteMenuProduct(input: { productId: string }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", input.productId);

  if (countError) {
    throw new Error("Vérification des commandes impossible.");
  }

  if ((count ?? 0) > 0) {
    const { error: disableError } = await supabase
      .from("menu_products")
      .update({
        is_available: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.productId)
      .eq("restaurant_id", restaurant.id);

    if (disableError) {
      throw new Error("Produit déjà commandé. Désactivation impossible.");
    }

    revalidatePath("/dashboard/menu");
    revalidatePath(`/r/${restaurant.slug}`);

    return {
      ok: true,
      mode: "disabled",
      message: "Produit déjà commandé : il a été rendu indisponible plutôt que supprimé.",
    };
  }

  const { error } = await supabase
    .from("menu_products")
    .delete()
    .eq("id", input.productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Suppression du produit impossible.");
  }

  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurant.slug}`);

  return {
    ok: true,
    mode: "deleted",
    message: "Produit supprimé.",
  };
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
  revalidatePath(`/r/${restaurant.slug}`);

  return { ok: true };
}