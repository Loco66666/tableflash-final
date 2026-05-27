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