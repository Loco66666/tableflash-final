"use client";

import { useMemo, useState } from "react";
import { Cake, CupSoda, Heart, Leaf, Sparkles, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerCartBar } from "@/components/ui-custom/CustomerCartBar";
import { CustomerProductCard } from "@/components/ui-custom/CustomerProductCard";
import { createPublicOrder } from "@/app/r/[restaurant]/table/[table]/actions";
import type { Category, Product, TableInfo } from "@/lib/types";
import { formatEuro } from "@/lib/utils";

type BasketLine = {
  product: Product;
  quantity: number;
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
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const basketTotal = basket.reduce((sum, line) => sum + getEffectiveProductPrice(line.product) * line.quantity, 0);
  const ordersEnabled = publicMenu.ordersEnabled;

  function addToBasket(product: Product) {
    setValidationMessage("");
    setBasket((currentBasket) => {
      const existingLine = currentBasket.find((line) => line.product.id === product.id);

      if (existingLine) {
        return currentBasket.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }

      return [...currentBasket, { product, quantity: 1 }];
    });
  }

  function increaseQuantity(productId: string) {
    setBasket((currentBasket) =>
      currentBasket.map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line)),
    );
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
    setConfirmedOrderTotal(basketTotal);
    setBasket([]);
    setNote("");
    setCustomerName("");
    setCustomerPhone("");
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
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Ce menu n’est pas disponible pour le moment.</h1>
        </section>
      </AppShell>
    );
  }

  if (confirmedOrderId) {
    return (
      <AppShell showNav={false}>
        <PageHeader title={restaurantName} subtitle={subtitle} customer />
        <section className="mb-6 rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-white p-5 text-center shadow-card">
          <span className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-emerald-700 text-white">
            <Heart className="size-11" />
          </span>
          <h1 className="text-4xl font-black tracking-tighter text-emerald-900">Commande envoyée</h1>
          <p className="mt-2 text-xl font-bold text-slate-800">{tableName}</p>
          <p className="mt-1 text-3xl font-black text-emerald-800">{formatEuro(confirmedOrderTotal ?? 0)}</p>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">Votre commande a bien été transmise au restaurant.</p>
          <p className="mt-2 text-base font-bold text-slate-700">Référence : {confirmedOrderId.slice(0, 8).toUpperCase()}</p>
          <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-base font-bold text-slate-700 shadow-card">Paiement sur place</p>

          {publicMenu.reviewsEnabled && publicMenu.googleReviewUrl ? (
            <a
              href={publicMenu.googleReviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-700 px-4 text-base font-black text-emerald-800"
            >
              Donner un avis Google après le repas
            </a>
          ) : null}
        </section>
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
            {publicMenu.restaurantCity ? <p className="text-base font-semibold text-slate-600">{publicMenu.restaurantCity}</p> : null}
            <p className="mt-2 text-xl font-black tracking-tight text-emerald-900">Commandez à votre rythme</p>
          </div>
        </div>
      </section>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" aria-label="Catégories du menu">
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