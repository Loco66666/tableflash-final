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
import type { Category, Order, Product, SelectedProductOption, TableInfo } from "@/lib/types";
import { formatEuro } from "@/lib/utils";
import { getTraditionalMenuFamily, getTraditionalMenuFamilyOrder } from "@/lib/menu/traditional-menu";

type BasketLine = {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions: SelectedProductOption[];
  unitPrice: number;
};

type CustomerMenuProduct = Product & {
  categoryName: string;
  categoryFamilyId: string;
  categoryFamilyName: string;
};

type MenuLanguage = "fr" | "en";

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

type StoredCustomerOrder = {
  id: string;
  orderNumber: number | null;
  status: Order["status"];
  total: number;
  savedAt: number;
};

const preferredCategoryOrder = [
  "starters",
  "mains",
  "desserts",
  "drinks",
  "menus",
  "uncategorized",
];
const TRACKING_STORAGE_PREFIX = "tableflash:customer-order";
const TRACKING_STORAGE_TTL_MS = 12 * 60 * 60 * 1000;
const TRACKING_REFRESH_INTERVAL_MS = 5_000;
const TRACKING_FOCUS_REFRESH_MIN_DELAY_MS = 3_000;

const familyNameTranslations: Record<string, Record<MenuLanguage, string>> = {
  starters: { fr: "Entrees", en: "Starters" },
  mains: { fr: "Plats", en: "Mains" },
  desserts: { fr: "Desserts", en: "Desserts" },
  drinks: { fr: "Boissons", en: "Drinks" },
  menus: { fr: "Menus", en: "Menus" },
  uncategorized: { fr: "A classer", en: "To sort" },
};

const categoryIcons: Record<string, LucideIcon> = {
  all: Sparkles,
  starters: Leaf,
  mains: Utensils,
  desserts: Cake,
  drinks: CupSoda,
  menus: Sparkles,
  uncategorized: Sparkles,
};

function createMenuFamilyContext(categoryNames: string[]) {
  return { categoryNames };
}

function getMenuFamily(categoryName: string, context: ReturnType<typeof createMenuFamilyContext>) {
  void context;
  return getTraditionalMenuFamily(categoryName);
}

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

function getTranslatedName(entity: Pick<Category | Product, "name" | "translations">, language: MenuLanguage) {
  if (language === "fr") return entity.name;

  return entity.translations?.[language]?.name?.trim() || entity.name;
}

function getTranslatedProduct(product: Product, language: MenuLanguage): Product {
  if (language === "fr") return product;

  return {
    ...product,
    name: product.translations?.[language]?.name?.trim() || product.name,
    description: product.translations?.[language]?.description?.trim() || product.description,
  };
}

function hasEnglishTranslations(categories: Category[], products: Product[]) {
  return (
    categories.some((category) => Boolean(category.translations?.en?.name?.trim())) ||
    products.some((product) => Boolean(product.translations?.en?.name?.trim() || product.translations?.en?.description?.trim()))
  );
}

function getFamilyDisplayName(familyId: string, fallback: string, language: MenuLanguage) {
  return familyNameTranslations[familyId]?.[language] ?? fallback;
}

