"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import type { OrderStatus } from "@/lib/types";

type OrderCartItemPayload = {
  menuItemId: string;
  quantity: number;
};

type CreatePublicOrderPayload = {
  restaurantSlug: string;
  tableLabel: string;
  customerName: string;
  customerPhone?: string;
  customerNote?: string;
  orderType?: "dine_in" | "takeaway";
  items: OrderCartItemPayload[];
};

type CreatePublicOrderResult = {
  ok: boolean;
  message: string;
  orderId?: string;
  orderNumber?: number;
};

type GetPublicOrderTrackingPayload = {
  restaurantSlug: string;
  tableLabel: string;
  orderId: string;
};

type SubmitPublicReviewPayload = {
  restaurantSlug: string;
  tableLabel: string;
  orderId: string;
  rating: number;
  comment?: string;
};

type SubmitPublicReviewResult = {
  ok: boolean;
  message: string;
  alreadySubmitted?: boolean;
  suggestGoogle?: boolean;
  googleReviewUrl?: string;
};

type PublicOrderTracking = {
  id: string;
  orderNumber: number | null;
  status: OrderStatus;
  total: number;
};

type GetPublicOrderTrackingResult = {
  ok: boolean;
  message: string;
  order?: PublicOrderTracking;
};

type PublicRestaurantForOrder = {
  id: string;
  status: string;
};

type PublicRestaurantForReview = {
  id: string;
  status: string;
  google_review_url: string | null;
};

type PublicTable = {
  id: string;
};

type MenuProductForOrder = {
  id: string;
  name: string;
  price: number | null;
  promo_price: number | null;
  is_available: boolean;
};

type CreatedOrder = {
  id: string;
  order_number: number | null;
};

type TrackedOrderRow = {
  id: string;
  order_number: number | null;
  status: string;
  payment_status: string;
  total: number | null;
};

type PublicOrderForReview = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  customer_name: string | null;
  status: string;
};

type ExistingReviewRow = {
  id: string;
  rating: number;
  suggest_google: boolean;
};

