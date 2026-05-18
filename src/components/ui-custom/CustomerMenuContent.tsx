"use client";

import { useMemo, useState } from "react";
import { Cake, CupSoda, Heart, Leaf, Sparkles, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerCartBar } from "@/components/ui-custom/CustomerCartBar";
import { CustomerProductCard } from "@/components/ui-custom/CustomerProductCard";
import { CustomerTrackingPreview } from "@/components/ui-custom/CustomerTrackingPreview";
import { restaurantSettings } from "@/lib/data/seed";
import { useMenuStore } from "@/lib/local-store/menuStore";
import { useOrdersStore } from "@/lib/local-store/ordersStore";
import { useSettingsStore } from "@/lib/local-store/settingsStore";
import { useTablesStore } from "@/lib/local-store/tablesStore";
import { findTableBySlug, normalizeTables } from "@/lib/tables";
import type { Category, Order, Product, TableInfo } from "@/lib/types";
import { formatEuro } from "@/lib/utils";

type BasketLine = {
  product: Product;
  quantity: number;
};

const preferredCategoryOrder = ["starters", "mains", "desserts", "drinks"];
const fallbackCategoryNames = ["Entrées", "Plats", "Desserts", "Boissons"];

const categoryIcons: Record<string, LucideIcon> = {
  all: Sparkles,
  starters: Leaf,
  mains: Utensils,
  desserts: Cake,
  drinks: CupSoda,
};

function isCustomerOrderable(product: Product) {
  const withLegacyFields = product as Product & { isAvailable?: boolean; outOfStock?: boolean; stockStatus?: string; status?: string };
  const available = typeof withLegacyFields.isAvailable === "boolean" ? withLegacyFields.isAvailable : product.available;
  const stockWords = [withLegacyFields.stockStatus, withLegacyFields.status].filter(Boolean).map((value) => String(value).toLocaleLowerCase("fr-FR"));
  const markedUnavailable = withLegacyFields.outOfStock || stockWords.some((value) => value.includes("rupture") || value.includes("out"));
  return available === true && !markedUnavailable;
}

function getCategoryIcon(categoryId: string) {
  return categoryIcons[categoryId] ?? Sparkles;
}

