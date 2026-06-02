"use client";

import { useEffect, useMemo, useState } from "react";
import { Cake, CupSoda, Heart, Leaf, Sparkles, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerCartBar } from "@/components/ui-custom/CustomerCartBar";
import { CustomerProductCard } from "@/components/ui-custom/CustomerProductCard";
import { CustomerTrackingPreview } from "@/components/ui-custom/CustomerTrackingPreview";
import {
  createPublicOrder,
  getPublicOrderTracking,
  submitPublicReview,
} from "@/app/r/[restaurant]/table/[table]/actions";
import type { Category, Order, Product, TableInfo } from "@/lib/types";
import { formatEuro } from "@/lib/utils";

type SelectedBasketOption = {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  price: number;
};

type BasketLine = {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  options: SelectedBasketOption[];
};

type PublicMenuPayload = {
  restaurantName: string;
  restaurantCity: string | null;
  status: "active" | "trial" | "suspended" | "archived";
  ordersEnabled: boolean;
  reviewsEnabled: boolean;
  googleReviewUrl: string;
  categories: Category[];
  products: Product[];
};

const preferredCategoryOrder = ["starters", "mains", "desserts", "drinks"];

const categoryIcons: Record<string, LucideIcon> = {
  all: Sparkles,
  starters: Leaf,
  mains: Utensils,
  desserts: Cake,
  drinks: CupSoda,
  uncategorized: Sparkles,
};

function isCustomerOrderable(product: Product) {
  const withLegacyFields = product as Product & {
    isAvailable?: boolean;
    outOfStock?: boolean;
    stockStatus?: string;
    status?: string;
  };

  const available = typeof withLegacyFields.isAvailable === "boolean" ? withLegacyFields.isAvailable : product.available;
  const stockWords = [withLegacyFields.stockStatus, withLegacyFields.status]
    .filter(Boolean)
    .map((value) => String(value).toLocaleLowerCase("fr-FR"));

  const markedUnavailable =
    withLegacyFields.outOfStock || stockWords.some((value) => value.includes("rupture") || value.includes("out"));

  return available === true && !markedUnavailable;
}

function getCategoryIcon(categoryId: string) {
  return categoryIcons[categoryId] ?? Sparkles;
}

function getVisibleCategories(categories: Category[]) {
  const allCategory = categories.find((category) => category.id === "all") ?? {
    id: "all",
    name: "Toutes",
    icon: "sparkles",
  };

  const businessCategories = categories.filter((category) => category.id !== "all");
  const sortedCategories = [...businessCategories].sort((first, second) => {
    const firstIndex = preferredCategoryOrder.indexOf(first.id);
    const secondIndex = preferredCategoryOrder.indexOf(second.id);

    if (firstIndex === -1 && secondIndex === -1) {
      return first.name.localeCompare(second.name, "fr-FR");
    }

    if (firstIndex === -1) return 1;
    if (secondIndex === -1) return -1;

    return firstIndex - secondIndex;
  });

  return [allCategory, ...sortedCategories];
}

function getEffectiveProductPrice(product: Product) {
  if (typeof product.promoPrice === "number" && product.promoPrice > 0) {
    return product.promoPrice;
  }

  return product.price;
}

function getProductOptionGroups(product: Product) {
  return product.optionsConfig?.groups?.filter((group) => group.items.length > 0) ?? [];
}

function hasProductOptions(product: Product) {
  return getProductOptionGroups(product).length > 0;
}

function getSelectedOptions(product: Product, selectedOptionIds: Record<string, string[]>): SelectedBasketOption[] {
  return getProductOptionGroups(product).flatMap((group) => {
    const selectedIds = selectedOptionIds[group.id] ?? [];

    return group.items
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => ({
        groupId: group.id,
        groupName: group.name,
        itemId: item.id,
        itemName: item.name,
        price: Number(item.price ?? 0),
      }));
  });
}

function getOptionsTotal(options: SelectedBasketOption[]) {
  return options.reduce((sum, option) => sum + option.price, 0);
}

function buildBasketLineId(productId: string, options: SelectedBasketOption[]) {
  const optionKey = options.map((option) => `${option.groupId}:${option.itemId}`).join("|");
  return optionKey ? `${productId}::${optionKey}` : productId;
}

function getTableNumber(tableName: string) {
  const match = tableName.match(/\d+/);

  return match ? Number(match[0]) : 0;
}