const FRENCH_PHONE_REGEX = /^(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
const ACTIVE_RESTAURANT_STATUSES = ["active", "trial"];
const MAX_CART_LINES = 50;
const MAX_ITEM_QUANTITY = 99;
const MAX_CUSTOMER_NAME_LENGTH = 80;
const MAX_CUSTOMER_NOTE_LENGTH = 500;
const MAX_REVIEW_COMMENT_LENGTH = 1000;
const DEFAULT_ORDER_TYPE: CreatePublicOrderPayload["orderType"] = "dine_in";
const PUBLIC_ORDER_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const PUBLIC_ORDER_RATE_LIMIT_MAX_REQUESTS = 5;
const PUBLIC_REVIEW_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const PUBLIC_REVIEW_RATE_LIMIT_MAX_REQUESTS = 6;

function cleanText(value: string) {
  return value.trim();
}

function cleanOptionalText(value?: string | null) {
  const cleaned = value?.trim();

  return cleaned ? cleaned : null;
}

function cleanId(value: string) {
  return value.trim();
}

function normalizeMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function moneyToCents(value: number) {
  return Math.round(normalizeMoney(value) * 100);
}

function normalizeOrderType(value: CreatePublicOrderPayload["orderType"]) {
  return value === "takeaway" ? "takeaway" : DEFAULT_ORDER_TYPE;
}

async function getPublicRequestIp() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headersList.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

async function checkPublicActionRateLimit(input: {
  prefix: string;
  restaurantSlug: string;
  tableLabel: string;
  limit: number;
  windowMs: number;
  extraKey?: string;
}) {
  const ip = await getPublicRequestIp();
  const keyParts = [ip, cleanId(input.restaurantSlug), cleanId(input.tableLabel), input.extraKey]
    .filter(Boolean)
    .join(":");

  return checkRateLimit({
    key: keyParts,
    limit: input.limit,
    windowMs: input.windowMs,
    prefix: input.prefix,
  });
}

function getEffectivePrice(product: MenuProductForOrder) {
  const promoPrice = Number(product.promo_price ?? 0);

  if (promoPrice > 0) {
    return normalizeMoney(promoPrice);
  }

  return normalizeMoney(Number(product.price ?? 0));
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 5;
  if (value <= 1) return 1;
  if (value >= 5) return 5;

  return Math.round(value);
}

function isRestaurantAvailable(status: string) {
  return ACTIVE_RESTAURANT_STATUSES.includes(status);
}

function mapDbStatusToCustomerStatus(status: string, paymentStatus: string): OrderStatus {
  if (status === "pending") return "new";
  if (status === "accepted") return paymentStatus === "paid" ? "paid" : "accepted";
  if (status === "preparing") return "preparing";
  if (status === "ready") return "ready";
  if (status === "served") return "served";
  if (status === "rejected" || status === "cancelled") return "refused";

  return "new";
}

function normalizeCartItems(items: OrderCartItemPayload[]) {
  const quantitiesByProductId = new Map<string, number>();

  for (const item of items) {
    const menuItemId = cleanId(item.menuItemId);
    const quantity = Math.floor(Number(item.quantity));

    if (!menuItemId || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    const currentQuantity = quantitiesByProductId.get(menuItemId) ?? 0;
    const nextQuantity = Math.min(currentQuantity + quantity, MAX_ITEM_QUANTITY);

    quantitiesByProductId.set(menuItemId, nextQuantity);
  }

  return [...quantitiesByProductId.entries()].slice(0, MAX_CART_LINES).map(([menuItemId, quantity]) => ({
    menuItemId,
    quantity,
  }));
}

async function getPublicRestaurantForOrder(restaurantSlug: string) {
  const supabase = createAdminClient();
  const slug = cleanId(restaurantSlug);

  if (!slug) {
    return null;
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, status")
    .eq("slug", slug)
    .returns<PublicRestaurantForOrder[]>()
    .maybeSingle();

  if (error || !data || !isRestaurantAvailable(data.status)) {
    return null;
  }

  return data;
}

async function getPublicRestaurantForReview(restaurantSlug: string) {
  const supabase = createAdminClient();
  const slug = cleanId(restaurantSlug);

  if (!slug) {
    return null;
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, status, google_review_url")
    .eq("slug", slug)
    .returns<PublicRestaurantForReview[]>()
    .maybeSingle();

  if (error || !data || !isRestaurantAvailable(data.status)) {
    return null;
  }

  return data;
}

async function getPublicTable(restaurantId: string, tableLabel: string) {
  const supabase = createAdminClient();
  const tableSlug = cleanId(tableLabel);

  if (!tableSlug) {
    return null;
  }

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("slug", tableSlug)
    .eq("is_active", true)
    .returns<PublicTable[]>()
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function createPublicOrder(payload: CreatePublicOrderPayload): Promise<CreatePublicOrderResult> {
  const customerName = cleanText(payload.customerName);
  const tableLabel = cleanId(payload.tableLabel);
  const orderType = normalizeOrderType(payload.orderType);

  if (!customerName) {
    return { ok: false, message: "Le nom du client est obligatoire." };
  }

  if (customerName.length > MAX_CUSTOMER_NAME_LENGTH) {
    return { ok: false, message: "Le nom du client est trop long." };
  }

  const phone = cleanOptionalText(payload.customerPhone);

  if (phone && !FRENCH_PHONE_REGEX.test(phone)) {
    return { ok: false, message: "Numéro de téléphone invalide." };
  }

  const customerNote = cleanOptionalText(payload.customerNote);

  if (customerNote && customerNote.length > MAX_CUSTOMER_NOTE_LENGTH) {
    return { ok: false, message: "La note est trop longue." };
  }

  const normalizedItems = normalizeCartItems(payload.items);

  if (normalizedItems.length === 0) {
    return { ok: false, message: "Ajoutez au moins un produit avant de confirmer." };
  }

  const supabase = createAdminClient();

  const restaurant = await getPublicRestaurantForOrder(payload.restaurantSlug);

  if (!restaurant) {
    return {
      ok: false,
      message: "Ce restaurant n'accepte pas de commandes pour le moment.",
    };
  }

  const table = await getPublicTable(restaurant.id, tableLabel);

  if (!table) {
    return {
      ok: false,
      message: "Cette table n'est pas disponible pour le moment.",
    };
  }

  const rateLimit = await checkPublicActionRateLimit({
    prefix: "public-order-create",
    restaurantSlug: payload.restaurantSlug,
    tableLabel,
    limit: PUBLIC_ORDER_RATE_LIMIT_MAX_REQUESTS,
    windowMs: PUBLIC_ORDER_RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false,
      message: "Trop de commandes envoyees depuis cette table. Patientez quelques minutes avant de reessayer.",
    };
  }

  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select("orders_enabled")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (settingsError) {
    return {
      ok: false,
      message: "Impossible de vérifier les paramètres du restaurant.",
    };
  }

  if (settings?.orders_enabled === false) {
    return {
      ok: false,
      message: "Les commandes sont désactivées pour le moment.",
    };
  }

  const ids = normalizedItems.map((item) => item.menuItemId);

  const { data: menuItems, error: menuItemsError } = await supabase
    .from("menu_products")
    .select("id, name, price, promo_price, is_available")
    .eq("restaurant_id", restaurant.id)
    .in("id", ids)
    .returns<MenuProductForOrder[]>();

  if (menuItemsError) {
    return {
      ok: false,
      message: "Impossible de vérifier les produits du menu.",
    };
  }

  const byId = new Map((menuItems ?? []).map((item) => [item.id, item]));

  const hasUnavailableItem = normalizedItems.some((item) => {
    const menuItem = byId.get(item.menuItemId);

    return !menuItem || !menuItem.is_available || getEffectivePrice(menuItem) <= 0;
  });

  if (hasUnavailableItem) {
    return {
      ok: false,
      message: "Un ou plusieurs produits ne sont plus disponibles.",
    };
  }

  const lines = normalizedItems.map((item) => {
    const menuItem = byId.get(item.menuItemId)!;
    const unitPrice = getEffectivePrice(menuItem);
    const total = normalizeMoney(unitPrice * item.quantity);

    return {
      product_id: menuItem.id,
      product_name: menuItem.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      total,
    };
  });

  const subtotal = normalizeMoney(lines.reduce((sum, line) => sum + line.total, 0));
  const subtotalCents = moneyToCents(subtotal);

  if (subtotal <= 0) {
    return {
      ok: false,
      message: "Le total de la commande est invalide.",
    };
  }

  const orderPayload = {
    restaurant_id: restaurant.id,
    table_id: table.id,
    table_label: tableLabel,
    order_type: orderType,
    customer_name: customerName,
    customer_phone: phone,
    customer_note: customerNote,
    subtotal,
    total: subtotal,
    subtotal_cents: subtotalCents,
    total_cents: subtotalCents,
    currency: "EUR",
    payment_method: "physical",
    payment_status: "unpaid",
    status: "pending",
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select("id, order_number")
    .returns<CreatedOrder[]>()
    .single();

  if (orderError || !order) {
    console.error("[public/orders] order insert failed", {
      restaurantId: restaurant.id,
      tableId: table.id,
      errorCode: orderError?.code,
      errorMessage: orderError?.message,
    });

    return {
      ok: false,
      message: "Impossible d'envoyer la commande pour le moment.",
    };
  }

  const orderItems = lines.map((line) => ({
    order_id: order.id,
    restaurant_id: restaurant.id,
    product_id: line.product_id,
    menu_item_id: line.product_id,
    product_name: line.product_name,
    name: line.product_name,
    unit_price: line.unit_price,
    unit_price_cents: moneyToCents(line.unit_price),
    quantity: line.quantity,
    total: line.total,
    total_cents: moneyToCents(line.total),
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id).eq("restaurant_id", restaurant.id);

    console.error("[public/orders] order items insert failed", {
      restaurantId: restaurant.id,
      orderId: order.id,
      orderNumber: order.order_number,
      errorCode: itemsError.code,
      errorMessage: itemsError.message,
    });

    return {
      ok: false,
      message: "Impossible d'envoyer la commande pour le moment.",
    };
  }

  return {
    ok: true,
    message: "Votre commande a bien été transmise au restaurant.",
    orderId: order.id,
    orderNumber: order.order_number ?? undefined,
  };
}

export async function getPublicOrderTracking(
  payload: GetPublicOrderTrackingPayload,
): Promise<GetPublicOrderTrackingResult> {
  const orderId = cleanId(payload.orderId);

  if (!orderId) {
    return {
      ok: false,
      message: "Commande introuvable.",
    };
  }

  const supabase = createAdminClient();

  const restaurant = await getPublicRestaurantForOrder(payload.restaurantSlug);

  if (!restaurant) {
    return {
      ok: false,
      message: "Restaurant indisponible.",
    };
  }

  const table = await getPublicTable(restaurant.id, payload.tableLabel);

  if (!table) {
    return {
      ok: false,
      message: "Table indisponible.",
    };
  }

  const rateLimit = await checkPublicActionRateLimit({
    prefix: "public-review-submit",
    restaurantSlug: payload.restaurantSlug,
    tableLabel: payload.tableLabel,
    extraKey: orderId,
    limit: PUBLIC_REVIEW_RATE_LIMIT_MAX_REQUESTS,
    windowMs: PUBLIC_REVIEW_RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false,
      message: "Trop d'avis envoyes depuis cette table. Patientez quelques minutes avant de reessayer.",
    };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total")
    .eq("id", orderId)
    .eq("restaurant_id", restaurant.id)
    .eq("table_id", table.id)
    .returns<TrackedOrderRow[]>()
    .maybeSingle();

  if (orderError || !order) {
    return {
      ok: false,
      message: "Commande introuvable.",
    };
  }

  return {
    ok: true,
    message: "Suivi de commande chargé.",
    order: {
      id: order.id,
      orderNumber: order.order_number,
      status: mapDbStatusToCustomerStatus(order.status, order.payment_status),
      total: Number(order.total ?? 0),
    },
  };
}

export async function submitPublicReview(payload: SubmitPublicReviewPayload): Promise<SubmitPublicReviewResult> {
  const orderId = cleanId(payload.orderId);

  if (!orderId) {
    return {
      ok: false,
      message: "Commande introuvable.",
    };
  }

  const rating = clampRating(payload.rating);
  const comment = cleanOptionalText(payload.comment);
  const suggestGoogle = rating >= 4;

  if (comment && comment.length > MAX_REVIEW_COMMENT_LENGTH) {
    return {
      ok: false,
      message: "Le commentaire est trop long.",
    };
  }

  const supabase = createAdminClient();

  const restaurant = await getPublicRestaurantForReview(payload.restaurantSlug);

  if (!restaurant) {
    return {
      ok: false,
      message: "Restaurant indisponible.",
    };
  }

  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select("reviews_enabled")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (settingsError) {
    return {
      ok: false,
      message: "Impossible de vérifier les paramètres d'avis.",
    };
  }

  if (settings?.reviews_enabled === false) {
    return {
      ok: false,
      message: "Les avis sont désactivés pour le moment.",
    };
  }

  const table = await getPublicTable(restaurant.id, payload.tableLabel);

  if (!table) {
    return {
      ok: false,
      message: "Table indisponible.",
    };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, restaurant_id, table_id, customer_name, status")
    .eq("id", orderId)
    .eq("restaurant_id", restaurant.id)
    .eq("table_id", table.id)
    .returns<PublicOrderForReview[]>()
    .maybeSingle();

  if (orderError || !order) {
    return {
      ok: false,
      message: "Commande introuvable.",
    };
  }

  if (order.status !== "served") {
    return {
      ok: false,
      message: "Vous pourrez laisser un avis après le service.",
    };
  }

  const { data: existingReview, error: existingReviewError } = await supabase
    .from("restaurant_reviews")
    .select("id, rating, suggest_google")
    .eq("restaurant_id", restaurant.id)
    .eq("order_id", order.id)
    .limit(1)
    .returns<ExistingReviewRow[]>()
    .maybeSingle();

  if (existingReviewError) {
    return {
      ok: false,
      message: "Impossible de vérifier votre avis.",
    };
  }

  if (existingReview) {
    return {
      ok: true,
      message: "Votre avis a déjà été transmis. Merci !",
      alreadySubmitted: true,
      suggestGoogle: existingReview.suggest_google || existingReview.rating >= 4,
      googleReviewUrl: restaurant.google_review_url ?? "",
    };
  }

  const { error: reviewError } = await supabase.from("restaurant_reviews").insert({
    restaurant_id: restaurant.id,
    order_id: order.id,
    table_id: table.id,
    customer_name: order.customer_name || "Client",
    rating,
    comment,
    status: "pending",
    response: null,
    response_saved: false,
    suggest_google: suggestGoogle,
  });

  if (reviewError) {
    console.error("[public/reviews] submit review failed", {
      restaurantId: restaurant.id,
      orderId: order.id,
      tableId: table.id,
      errorCode: reviewError.code,
      errorMessage: reviewError.message,
    });

    return {
      ok: false,
      message: "Impossible d'envoyer votre avis pour le moment.",
    };
  }

  return {
    ok: true,
    message: "Merci, votre avis a été transmis au restaurant.",
    suggestGoogle,
    googleReviewUrl: restaurant.google_review_url ?? "",
  };
}
