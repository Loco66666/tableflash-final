"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const PRODUCT_IMAGES_BUCKET = "menu-product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const DEFAULT_OPTIONS_CONFIG: Database["public"]["Tables"]["menu_products"]["Insert"]["options_config"] = {
  groups: [],
  allergens: [],
  availability: { enabled: false },
};

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

function cleanId(value: string) {
  return value.trim();
}

function cleanIds(values: string[]) {
  return [...new Set(values.map(cleanId).filter(Boolean))];
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

function revalidateMenuPaths(restaurantSlug: string) {
  revalidatePath("/dashboard/menu");
  revalidatePath(`/r/${restaurantSlug}`);
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

async function ensureProductBelongsToRestaurant(productId: string, restaurantId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_products")
    .select("id")
    .eq("id", productId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Produit introuvable.");
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

  revalidateMenuPaths(restaurant.slug);

  return { ok: true };
}

export async function updateMenuCategory(input: {
  categoryId: string;
  name: string;
  isActive: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const categoryId = cleanId(input.categoryId);
  const name = input.name.trim();

  if (!categoryId) {
    throw new Error("Catégorie introuvable.");
  }

  if (!name) {
    throw new Error("Le nom de la catégorie est requis.");
  }

  await ensureCategoryBelongsToRestaurant(categoryId, restaurant.id);

  await assertUniqueCategoryName({
    restaurantId: restaurant.id,
    name,
    ignoredCategoryId: categoryId,
  });

  const { error } = await supabase
    .from("menu_categories")
    .update({
      name,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Modification de la catégorie impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return { ok: true };
}

export async function deleteMenuCategory(input: { categoryId: string; archiveProducts?: boolean }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const categoryId = cleanId(input.categoryId);

  if (!categoryId) {
    throw new Error("Catégorie introuvable.");
  }

  await ensureCategoryBelongsToRestaurant(categoryId, restaurant.id);

  const { count, error: countError } = await supabase
    .from("menu_products")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id)
    .eq("category_id", categoryId);

  if (countError) {
    throw new Error("Vérification des produits impossible.");
  }

  if ((count ?? 0) > 0) {
    if (!input.archiveProducts) {
      throw new Error(`Cette catégorie contient ${count} produit(s). Masquez ou archivez les produits avant suppression.`);
    }

    const { error: archiveError } = await supabase
      .from("menu_products")
      .update({
        category_id: null,
        is_available: false,
        updated_at: new Date().toISOString(),
      })
      .eq("restaurant_id", restaurant.id)
      .eq("category_id", categoryId);

    if (archiveError) {
      throw new Error("Archivage des produits de la catégorie impossible.");
    }
  }

  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Suppression de la catégorie impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return {
    ok: true,
    archivedProducts: count ?? 0,
  };
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
  optionsConfig?: unknown;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const name = input.name.trim();
  const categoryId = cleanId(input.categoryId);
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

  const productPayload = {
    restaurant_id: restaurant.id,
    category_id: categoryId,
    name,
    description,
    price,
    promo_price: promoPrice,
    image_url: imageUrl,
    options_config: (input.optionsConfig ?? DEFAULT_OPTIONS_CONFIG) as Database["public"]["Tables"]["menu_products"]["Insert"]["options_config"],
    is_available: input.available ?? true,
    is_featured: input.featured ?? false,
    sort_order: count ?? 0,
  };

  const { error } = await supabase.from("menu_products").insert(productPayload);

  if (error) {
    throw new Error("Création du produit impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return { ok: true };
}

export async function importMenuProductsFromSuggestions(input: {
  products: {
    name: string;
    categoryName: string;
    price: number;
    description?: string;
    optionsConfig?: unknown;
  }[];
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const suggestions = input.products
    .map((product) => ({
      name: product.name.trim(),
      categoryName: product.categoryName.trim(),
      price: product.price,
      description: product.description?.trim() || null,
      optionsConfig: product.optionsConfig ?? DEFAULT_OPTIONS_CONFIG,
    }))
    .filter((product) => product.name && product.categoryName);

  if (suggestions.length === 0) {
    throw new Error("Aucun produit valide à importer.");
  }

  if (suggestions.length > 80) {
    throw new Error("Import limité à 80 produits à la fois.");
  }

  const { data: existingCategories, error: categoriesError } = await supabase
    .from("menu_categories")
    .select("id, name, sort_order")
    .eq("restaurant_id", restaurant.id)
    .returns<{ id: string; name: string; sort_order: number | null }[]>();

  if (categoriesError) {
    throw new Error("Lecture des catégories impossible.");
  }

  const categoryByNormalizedName = new Map(
    (existingCategories ?? []).map((category) => [normalizeText(category.name), category]),
  );
  let nextCategorySortOrder = Math.max(-1, ...(existingCategories ?? []).map((category) => category.sort_order ?? 0)) + 1;
  const categoriesToCreate = [
    ...new Set(
      suggestions
        .map((product) => product.categoryName)
        .filter((categoryName) => !categoryByNormalizedName.has(normalizeText(categoryName))),
    ),
  ];

  for (const categoryName of categoriesToCreate) {
    const { data: createdCategory, error } = await supabase
      .from("menu_categories")
      .insert({
        restaurant_id: restaurant.id,
        name: categoryName,
        sort_order: nextCategorySortOrder,
        is_active: true,
      })
      .select("id, name, sort_order")
      .single<{ id: string; name: string; sort_order: number | null }>();

    if (error || !createdCategory) {
      throw new Error(`Création de la catégorie "${categoryName}" impossible.`);
    }

    categoryByNormalizedName.set(normalizeText(createdCategory.name), createdCategory);
    nextCategorySortOrder += 1;
  }

  const { data: existingProducts, error: productsError } = await supabase
    .from("menu_products")
    .select("id, name, category_id, sort_order")
    .eq("restaurant_id", restaurant.id)
    .returns<{ id: string; name: string; category_id: string | null; sort_order: number | null }[]>();

  if (productsError) {
    throw new Error("Lecture des produits impossible.");
  }

  const existingProductKeys = new Set(
    (existingProducts ?? []).map((product) => `${product.category_id ?? ""}:${normalizeText(product.name)}`),
  );
  let nextProductSortOrder = Math.max(-1, ...(existingProducts ?? []).map((product) => product.sort_order ?? 0)) + 1;

  const productsToInsert: Database["public"]["Tables"]["menu_products"]["Insert"][] = [];
  const importedProductKeys = new Set<string>();

  for (const suggestion of suggestions) {
    const category = categoryByNormalizedName.get(normalizeText(suggestion.categoryName));
    if (!category) continue;

    const productKey = `${category.id}:${normalizeText(suggestion.name)}`;
    if (existingProductKeys.has(productKey) || importedProductKeys.has(productKey)) continue;

    const price = parsePositivePrice(suggestion.price);

    productsToInsert.push({
      restaurant_id: restaurant.id,
      category_id: category.id,
      name: suggestion.name,
      description: suggestion.description,
      price,
      promo_price: null,
      image_url: null,
      options_config: suggestion.optionsConfig as Database["public"]["Tables"]["menu_products"]["Insert"]["options_config"],
      is_available: true,
      is_featured: false,
      sort_order: nextProductSortOrder,
    });
    importedProductKeys.add(productKey);
    nextProductSortOrder += 1;
  }

  if (productsToInsert.length === 0) {
    throw new Error("Aucun nouveau produit à importer. Ils existent peut-être déjà.");
  }

  const { error: insertError } = await supabase.from("menu_products").insert(productsToInsert);

  if (insertError) {
    throw new Error("Import des produits impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return {
    ok: true,
    importedProducts: productsToInsert.length,
    createdCategories: categoriesToCreate.length,
  };
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
  optionsConfig?: unknown;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const productId = cleanId(input.productId);
  const name = input.name.trim();
  const categoryId = cleanId(input.categoryId);
  const description = input.description?.trim() || null;
  const imageUrl = input.imageUrl?.trim() || null;

  if (!productId) {
    throw new Error("Produit introuvable.");
  }

  if (!name) {
    throw new Error("Le nom du produit est requis.");
  }

  if (!categoryId) {
    throw new Error("La catégorie est requise.");
  }

  await ensureProductBelongsToRestaurant(productId, restaurant.id);
  await ensureCategoryBelongsToRestaurant(categoryId, restaurant.id);

  const price = parsePositivePrice(input.price);
  const promoPrice = parseOptionalPromoPrice(input.promoPrice);

  if (promoPrice !== null && promoPrice >= price) {
    throw new Error("Le prix promo doit être inférieur au prix normal.");
  }

  const productPayload = {
    name,
    category_id: categoryId,
    description,
    price,
    promo_price: promoPrice,
    image_url: imageUrl,
    options_config: (input.optionsConfig ?? DEFAULT_OPTIONS_CONFIG) as Database["public"]["Tables"]["menu_products"]["Update"]["options_config"],
    is_available: input.available ?? true,
    is_featured: input.featured ?? false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("menu_products")
    .update(productPayload)
    .eq("id", productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Modification du produit impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return { ok: true };
}

export async function deleteMenuProduct(input: { productId: string }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const productId = cleanId(input.productId);

  if (!productId) {
    throw new Error("Produit introuvable.");
  }

  await ensureProductBelongsToRestaurant(productId, restaurant.id);

  const { count, error: countError } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (countError) {
    throw new Error("Vérification des commandes impossible.");
  }

  if ((count ?? 0) > 0) {
    const { error: archiveError } = await supabase
      .from("menu_products")
      .update({
        category_id: null,
        is_available: false,
        is_featured: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("restaurant_id", restaurant.id);

    if (archiveError) {
      throw new Error(archiveError.message);
    }

    revalidateMenuPaths(restaurant.slug);

    return {
      ok: true,
      mode: "archived",
      message:
        "Produit déjà utilisé dans des commandes : il est retiré du menu, mais conservé pour l’historique.",
    };
  }

  const { error } = await supabase
    .from("menu_products")
    .delete()
    .eq("id", productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Suppression du produit impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return {
    ok: true,
    mode: "deleted",
    message: "Produit supprimé.",
  };
}

export async function bulkUpdateMenuProductsAvailability(input: {
  productIds: string[];
  available: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const productIds = cleanIds(input.productIds);

  if (productIds.length === 0) {
    throw new Error("Aucun produit sélectionné.");
  }

  if (productIds.length > 120) {
    throw new Error("Sélection limitée à 120 produits à la fois.");
  }

  const { data, error } = await supabase
    .from("menu_products")
    .update({
      is_available: input.available,
      updated_at: new Date().toISOString(),
    })
    .in("id", productIds)
    .eq("restaurant_id", restaurant.id)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) {
    throw new Error("Mise à jour de la sélection impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return {
    ok: true,
    updatedProducts: data?.length ?? 0,
  };
}

export async function bulkArchiveMenuProducts(input: { productIds: string[] }) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const productIds = cleanIds(input.productIds);

  if (productIds.length === 0) {
    throw new Error("Aucun produit sélectionné.");
  }

  if (productIds.length > 120) {
    throw new Error("Sélection limitée à 120 produits à la fois.");
  }

  const { data: usedItems, error: usedItemsError } = await supabase
    .from("order_items")
    .select("product_id")
    .in("product_id", productIds)
    .returns<{ product_id: string | null }[]>();

  if (usedItemsError) {
    throw new Error("Vérification des commandes impossible.");
  }

  const usedProductIds = new Set((usedItems ?? []).map((item) => item.product_id).filter(Boolean));
  const productIdsToArchive = productIds.filter((productId) => usedProductIds.has(productId));
  const productIdsToDelete = productIds.filter((productId) => !usedProductIds.has(productId));
  let archivedProducts = 0;
  let deletedProducts = 0;

  if (productIdsToArchive.length > 0) {
    const { data, error } = await supabase
      .from("menu_products")
      .update({
        category_id: null,
        is_available: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", productIdsToArchive)
      .eq("restaurant_id", restaurant.id)
      .select("id")
      .returns<{ id: string }[]>();

    if (error) {
      throw new Error("Archivage de la sélection impossible.");
    }

    archivedProducts = data?.length ?? 0;
  }

  if (productIdsToDelete.length > 0) {
    const { data, error } = await supabase
      .from("menu_products")
      .delete()
      .in("id", productIdsToDelete)
      .eq("restaurant_id", restaurant.id)
      .select("id")
      .returns<{ id: string }[]>();

    if (error) {
      throw new Error("Suppression de la sélection impossible.");
    }

    deletedProducts = data?.length ?? 0;
  }

  revalidateMenuPaths(restaurant.slug);

  return {
    ok: true,
    archivedProducts,
    deletedProducts,
  };
}

export async function bulkMoveMenuProductsToCategory(input: {
  productIds: string[];
  categoryId: string;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();
  const productIds = cleanIds(input.productIds);
  const categoryId = cleanId(input.categoryId);

  if (productIds.length === 0) {
    throw new Error("Aucun produit sélectionné.");
  }

  if (productIds.length > 120) {
    throw new Error("Sélection limitée à 120 produits à la fois.");
  }

  if (!categoryId) {
    throw new Error("Catégorie de destination requise.");
  }

  await ensureCategoryBelongsToRestaurant(categoryId, restaurant.id);

  const { data, error } = await supabase
    .from("menu_products")
    .update({
      category_id: categoryId,
      updated_at: new Date().toISOString(),
    })
    .in("id", productIds)
    .eq("restaurant_id", restaurant.id)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) {
    throw new Error("Déplacement de la sélection impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return {
    ok: true,
    movedProducts: data?.length ?? 0,
  };
}

export async function toggleMenuProductAvailability(input: {
  productId: string;
  available: boolean;
}) {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const productId = cleanId(input.productId);

  if (!productId) {
    throw new Error("Produit introuvable.");
  }

  await ensureProductBelongsToRestaurant(productId, restaurant.id);

  const { error } = await supabase
    .from("menu_products")
    .update({
      is_available: input.available,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    throw new Error("Mise à jour de la disponibilité impossible.");
  }

  revalidateMenuPaths(restaurant.slug);

  return { ok: true };
}