function buildTrackedOrder({
  id,
  orderNumber,
  status,
  total,
  table,
  restaurantSlug,
}: {
  id: string;
  orderNumber: number | null;
  status: Order["status"];
  total: number;
  table: TableInfo;
  restaurantSlug: string;
}): Order {
  const isPaidStatus = status === "paid" || status === "preparing" || status === "ready" || status === "served";

  return {
    id,
    orderNumber: orderNumber ?? undefined,
    table: getTableNumber(table.name),
    tableId: table.id,
    tableSlug: table.slug,
    tableName: table.name,
    tableArea: table.area,
    restaurantSlug,
    status,
    items: 0,
    total,
    paid: isPaidStatus,
    paymentStatus: isPaidStatus ? "paid" : "on_site_pending",
    paymentMethod: "on_site",
    serviceDate: new Date().toISOString().slice(0, 10),
    source: "qr",
  };
}

export function CustomerMenuContent({
  restaurantSlug,
  tableSlug,
  initialTable,
  publicMenu,
}: {
  restaurantSlug: string;
  tableSlug: string;
  initialTable?: TableInfo;
  publicMenu: PublicMenuPayload;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [basketOpen, setBasketOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<number | null>(null);
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState<number | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string[]>>({});
  const [optionValidationMessage, setOptionValidationMessage] = useState("");

  const table = initialTable;
  const tableName = table?.name ?? "";
  const tableArea = table?.area ?? "";
  const restaurantName = publicMenu.restaurantName;
  const subtitle = table ? (tableArea ? `${tableName} • ${tableArea}` : tableName) : "QR de table";
  const orderableProducts = useMemo(() => publicMenu.products.filter(isCustomerOrderable), [publicMenu.products]);
  const visibleCategories = useMemo(() => getVisibleCategories(publicMenu.categories), [publicMenu.categories]);

  const visibleProducts =
    selectedCategoryId === "all"
      ? orderableProducts
      : orderableProducts.filter((product) => product.categoryId === selectedCategoryId);

  const itemCount = basket.reduce((sum, line) => sum + line.quantity, 0);
  const basketTotal = basket.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const ordersEnabled = publicMenu.ordersEnabled;

  useEffect(() => {
    if (!confirmedOrderId || !table) return;

    const orderId = confirmedOrderId;
    const currentTable = table;
    let cancelled = false;

    async function refreshTracking() {
      const result = await getPublicOrderTracking({
        restaurantSlug,
        tableLabel: tableSlug,
        orderId,
      });

      if (cancelled || !result.ok || !result.order) {
        return;
      }

      setTrackedOrder(
        buildTrackedOrder({
          id: result.order.id,
          orderNumber: result.order.orderNumber,
          status: result.order.status,
          total: result.order.total,
          table: currentTable,
          restaurantSlug,
        }),
      );

      setConfirmedOrderNumber(result.order.orderNumber ?? null);
      setConfirmedOrderTotal(result.order.total);
    }

    refreshTracking();

    const timer = window.setInterval(refreshTracking, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [confirmedOrderId, restaurantSlug, tableSlug, table]);

  function addConfiguredProductToBasket(product: Product, options: SelectedBasketOption[]) {
    const unitPrice = getEffectiveProductPrice(product) + getOptionsTotal(options);
    const lineId = buildBasketLineId(product.id, options);

    setValidationMessage("");
    setBasket((currentBasket) => {
      const existingLine = currentBasket.find((line) => line.id === lineId);

      if (existingLine) {
        return currentBasket.map((line) => (line.id === lineId ? { ...line, quantity: line.quantity + 1 } : line));
      }

      return [...currentBasket, { id: lineId, product, quantity: 1, unitPrice, options }];
    });
  }

  function addToBasket(product: Product) {
    if (!hasProductOptions(product)) {
      addConfiguredProductToBasket(product, []);
      return;
    }

    setOptionValidationMessage("");
    setSelectedOptionIds({});
    setCustomizingProduct(product);
  }

  function toggleOption(groupId: string, itemId: string, multiple: boolean) {
    setSelectedOptionIds((current) => {
      const currentGroupValues = current[groupId] ?? [];

      if (!multiple) {
        return {
          ...current,
          [groupId]: [itemId],
        };
      }

      const nextValues = currentGroupValues.includes(itemId)
        ? currentGroupValues.filter((value) => value !== itemId)
        : [...currentGroupValues, itemId];

      return {
        ...current,
        [groupId]: nextValues,
      };
    });
  }

  function confirmCustomizedProduct() {
    if (!customizingProduct) return;

    const groups = getProductOptionGroups(customizingProduct);
    const missingRequiredGroup = groups.find(
      (group) => group.required && (selectedOptionIds[group.id] ?? []).length === 0,
    );

    if (missingRequiredGroup) {
      setOptionValidationMessage(`Choisissez une option pour ${missingRequiredGroup.name}.`);
      return;
    }

    const options = getSelectedOptions(customizingProduct, selectedOptionIds);

    addConfiguredProductToBasket(customizingProduct, options);
    setCustomizingProduct(null);
    setSelectedOptionIds({});
    setOptionValidationMessage("");
  }

  function increaseQuantity(lineId: string) {
    setBasket((currentBasket) =>
      currentBasket.map((line) => (line.id === lineId ? { ...line, quantity: line.quantity + 1 } : line)),
    );
  }

  function decreaseQuantity(lineId: string) {
    setBasket((currentBasket) =>
      currentBasket.flatMap((line) => {
        if (line.id !== lineId) return [line];
        if (line.quantity <= 1) return [];
        return [{ ...line, quantity: line.quantity - 1 }];
      }),
    );
  }

  function removeItem(lineId: string) {
    setBasket((currentBasket) => currentBasket.filter((line) => line.id !== lineId));
  }

  async function confirmOrder() {
    if (!table || basket.length === 0) {
      setValidationMessage("Ajoutez au moins un produit avant de confirmer.");
      setBasketOpen(true);
      return;
    }

    if (!customerName.trim()) {
      setValidationMessage("Le nom du client est obligatoire.");
      setBasketOpen(true);
      return;
    }

    if (!ordersEnabled) {
      setValidationMessage("Les commandes sont désactivées pour le moment.");
      setBasketOpen(true);
      return;
    }

    setIsSubmitting(true);

    const result = await createPublicOrder({
      restaurantSlug,
      tableLabel: tableSlug,
      customerName,
      customerPhone,
      customerNote: note,
      orderType: "dine_in",
      items: basket.map((line) => ({
        menuItemId: line.product.id,
        quantity: line.quantity,
      })),
    });

    setIsSubmitting(false);

    if (!result.ok || !result.orderId) {
      setValidationMessage(result.message);
      setBasketOpen(true);
      return;
    }

    setConfirmedOrderId(result.orderId);
    setConfirmedOrderNumber(result.orderNumber ?? null);
    setConfirmedOrderTotal(basketTotal);
    setTrackedOrder(
      buildTrackedOrder({
        id: result.orderId,
        orderNumber: result.orderNumber ?? null,
        status: "new",
        total: basketTotal,
        table,
        restaurantSlug,
      }),
    );
    setBasket([]);
    setNote("");
    setCustomerName("");
    setCustomerPhone("");
    setValidationMessage("");
    setBasketOpen(false);
  }

  async function sendCustomerReview(input: { rating: number; comment: string }) {
    if (!confirmedOrderId) {
      return {
        ok: false,
        message: "Commande introuvable.",
      };
    }

    return submitPublicReview({
      restaurantSlug,
      tableLabel: tableSlug,
      orderId: confirmedOrderId,
      rating: input.rating,
      comment: input.comment,
    });
  }

  if (!table) {
    return (
      <AppShell showNav={false}>
        <PageHeader title={restaurantName} subtitle="QR de table" customer />
        <section className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-white p-8 text-center shadow-card">
          <Heart className="mx-auto mb-5 size-14 text-emerald-800" />
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Table introuvable</h1>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">Demandez un nouveau QR à l’équipe.</p>
        </section>
      </AppShell>
    );
  }

  if (publicMenu.status === "suspended" || publicMenu.status === "archived") {
    return (
      <AppShell showNav={false}>
        <PageHeader title={restaurantName} subtitle={subtitle} customer />
        <section className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-white p-8 text-center shadow-card">
          <Heart className="mx-auto mb-5 size-14 text-emerald-800" />
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Ce menu n’est pas disponible pour le moment.
          </h1>
        </section>
      </AppShell>
    );
  }

  if (confirmedOrderId) {
    return (
      <AppShell showNav={false}>
        <PageHeader title={restaurantName} subtitle={subtitle} customer />
        <CustomerTrackingPreview
          tableName={tableName}
          tableArea={tableArea}
          total={confirmedOrderTotal ?? 0}
          order={trackedOrder}
          orderNumber={confirmedOrderNumber}
          submitReviewAction={sendCustomerReview}
          settings={{
            googleReviewUrl: publicMenu.googleReviewUrl,
            reviewsSettings: {
              enabledAfterMeal: publicMenu.reviewsEnabled,
              googleReviewUrl: publicMenu.googleReviewUrl,
              suggestGoogleOnPositive: true,
            },
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false} className="pb-32">
      <PageHeader title={restaurantName} subtitle={subtitle} customer />

      <section className="mb-6 rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-white p-4 shadow-card">
        <div className="flex min-h-14 items-center gap-4 text-lg text-slate-700">
          <Heart className="size-8 shrink-0 text-emerald-800" />
          <div className="min-w-0">
            <p className="font-bold text-slate-950">{tableName}</p>
            {tableArea ? <p className="text-base font-semibold text-slate-600">{tableArea}</p> : null}
            {publicMenu.restaurantCity ? (
              <p className="text-base font-semibold text-slate-600">{publicMenu.restaurantCity}</p>
            ) : null}
            <p className="mt-2 text-xl font-black tracking-tight text-emerald-900">Commandez à votre rythme</p>
          </div>
        </div>
      </section>

      <div
        className="mb-6 flex gap-3 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Catégories du menu"
      >
        {visibleCategories.map((category) => {
          const Icon = getCategoryIcon(category.id);
          const active = selectedCategoryId === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={
                (active
                  ? "bg-(--tf-primary-700) text-white shadow-green"
                  : "border border-slate-200 bg-white text-slate-700 shadow-card") +
                " flex min-h-14 shrink-0 items-center gap-2 rounded-full px-5 text-lg font-semibold"
              }
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
          {visibleProducts.map((product) => (
            <CustomerProductCard key={product.id} product={product} onAdd={addToBasket} />
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-card">
          <h2 className="text-2xl font-black tracking-tight text-emerald-900">Aucun produit disponible</h2>
          <p className="mt-2 text-lg font-semibold text-slate-700">Le restaurant mettra bientôt son menu à jour.</p>
        </section>
      )}

      {customizingProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
        >
          <section className="max-h-[92dvh] w-full max-w-160 overflow-y-auto rounded-3xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Personnaliser</p>
                <h2 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">{customizingProduct.name}</h2>
                <p className="mt-2 text-base font-bold text-emerald-800">
                  Base : {formatEuro(getEffectiveProductPrice(customizingProduct))}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomizingProduct(null);
                  setSelectedOptionIds({});
                  setOptionValidationMessage("");
                }}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700"
                aria-label="Fermer"
              >
                ?
              </button>
            </div>

            <div className="grid gap-4">
              {getProductOptionGroups(customizingProduct).map((group) => {
                const multiple = group.type === "multiple_choice" || group.type === "supplement";
                const selectedIds = selectedOptionIds[group.id] ?? [];

                return (
                  <section key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black text-slate-950">{group.name}</h3>
                      {group.required ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                          Obligatoire
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      {group.items.map((item) => {
                        const checked = selectedIds.includes(item.id);
                        const extraPrice = Number(item.price ?? 0);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleOption(group.id, item.id, multiple)}
                            className={
                              (checked
                                ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                                : "border-slate-200 bg-white text-slate-700") +
                              " flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 text-left text-base font-bold"
                            }
                          >
                            <span className="min-w-0">
                              <span className="block">{item.name}</span>
                              {extraPrice > 0 ? (
                                <span className="mt-0.5 block text-sm font-black text-emerald-700">
                                  + {formatEuro(extraPrice)}
                                </span>
                              ) : null}
                            </span>

                            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-sm">
                              {checked ? "?" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            {optionValidationMessage ? (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-base font-bold text-red-700">
                {optionValidationMessage}
              </p>
            ) : null}

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={confirmCustomizedProduct}
                className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green"
              >
                Ajouter au panier
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomizingProduct(null);
                  setSelectedOptionIds({});
                  setOptionValidationMessage("");
                }}
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-5 text-base font-black text-slate-700"
              >
                Annuler
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <CustomerCartBar
        itemCount={itemCount}
        total={basketTotal}
        lines={basket}
        note={note}
        customerName={customerName}
        customerPhone={customerPhone}
        validationMessage={validationMessage}
        ordersEnabled={ordersEnabled}
        isSubmitting={isSubmitting}
        isOpen={basketOpen}
        onOpen={() => setBasketOpen(true)}
        onClose={() => setBasketOpen(false)}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
        onRemove={removeItem}
        onNoteChange={setNote}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onConfirm={confirmOrder}
      />
    </AppShell>
  );
}