function getVisibleCategories(products: CustomerMenuProduct[], language: MenuLanguage) {
  const allCategory = {
    id: "all",
    name: language === "en" ? "All" : "Toutes",
    icon: "sparkles",
  };
  const familyById = new Map<string, Category>();

  for (const product of products) {
    if (!familyById.has(product.categoryFamilyId)) {
      familyById.set(product.categoryFamilyId, {
        id: product.categoryFamilyId,
        name: product.categoryFamilyName,
        icon: "sparkles",
      });
    }
  }

  const sortedCategories = [...familyById.values()].sort((first, second) => {
    const firstIndex = preferredCategoryOrder.indexOf(first.id);
    const secondIndex = preferredCategoryOrder.indexOf(second.id);
    const firstOrder = getTraditionalMenuFamilyOrder(first.id);
    const secondOrder = getTraditionalMenuFamilyOrder(second.id);

    if (firstIndex === -1 && secondIndex === -1 && firstOrder === secondOrder) {
      return first.name.localeCompare(second.name, "fr-FR");
    }

    if (firstIndex === -1 && firstOrder !== secondOrder) return firstOrder - secondOrder;
    if (secondIndex === -1 && firstOrder !== secondOrder) return firstOrder - secondOrder;
    if (firstIndex === -1) return firstOrder;
    if (secondIndex === -1) return -secondOrder;

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

function getConfiguredProductPrice(product: Product, selectedOptions: SelectedProductOption[]) {
  return (
    getEffectiveProductPrice(product) +
    selectedOptions.reduce((total, option) => total + Math.max(0, Number(option.price ?? 0)), 0)
  );
}

function getSelectedOptionsFromSelections(
  optionGroups: ReturnType<typeof getProductOptionGroups>,
  optionSelections: Record<string, string[]>,
): SelectedProductOption[] {
  return optionGroups.flatMap((group) =>
    (optionSelections[group.id] ?? []).flatMap((itemId) => {
      const item = group.items.find((optionItem) => optionItem.id === itemId);

      if (!item) return [];

      return [
        {
          groupId: group.id,
          groupName: group.name,
          itemId: item.id,
          itemName: item.name,
          price: Number(item.price ?? 0),
        },
      ];
    }),
  );
}

function getBasketLineId(productId: string, selectedOptions: SelectedProductOption[]) {
  const optionKey = selectedOptions
    .map((option) => `${option.groupId}:${option.itemId}`)
    .sort()
    .join("|");

  return `${productId}::${optionKey}`;
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

function getTrackingStorageKey(restaurantSlug: string, tableSlug: string) {
  return `${TRACKING_STORAGE_PREFIX}:${restaurantSlug}:${tableSlug}`;
}

function readStoredCustomerOrder(storageKey: string): StoredCustomerOrder | null {
  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<StoredCustomerOrder>;

    if (!parsed.id || typeof parsed.savedAt !== "number") {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    if (Date.now() - parsed.savedAt > TRACKING_STORAGE_TTL_MS) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return {
      id: parsed.id,
      orderNumber: typeof parsed.orderNumber === "number" ? parsed.orderNumber : null,
      status: isOrderStatus(parsed.status) ? parsed.status : "new",
      total: typeof parsed.total === "number" ? parsed.total : 0,
      savedAt: parsed.savedAt,
    };
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

function writeStoredCustomerOrder(storageKey: string, order: Omit<StoredCustomerOrder, "savedAt">) {
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...order,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // Tracking still works for the current tab if storage is unavailable.
  }
}

function isOrderStatus(value: unknown): value is Order["status"] {
  return (
    value === "new" ||
    value === "accepted" ||
    value === "payment_pending" ||
    value === "paid" ||
    value === "preparing" ||
    value === "ready" ||
    value === "served" ||
    value === "refused"
  );
}

function getOrderIdFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("order")?.trim() || null;
  } catch {
    return null;
  }
}

function writeOrderIdToUrl(orderId: string) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("order", orderId);
    window.history.replaceState(null, "", url.toString());
  } catch {
    // The saved local order still restores tracking if history is unavailable.
  }
}

function clearOrderIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("order");
    window.history.replaceState(null, "", url.toString());
  } catch {
    // Nothing to clean up if history is unavailable.
  }
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
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
  const [optionSelections, setOptionSelections] = useState<Record<string, string[]>>({});
  const [validationMessage, setValidationMessage] = useState("");
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<number | null>(null);
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState<number | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<MenuLanguage>("fr");

  const table = initialTable;
  const tableName = table?.name ?? "";
  const tableArea = table?.area ?? "";
  const restaurantName = publicMenu.restaurantName;
  const subtitle = table ? (tableArea ? `${tableName} • ${tableArea}` : tableName) : "QR de table";
  const categoryById = useMemo(() => new Map(publicMenu.categories.map((category) => [category.id, category])), [publicMenu.categories]);
  const englishAvailable = useMemo(
    () => hasEnglishTranslations(publicMenu.categories, publicMenu.products),
    [publicMenu.categories, publicMenu.products],
  );
  const menuFamilyContext = useMemo(
    () => createMenuFamilyContext(publicMenu.categories.map((category) => category.name)),
    [publicMenu.categories],
  );
  const orderableProducts = useMemo<CustomerMenuProduct[]>(
    () =>
      publicMenu.products.filter(isCustomerOrderable).map((product) => {
        const category = categoryById.get(product.categoryId);
        const categoryName = category?.name ?? "Autres";
        const translatedCategoryName = category ? getTranslatedName(category, selectedLanguage) : categoryName;
        const family = getMenuFamily(categoryName, menuFamilyContext);
        const translatedProduct = getTranslatedProduct(product, selectedLanguage);

        return {
          ...translatedProduct,
          categoryName: translatedCategoryName,
          categoryFamilyId: family.id,
          categoryFamilyName: getFamilyDisplayName(family.id, family.name, selectedLanguage),
        };
      }),
    [categoryById, menuFamilyContext, publicMenu.products, selectedLanguage],
  );
  const visibleCategories = useMemo(
    () => getVisibleCategories(orderableProducts, selectedLanguage),
    [orderableProducts, selectedLanguage],
  );
  const trackingStorageKey = useMemo(() => getTrackingStorageKey(restaurantSlug, tableSlug), [restaurantSlug, tableSlug]);

  const visibleProducts =
    selectedCategoryId === "all"
      ? orderableProducts
      : orderableProducts.filter((product) => product.categoryFamilyId === selectedCategoryId);
  const productSections = useMemo(() => {
    const groupedSections = new Map<string, { title: string; eyebrow: string | null; products: CustomerMenuProduct[] }>();

    for (const product of visibleProducts) {
      const sectionKey =
        selectedCategoryId === "all" ? `${product.categoryFamilyId}:${product.categoryName}` : product.categoryName;
      const section = groupedSections.get(sectionKey) ?? {
        title: selectedCategoryId === "all" ? product.categoryFamilyName : product.categoryName,
        eyebrow: selectedCategoryId === "all" ? product.categoryName : null,
        products: [],
      };

      section.products.push(product);
      groupedSections.set(sectionKey, section);
    }

    return [...groupedSections.values()];
  }, [selectedCategoryId, visibleProducts]);

  const itemCount = basket.reduce((sum, line) => sum + line.quantity, 0);
  const basketTotal = basket.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const ordersEnabled = publicMenu.ordersEnabled;

  useEffect(() => {
    if (!table || confirmedOrderId) return;

    const orderIdFromUrl = getOrderIdFromUrl();

    if (orderIdFromUrl) {
      const timer = window.setTimeout(() => {
        setConfirmedOrderId(orderIdFromUrl);
        setTrackedOrder(
          buildTrackedOrder({
            id: orderIdFromUrl,
            orderNumber: null,
            status: "new",
            total: 0,
            table,
            restaurantSlug,
          }),
        );
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const storedOrder = readStoredCustomerOrder(trackingStorageKey);

    if (!storedOrder) return;

    const timer = window.setTimeout(() => {
      setConfirmedOrderId(storedOrder.id);
      setConfirmedOrderNumber(storedOrder.orderNumber);
      setConfirmedOrderTotal(storedOrder.total);
      setTrackedOrder(
        buildTrackedOrder({
          id: storedOrder.id,
          orderNumber: storedOrder.orderNumber,
          status: storedOrder.status,
          total: storedOrder.total,
          table,
          restaurantSlug,
        }),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [confirmedOrderId, restaurantSlug, table, trackingStorageKey]);

  useEffect(() => {
    if (!confirmedOrderId || !table) return;

    const orderId = confirmedOrderId;
    const currentTable = table;
    let cancelled = false;
    let requestInFlight = false;
    let lastRefreshAt = 0;

    async function refreshTracking(force = false) {
      if (!force && document.visibilityState !== "visible") return;
      if (requestInFlight) return;

      const now = Date.now();
      if (!force && now - lastRefreshAt < TRACKING_FOCUS_REFRESH_MIN_DELAY_MS) return;

      requestInFlight = true;
      lastRefreshAt = now;

      let result;
      try {
        result = await getPublicOrderTracking({
          restaurantSlug,
          tableLabel: tableSlug,
          orderId,
        });
      } catch {
        return;
      } finally {
        requestInFlight = false;
      }

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
      writeStoredCustomerOrder(trackingStorageKey, {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        total: result.order.total,
      });
    }

    void refreshTracking(true);

    const timer = window.setInterval(() => void refreshTracking(false), TRACKING_REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshTracking(true);
      }
    };
    const handleFocus = () => void refreshTracking(false);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [confirmedOrderId, restaurantSlug, tableSlug, table, trackingStorageKey]);

  function addConfiguredProductToBasket(product: Product, selectedOptions: SelectedProductOption[]) {
    setValidationMessage("");
    const lineId = getBasketLineId(product.id, selectedOptions);
    const unitPrice = getConfiguredProductPrice(product, selectedOptions);

    setBasket((currentBasket) => {
      const existingLine = currentBasket.find((line) => line.id === lineId);

      if (existingLine) {
        return currentBasket.map((line) =>
          line.id === lineId ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }

      return [...currentBasket, { id: lineId, product, quantity: 1, selectedOptions, unitPrice }];
    });
  }

  function addToBasket(product: Product) {
    const optionGroups = getProductOptionGroups(product);

    if (optionGroups.length > 0) {
      setConfiguringProduct(product);
      setOptionSelections({});
      setValidationMessage("");
      return;
    }

    addConfiguredProductToBasket(product, []);
  }

  function updateOptionSelection(groupId: string, itemId: string, multiple: boolean) {
    setOptionSelections((currentSelections) => {
      const currentItems = currentSelections[groupId] ?? [];

      if (!multiple) {
        return {
          ...currentSelections,
          [groupId]: currentItems.includes(itemId) ? [] : [itemId],
        };
      }

      return {
        ...currentSelections,
        [groupId]: currentItems.includes(itemId)
          ? currentItems.filter((currentItemId) => currentItemId !== itemId)
          : [...currentItems, itemId],
      };
    });
  }

  function confirmConfiguredProduct() {
    if (!configuringProduct) return;

    const optionGroups = getProductOptionGroups(configuringProduct);
    const missingRequiredGroup = optionGroups.find(
      (group) => group.required && (optionSelections[group.id]?.length ?? 0) === 0,
    );

    if (missingRequiredGroup) {
      setValidationMessage(`Choisissez : ${missingRequiredGroup.name}.`);
      return;
    }

    const selectedOptions = getSelectedOptionsFromSelections(optionGroups, optionSelections);

    addConfiguredProductToBasket(configuringProduct, selectedOptions);
    setConfiguringProduct(null);
    setOptionSelections({});
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
        selectedOptions: line.selectedOptions.map((option) => ({
          groupId: option.groupId,
          itemId: option.itemId,
        })),
      })),
    });

    setIsSubmitting(false);

    if (!result.ok || !result.orderId) {
      setValidationMessage(result.message);
      setBasketOpen(true);
      return;
    }

    writeStoredCustomerOrder(trackingStorageKey, {
      id: result.orderId,
      orderNumber: result.orderNumber ?? null,
      status: "new",
      total: basketTotal,
    });
    writeOrderIdToUrl(result.orderId);

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

  function startNewOrder() {
    try {
      window.localStorage.removeItem(trackingStorageKey);
    } catch {
      // The in-memory reset below is enough if storage is unavailable.
    }

    clearOrderIdFromUrl();
    setConfirmedOrderId(null);
    setConfirmedOrderNumber(null);
    setConfirmedOrderTotal(null);
    setTrackedOrder(undefined);
    setValidationMessage("");
    setBasketOpen(false);
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
          startNewOrderAction={startNewOrder}
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

  const configuringProductOptionGroups = configuringProduct ? getProductOptionGroups(configuringProduct) : [];
  const configuringSelectedOptions = getSelectedOptionsFromSelections(configuringProductOptionGroups, optionSelections);
  const configuringProductTotal = configuringProduct
    ? getConfiguredProductPrice(configuringProduct, configuringSelectedOptions)
    : 0;

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
            <p className="mt-2 text-xl font-black tracking-tight text-emerald-900">
              {ordersEnabled ? "Commandez a votre rythme" : "Consultez la carte"}
            </p>
          </div>
        </div>
      </section>

      {englishAvailable ? (
        <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-card" aria-label="Langue du menu">
          {(["fr", "en"] as MenuLanguage[]).map((language) => {
            const active = selectedLanguage === language;

            return (
              <button
                key={language}
                type="button"
                onClick={() => setSelectedLanguage(language)}
                className={
                  (active ? "bg-emerald-700 text-white" : "text-slate-700") +
                  " min-h-10 rounded-full px-4 text-sm font-black transition"
                }
                aria-pressed={active}
              >
                {language === "fr" ? "FR" : "EN"}
              </button>
            );
          })}
        </div>
      ) : null}

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
          {productSections.map((section) => (
            <section key={`${section.title}:${section.eyebrow ?? ""}`} className="grid gap-3">
              <div className="flex items-end justify-between gap-3 px-1">
                <div className="min-w-0">
                  {section.eyebrow ? (
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-800">{section.title}</p>
                  ) : null}
                  <h2 className="truncate text-2xl font-black tracking-tight text-slate-950">
                    {section.eyebrow ?? section.title}
                  </h2>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                  {section.products.length} produit(s)
                </span>
              </div>

              <div className="grid gap-4">
                {section.products.map((product) => (
                  <CustomerProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToBasket}
                    ordersEnabled={ordersEnabled}
                    language={selectedLanguage}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-card">
          <h2 className="text-2xl font-black tracking-tight text-emerald-900">Aucun produit disponible</h2>
          <p className="mt-2 text-lg font-semibold text-slate-700">Le restaurant mettra bientôt son menu à jour.</p>
        </section>
      )}

      {configuringProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-options-title"
        >
          <section className="max-h-[92dvh] w-full max-w-160 overflow-y-auto rounded-3xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="product-options-title" className="text-3xl font-black tracking-tighter text-slate-950">
                  {configuringProduct.name}
                </h2>
                <p className="mt-1 text-base font-semibold text-slate-600">
                  {formatEuro(getEffectiveProductPrice(configuringProduct))} de base
                </p>
                <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800">
                  Total avec choix : {formatEuro(configuringProductTotal)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfiguringProduct(null);
                  setOptionSelections({});
                  setValidationMessage("");
                }}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700"
                aria-label="Fermer les choix"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4">
              {configuringProductOptionGroups.map((group) => {
                const multiple = group.type === "multiple_choice" || group.type === "supplement";
                const selectedItems = optionSelections[group.id] ?? [];

                return (
                  <div key={group.id} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-black text-slate-900">{group.name}</p>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        {group.required ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">
                            Obligatoire
                          </span>
                        ) : null}
                        {multiple ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-600">
                            Plusieurs choix
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {group.items.map((item) => {
                        const selected = selectedItems.includes(item.id);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateOptionSelection(group.id, item.id, multiple)}
                            className={
                              (selected
                                ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                                : "border-slate-200 bg-white text-slate-700") +
                              " flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm font-black"
                            }
                            aria-pressed={selected}
                          >
                            <span>{item.name}</span>
                            <span>{Number(item.price ?? 0) > 0 ? `+ ${formatEuro(Number(item.price ?? 0))}` : "Inclus"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {validationMessage ? (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-base font-bold text-red-700">{validationMessage}</p>
            ) : null}

            <button
              type="button"
              onClick={confirmConfiguredProduct}
              className="mt-5 min-h-14 w-full rounded-2xl bg-linear-to-br from-(--tf-primary-600) to-(--tf-primary-900) px-5 text-lg font-black text-white shadow-green"
            >
              Ajouter au panier - {formatEuro(configuringProductTotal)}
            </button>
          </section>
        </div>
      ) : null}

      {ordersEnabled ? (
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
      ) : null}
    </AppShell>
  );
}
