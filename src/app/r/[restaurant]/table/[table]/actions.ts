"use server";

import { createClient } from "@/lib/supabase/server";
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

type MenuProductForOrder = {
  id: string;
  name: string;
  price: number | null;
  promo_price: number | null;
  is_available: boolean;
};

type LatestOrderNumber = {
  order_number: number | null;
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

type PublicRestaurantForReview = {
  id: string;
  status: string;
  google_review_url: string | null;
};

type PublicTableForReview = {
  id: string;
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

function normalizeMoney(value: number) {
  return Math.round(value * 100) / 100;
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

function mapDbStatusToCustomerStatus(status: string, paymentStatus: string): OrderStatus {
  if (status === "pending") return "new";
  if (status === "accepted") return paymentStatus === "paid" ? "paid" : "accepted";
  if (status === "preparing") return "preparing";
  if (status === "ready") return "ready";
  if (status === "served") return "served";
  if (status === "rejected" || status === "cancelled") return "refused";

  return "new";
}

export async function createPublicOrder(payload: CreatePublicOrderPayload): Promise<CreatePublicOrderResult> {
  const customerName = payload.customerName.trim();

  if (!customerName) {
    return { ok: false, message: "Le nom du client est obligatoire." };
  }

  const phone = payload.customerPhone?.trim();

  if (phone && !FRENCH_PHONE_REGEX.test(phone)) {
    return { ok: false, message: "Numéro de téléphone invalide." };
  }

  const normalizedItems = payload.items
    .map((item) => ({
      menuItemId: item.menuItemId,
      quantity: Math.floor(item.quantity),
    }))
    .filter((item) => item.menuItemId && item.quantity > 0);

  if (normalizedItems.length === 0) {
    return { ok: false, message: "Ajoutez au moins un produit avant de confirmer." };
  }

  const supabase = await createClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, status")
    .eq("slug", payload.restaurantSlug)
    .maybeSingle();

  if (restaurantError || !restaurant || !["active", "trial"].includes(restaurant.status)) {
    return {
      ok: false,
      message: "Ce restaurant n’accepte pas de commandes pour le moment.",
    };
  }

  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", payload.tableLabel)
    .eq("is_active", true)
    .returns<{ id: string }[]>()
    .maybeSingle();

  if (tableError || !table) {
    return {
      ok: false,
      message: "Cette table n’est pas disponible pour le moment.",
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

  const ids = [...new Set(normalizedItems.map((item) => item.menuItemId))];

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

  const missing = normalizedItems.some((item) => {
    const menuItem = byId.get(item.menuItemId);

    return !menuItem || !menuItem.is_available;
  });

  if (missing) {
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

  const { data: latestOrder, error: latestOrderError } = await supabase
    .from("orders")
    .select("order_number")
    .eq("restaurant_id", restaurant.id)
    .not("order_number", "is", null)
    .order("order_number", { ascending: false })
    .limit(1)
    .returns<LatestOrderNumber[]>()
    .maybeSingle();

  if (latestOrderError) {
    return {
      ok: false,
      message: "Impossible de préparer le numéro de commande.",
    };
  }

  const nextOrderNumber = Number(latestOrder?.order_number ?? 0) + 1;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurant.id,
      table_id: table.id,
      customer_name: customerName,
      customer_phone: phone || null,
      customer_note: payload.customerNote?.trim() || null,
      subtotal,
      total: subtotal,
      payment_status: "unpaid",
      status: "pending",
      order_number: nextOrderNumber,
    })
    .select("id, order_number")
    .returns<CreatedOrder[]>()
    .single();

  if (orderError || !order) {
    return {
      ok: false,
      message: "Impossible d’envoyer la commande pour le moment.",
    };
  }

  const orderItems = lines.map((line) => ({
    order_id: order.id,
    product_id: line.product_id,
    product_name: line.product_name,
    unit_price: line.unit_price,
    quantity: line.quantity,
    total: line.total,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    return {
      ok: false,
      message: "Impossible d’envoyer la commande pour le moment.",
    };
  }

  return {
    ok: true,
    message: "Votre commande a bien été transmise au restaurant.",
    orderId: order.id,
    orderNumber: order.order_number ?? nextOrderNumber,
  };
}

export async function getPublicOrderTracking(
  payload: GetPublicOrderTrackingPayload,
): Promise<GetPublicOrderTrackingResult> {
  if (!payload.orderId) {
    return {
      ok: false,
      message: "Commande introuvable.",
    };
  }

  const supabase = await createClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, status")
    .eq("slug", payload.restaurantSlug)
    .maybeSingle();

  if (restaurantError || !restaurant || !["active", "trial"].includes(restaurant.status)) {
    return {
      ok: false,
      message: "Restaurant indisponible.",
    };
  }

  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", payload.tableLabel)
    .eq("is_active", true)
    .returns<{ id: string }[]>()
    .maybeSingle();

  if (tableError || !table) {
    return {
      ok: false,
      message: "Table indisponible.",
    };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, total")
    .eq("id", payload.orderId)
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
  if (!payload.orderId) {
    return {
      ok: false,
      message: "Commande introuvable.",
    };
  }

  const rating = clampRating(payload.rating);
  const comment = payload.comment?.trim() || null;
  const suggestGoogle = rating >= 4;

  const supabase = await createClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, status, google_review_url")
    .eq("slug", payload.restaurantSlug)
    .returns<PublicRestaurantForReview[]>()
    .maybeSingle();

  if (restaurantError || !restaurant || !["active", "trial"].includes(restaurant.status)) {
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
      message: "Impossible de vérifier les paramètres d’avis.",
    };
  }

  if (settings?.reviews_enabled === false) {
    return {
      ok: false,
      message: "Les avis sont désactivés pour le moment.",
    };
  }

  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", payload.tableLabel)
    .eq("is_active", true)
    .returns<PublicTableForReview[]>()
    .maybeSingle();

  if (tableError || !table) {
    return {
      ok: false,
      message: "Table indisponible.",
    };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, restaurant_id, table_id, customer_name, status")
    .eq("id", payload.orderId)
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
      message: "Impossible d’envoyer votre avis pour le moment.",
    };
  }

  return {
    ok: true,
    message: "Merci, votre avis a été transmis au restaurant.",
    suggestGoogle,
    googleReviewUrl: restaurant.google_review_url ?? "",
  };
}