"use server";

import { createClient } from "@/lib/supabase/server";

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
};

const FRENCH_PHONE_REGEX = /^(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

export async function createPublicOrder(payload: CreatePublicOrderPayload): Promise<CreatePublicOrderResult> {
  const customerName = payload.customerName.trim();
  if (!customerName) return { ok: false, message: "Le nom du client est obligatoire." };
  const phone = payload.customerPhone?.trim();
  if (phone && !FRENCH_PHONE_REGEX.test(phone)) return { ok: false, message: "Numéro de téléphone invalide." };

  const normalizedItems = payload.items
    .map((item) => ({ menuItemId: item.menuItemId, quantity: Math.floor(item.quantity) }))
    .filter((item) => item.menuItemId && item.quantity > 0);
  if (normalizedItems.length === 0) return { ok: false, message: "Ajoutez au moins un produit avant de confirmer." };

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, status")
    .eq("slug", payload.restaurantSlug)
    .maybeSingle();
  if (!restaurant || !["active", "trial"].includes(restaurant.status)) {
    return { ok: false, message: "Ce restaurant n’accepte pas de commandes pour le moment." };
  }

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("orders_enabled")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (settings?.orders_enabled === false) return { ok: false, message: "Les commandes sont désactivées pour le moment." };

  const ids = [...new Set(normalizedItems.map((item) => item.menuItemId))];
  const { data: menuItems } = await supabase
    .from("menu_products")
    .select("id, name, price_cents, is_available")
    .eq("restaurant_id", restaurant.id)
    .in("id", ids);

  const byId = new Map((menuItems ?? []).map((item) => [item.id, item]));
  const missing = normalizedItems.some((item) => {
    const menuItem = byId.get(item.menuItemId);
    return !menuItem || !menuItem.is_available;
  });
  if (missing) return { ok: false, message: "Un ou plusieurs produits ne sont plus disponibles." };

  const lines = normalizedItems.map((item) => {
    const menuItem = byId.get(item.menuItemId)!;
    const unitPriceCents = menuItem.price_cents ?? 0;
    return {
      menu_item_id: menuItem.id,
      restaurant_id: restaurant.id,
      name: menuItem.name,
      quantity: item.quantity,
      unit_price_cents: unitPriceCents,
      total_cents: unitPriceCents * item.quantity,
    };
  });
  const subtotalCents = lines.reduce((sum, line) => sum + line.total_cents, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurant.id,
      table_label: payload.tableLabel,
      customer_name: customerName,
      customer_phone: phone || null,
      customer_note: payload.customerNote?.trim() || null,
      order_type: payload.orderType === "takeaway" ? "takeaway" : "dine_in",
      subtotal_cents: subtotalCents,
      total_cents: subtotalCents,
      currency: "EUR",
      payment_method: "physical",
      payment_status: "unpaid",
      status: "pending",
    })
    .select("id")
    .single();
  if (orderError || !order) return { ok: false, message: "Impossible d’envoyer la commande pour le moment." };

  const { error: itemsError } = await supabase.from("order_items").insert(lines.map((line) => ({ ...line, order_id: order.id })));
  if (itemsError) return { ok: false, message: "Impossible d’envoyer la commande pour le moment." };

  return { ok: true, message: "Votre commande a bien été transmise au restaurant.", orderId: order.id };
}