function getVisibleCategories(categories: Category[]) {
  const allCategory = categories.find((category) => category.id === "all") ?? { id: "all", name: "Toutes", icon: "sparkles" };
  const businessCategories = categories.filter((category) => category.id !== "all");
  const sortedCategories = [...businessCategories].sort((first, second) => {
    const firstIndex = preferredCategoryOrder.indexOf(first.id);
    const secondIndex = preferredCategoryOrder.indexOf(second.id);
    if (firstIndex === -1 && secondIndex === -1) return first.name.localeCompare(second.name, "fr-FR");
    if (firstIndex === -1) return 1;
    if (secondIndex === -1) return -1;
    return firstIndex - secondIndex;
  });

  fallbackCategoryNames.forEach((name, index) => {
    const id = preferredCategoryOrder[index];
    if (!sortedCategories.some((category) => category.id === id)) {
      sortedCategories.splice(index, 0, { id, name, icon: id });
    }
  });

  return [allCategory, ...sortedCategories];
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getOrderTableNumber(table: TableInfo) {
  const match = table.name.match(/\d+/) ?? table.slug.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function createOrderNumber(existingOrders: Order[]) {
  const numericIds = existingOrders.map((order) => Number.parseInt(order.id, 10)).filter(Number.isFinite);
  const nextNumber = numericIds.length > 0 ? Math.max(...numericIds) + 1 : existingOrders.length + 1;
  return String(nextNumber).padStart(4, "0");
}

export function CustomerMenuContent({ restaurantSlug, tableSlug, initialTable }: { restaurantSlug: string; tableSlug: string; initialTable?: TableInfo }) {
  const { value: storedTables } = useTablesStore();
  const { value: menu } = useMenuStore();
  const { value: settings } = useSettingsStore();
  const { value: orders, setValue: setOrders } = useOrdersStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [note, setNote] = useState("");
  const [basketOpen, setBasketOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedOrderSnapshot, setConfirmedOrderSnapshot] = useState<Order | null>(null);

  const tables = normalizeTables(storedTables);
  const table = findTableBySlug(tableSlug, tables) ?? initialTable;
  const restaurantName = settings.publicSlug === restaurantSlug || restaurantSettings.publicSlug === restaurantSlug ? settings.restaurantName : restaurantSettings.restaurantName;
  const tableName = table?.name ?? "";
  const tableArea = table?.area ?? "";
  const subtitle = table ? (tableArea ? `${tableName} • ${tableArea}` : tableName) : "QR de table";
  const orderableProducts = useMemo(() => menu.products.filter(isCustomerOrderable), [menu.products]);
  const visibleCategories = useMemo(() => getVisibleCategories(menu.categories), [menu.categories]);
  const visibleProducts = selectedCategoryId === "all" ? orderableProducts : orderableProducts.filter((product) => product.categoryId === selectedCategoryId);
  const itemCount = basket.reduce((sum, line) => sum + line.quantity, 0);
  const basketTotal = basket.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const confirmedOrder = confirmedOrderId ? orders.find((order) => order.id === confirmedOrderId) ?? confirmedOrderSnapshot : null;

  function addToBasket(product: Product) {
    setValidationMessage("");
    setBasket((currentBasket) => {
      const existingLine = currentBasket.find((line) => line.product.id === product.id);
      if (existingLine) {
        return currentBasket.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...currentBasket, { product, quantity: 1 }];
    });
  }

  function increaseQuantity(productId: string) {
    setBasket((currentBasket) => currentBasket.map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line)));
  }

  function decreaseQuantity(productId: string) {
    setBasket((currentBasket) =>
      currentBasket.flatMap((line) => {
        if (line.product.id !== productId) return [line];
        if (line.quantity <= 1) return [];
        return [{ ...line, quantity: line.quantity - 1 }];
      }),
    );
  }

  function removeItem(productId: string) {
    setBasket((currentBasket) => currentBasket.filter((line) => line.product.id !== productId));
  }

  function confirmOrder() {
    if (!table || basket.length === 0) {
      setValidationMessage("Ajoutez au moins un produit avant de confirmer.");
      setBasketOpen(true);
      return;
    }

    const orderId = createOrderNumber(orders);
    const itemTotal = basket.reduce((sum, line) => sum + line.quantity, 0);
    const nextOrder: Order = {
      id: orderId,
      table: getOrderTableNumber(table),
      tableId: table.id,
      tableSlug: table.slug,
      tableName: table.name,
      tableArea: table.area,
      restaurantSlug,
      status: "new",
      items: itemTotal,
      total: basketTotal,
      paid: false,
      paymentStatus: "on_site_pending",
      paymentMethod: "on_site",
      customerNote: note.trim() || undefined,
      serviceDate: getTodayDate(),
      serviceTime: getCurrentTime(),
      service: "midi",
      lines: basket.map((line) => ({ productId: line.product.id, quantity: line.quantity, name: line.product.name, unitPrice: line.product.price })),
      source: "qr",
    };

    setOrders((currentOrders) => [nextOrder, ...currentOrders]);
    setConfirmedOrderId(nextOrder.id);
    setConfirmedOrderSnapshot(nextOrder);
    setBasket([]);
    setNote("");
    setValidationMessage("");
    setBasketOpen(false);
  }

  if (!table) {
    return (
      <AppShell showNav={false}>
        <PageHeader title={restaurantName} subtitle="QR de table" customer />
        <section className="rounded-[1.6rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 text-center shadow-card">
          <Heart className="mx-auto mb-5 size-14 text-emerald-800" />
          <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950">Table introuvable</h1>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">Demandez un nouveau QR à l’équipe.</p>
        </section>
      </AppShell>
    );
  }

  if (confirmedOrder) {
    return (
      <AppShell showNav={false}>
        <PageHeader title={restaurantName} subtitle={subtitle} customer />
        <section className="mb-6 rounded-[1.6rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 text-center shadow-card">
          <span className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-emerald-700 text-white"><Heart className="size-11" /></span>
          <h1 className="text-4xl font-black tracking-[-0.05em] text-emerald-900">Commande envoyée</h1>
          <p className="mt-2 text-xl font-bold text-slate-800">{tableName}</p>
          <p className="mt-1 text-3xl font-black text-emerald-800">{formatEuro(confirmedOrder.total)}</p>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">L’équipe va valider votre commande.</p>
          <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-base font-bold text-slate-700 shadow-card">Paiement sur place</p>
        </section>
        <CustomerTrackingPreview tableName={tableName} tableArea={tableArea} total={confirmedOrder.total} order={confirmedOrder} settings={settings} />
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false} className="pb-32">
      <PageHeader title={restaurantName} subtitle={subtitle} customer />
      <section className="mb-6 rounded-[1.25rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-card">
        <div className="flex min-h-14 items-center gap-4 text-lg text-slate-700">
          <Heart className="size-8 shrink-0 text-emerald-800" />
          <div className="min-w-0">
            <p className="font-bold text-slate-950">{tableName}</p>
            {tableArea ? <p className="text-base font-semibold text-slate-600">{tableArea}</p> : null}
            <p className="mt-2 text-xl font-black tracking-[-0.03em] text-emerald-900">Commandez à votre rythme</p>
          </div>
        </div>
      </section>
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Catégories du menu">
        {visibleCategories.map((category) => {
          const Icon = getCategoryIcon(category.id);
          const active = selectedCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={(active ? "bg-emerald-700 text-white shadow-green" : "border border-slate-200 bg-white text-slate-700 shadow-card") + " flex min-h-14 shrink-0 items-center gap-2 rounded-full px-5 text-lg font-semibold"}
              aria-pressed={active}
            >
              <Icon className="size-5" />
              {category.name}
            </button>
          );
        })}
      </div>
      {visibleProducts.length > 0 ? (
        <div className="grid gap-4">
          {visibleProducts.map((product) => <CustomerProductCard key={product.id} product={product} onAdd={addToBasket} />)}
        </div>
      ) : (
        <section className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-card">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-emerald-900">Aucun produit disponible dans cette catégorie</h2>
        </section>
      )}
      <CustomerCartBar
        itemCount={itemCount}
        total={basketTotal}
        lines={basket}
        note={note}
        validationMessage={validationMessage}
        isOpen={basketOpen}
        onOpen={() => setBasketOpen(true)}
        onClose={() => setBasketOpen(false)}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
        onRemove={removeItem}
        onNoteChange={setNote}
        onConfirm={confirmOrder}
      />
    </AppShell>
  );
}
