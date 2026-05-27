"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { FolderPlus, Plus, Search, Trash2, X } from "lucide-react";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  createMenuCategory,
  createMenuProduct,
  deleteMenuProduct,
  toggleMenuProductAvailability,
  updateMenuProduct,
} from "@/app/dashboard/menu/actions";

type ProductFormState = {
  name: string;
  categoryId: string;
  price: string;
  description: string;
  available: boolean;
  imageUrl: string;
};

type ProductFormErrors = Partial<Record<"name" | "categoryId" | "price", string>>;

type PanelMode = "add-product" | "edit-product" | "add-category" | null;

const emptyProductForm: ProductFormState = {
  name: "",
  categoryId: "",
  price: "",
  description: "",
  available: true,
  imageUrl: "",
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parsePrice(value: string) {
  const normalizedValue = value.replace(/\s/g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

function formatPriceInput(value: number) {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getProductForm(product: Product): ProductFormState {
  return {
    name: product.name ?? "",
    categoryId: product.categoryId ?? "",
    price: formatPriceInput(product.price),
    description: product.description ?? "",
    available: typeof product.available === "boolean" ? product.available : true,
    imageUrl: product.imageUrl ?? product.imageDataUrl ?? "",
  };
}

function Panel({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-panel-title"
    >
      <section className="max-h-[92dvh] w-full max-w-160 overflow-y-auto rounded-[1.6rem] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="menu-panel-title" className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700"
            aria-label="Fermer"
          >
            <X className="size-6" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-base font-black text-slate-800">
      <span>{label}</span>
      {children}
      {error ? <span className="text-sm font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function Toggle({
  checked,
  label,
  onChange,
  sublabel,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-16 items-center justify-between gap-4 rounded-2xl bg-white px-4 text-left shadow-card"
    >
      <span>
        <span className="block text-lg font-black text-slate-900">{label}</span>
        <span className="mt-1 block text-sm font-semibold text-slate-500">{sublabel}</span>
      </span>
      <span className={cn("flex h-8 w-14 items-center rounded-full p-1 transition", checked ? "bg-emerald-700" : "bg-slate-300")}>
        <span className={cn("size-6 rounded-full bg-white shadow transition", checked && "translate-x-6")} />
      </span>
    </button>
  );
}

export function MenuManager({
  initialCategories,
  initialProducts,
}: {
  initialCategories: Category[];
  initialProducts: Product[];
}) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productErrors, setProductErrors] = useState<ProductFormErrors>({});
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [actionError, setActionError] = useState("");

  const categories = useMemo(
    () => [{ id: "all", name: "Tous", icon: "sparkles" }, ...initialCategories],
    [initialCategories],
  );

  const menuCategories = useMemo(
    () => categories.filter((category) => category.id !== "all"),
    [categories],
  );

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const products = useMemo(
    () =>
      initialProducts.map((product) => ({
        ...product,
        categoryName: categoryById.get(product.categoryId)?.name ?? "Catégorie",
      })),
    [categoryById, initialProducts],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return products.filter((product) => {
      const categoryName = product.categoryName ?? "";
      const matchesSearch = normalizedSearch
        ? normalizeText(`${product.name} ${categoryName} ${product.description}`).includes(normalizedSearch)
        : true;

      const isAvailable = typeof product.available === "boolean" ? product.available : true;

      const matchesCategory =
        selectedCategoryId === "all" ||
        (selectedCategoryId === "rupture" ? !isAvailable : product.categoryId === selectedCategoryId);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategoryId]);

  function openAddProduct() {
    setEditingProductId(null);
    setProductForm({ ...emptyProductForm, categoryId: menuCategories[0]?.id ?? "" });
    setProductErrors({});
    setActionError("");
    setPanelMode("add-product");
  }

  function openEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm(getProductForm(product));
    setProductErrors({});
    setActionError("");
    setPanelMode("edit-product");
  }

  function closePanel() {
    setPanelMode(null);
    setEditingProductId(null);
    setProductErrors({});
    setCategoryError("");
    setActionError("");
  }

  function validateProductForm() {
    const nextErrors: ProductFormErrors = {};
    const price = parsePrice(productForm.price);

    if (!productForm.name.trim()) nextErrors.name = "Le nom est requis.";
    if (!productForm.categoryId) nextErrors.categoryId = "La catégorie est requise.";
    if (!productForm.price.trim() || !Number.isFinite(price) || price <= 0) {
      nextErrors.price = "Indiquez un prix positif.";
    }

    setProductErrors(nextErrors);

    return {
      valid: Object.keys(nextErrors).length === 0,
      price,
    };
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { valid, price } = validateProductForm();
    if (!valid) return;

    startTransition(async () => {
      try {
        setActionError("");

        const payload = {
          name: productForm.name,
          categoryId: productForm.categoryId,
          price,
          description: productForm.description,
          available: productForm.available,
          imageUrl: productForm.imageUrl,
        };

        if (panelMode === "edit-product" && editingProductId) {
          await updateMenuProduct({ productId: editingProductId, ...payload });
        } else {
          await createMenuProduct(payload);
        }

        closePanel();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Action impossible.");
      }
    });
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      setCategoryError("Le nom est requis.");
      return;
    }

    const duplicate = menuCategories.some(
      (category) => normalizeText(category.name) === normalizeText(trimmedName),
    );

    if (duplicate) {
      setCategoryError("Cette catégorie existe déjà.");
      return;
    }

    startTransition(async () => {
      try {
        setActionError("");
        await createMenuCategory({ name: trimmedName });
        setCategoryName("");
        closePanel();
      } catch (error) {
        setCategoryError(error instanceof Error ? error.message : "Création impossible.");
      }
    });
  }

  function toggleAvailability(product: Product) {
    const nextAvailable = !(typeof product.available === "boolean" ? product.available : true);

    startTransition(async () => {
      try {
        setActionError("");
        await toggleMenuProductAvailability({
          productId: product.id,
          available: nextAvailable,
        });
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Mise à jour impossible.");
      }
    });
  }

  function deleteProduct(productId: string) {
    startTransition(async () => {
      try {
        setActionError("");
        await deleteMenuProduct({ productId });
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Suppression impossible.");
      }
    });
  }

  return (
    <>
      {actionError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-4">
        <button
          type="button"
          onClick={openAddProduct}
          disabled={isPending || menuCategories.length === 0}
          className="min-h-20 rounded-[1.2rem] bg-linear-to-br from-emerald-600 to-emerald-900 text-xl font-black text-white shadow-green disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-4">
            <Plus className="size-9 rounded-full bg-white p-1 text-emerald-800" />
            Ajouter un produit
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategoryName("");
            setCategoryError("");
            setActionError("");
            setPanelMode("add-category");
          }}
          disabled={isPending}
          className="min-h-16 rounded-[1.2rem] border border-slate-200 bg-white text-xl font-black text-emerald-800 shadow-card disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-4">
            <FolderPlus className="size-8" />
            Ajouter une catégorie
          </span>
        </button>
      </div>

      {menuCategories.length === 0 ? (
        <section className="mt-6 rounded-[1.35rem] border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-emerald-900">
            Commencez par créer une catégorie
          </h2>
          <p className="mt-2 text-base font-semibold text-slate-600">
            Ajoutez vos premières catégories et plats pour préparer votre menu QR.
          </p>
        </section>
      ) : null}

      <label className="my-6 flex min-h-16 items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-5 text-lg text-slate-500 shadow-card focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-100">
        <Search className="size-7 shrink-0" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-slate-800 outline-none"
          placeholder="Rechercher un produit"
          aria-label="Rechercher un produit"
        />
      </label>

      <div className="scrollbar-none mb-6 -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pr-6 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategoryId(category.id)}
            className={cn(
              "min-h-12 shrink-0 rounded-2xl px-5 text-lg font-semibold",
              selectedCategoryId === category.id
                ? "bg-emerald-700 text-white shadow-green"
                : "border border-slate-200 bg-white text-slate-700 shadow-card",
            )}
          >
            {category.name}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setSelectedCategoryId("rupture")}
          className={cn(
            "min-h-12 shrink-0 rounded-2xl px-5 text-lg font-semibold",
            selectedCategoryId === "rupture"
              ? "bg-emerald-700 text-white shadow-green"
              : "border border-slate-200 bg-white text-slate-700 shadow-card",
          )}
        >
          Indisponibles
        </button>
      </div>

      <div className="grid gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="grid gap-2">
              <ProductCard product={product} onEdit={openEditProduct} />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleAvailability(product)}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-card disabled:opacity-60"
                >
                  {product.available ? "Rendre indisponible" : "Rendre disponible"}
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => deleteProduct(product.id)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 shadow-card disabled:opacity-60"
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <section className="rounded-[1.35rem] border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-emerald-900">
              Aucun produit trouvé
            </h2>
            <p className="mt-2 text-base font-semibold text-slate-600">
              Modifiez la recherche ou ajoutez un produit.
            </p>
          </section>
        )}
      </div>

      {panelMode === "add-product" || panelMode === "edit-product" ? (
        <Panel
          title={panelMode === "add-product" ? "Ajouter un produit" : "Modifier le produit"}
          onClose={closePanel}
        >
          <form className="grid gap-3.5 safe-pb-form" onSubmit={saveProduct}>
            <Field label="Nom du produit" error={productErrors.name}>
              <input
                value={productForm.name}
                onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Catégorie" error={productErrors.categoryId}>
              <select
                value={productForm.categoryId}
                onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Choisir une catégorie</option>
                {menuCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Prix" error={productErrors.price}>
              <input
                inputMode="decimal"
                value={productForm.price}
                onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={productForm.description}
                onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                rows={3}
                className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </Field>

            <Field label="URL d’image">
              <input
                value={productForm.imageUrl}
                onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="https://..."
              />
            </Field>

            <div className="grid gap-3 rounded-2xl bg-slate-50 p-3">
              <Toggle
                label="Produit disponible"
                sublabel={productForm.available ? "Visible sur le menu client" : "Masqué du menu client"}
                checked={productForm.available}
                onChange={(checked) => setProductForm({ ...productForm, available: checked })}
              />
            </div>

            <div className="sticky bottom-0 z-10 -mx-1 grid gap-2 border-t border-slate-200 bg-white/95 px-1 pt-3 backdrop-blur">
              <button
                type="submit"
                disabled={isPending}
                className="min-h-12 rounded-2xl bg-emerald-700 px-5 text-base font-black text-white shadow-green disabled:opacity-60"
              >
                {panelMode === "add-product" ? "Enregistrer le produit" : "Enregistrer les changements"}
              </button>

              <button
                type="button"
                onClick={closePanel}
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 text-base font-bold text-slate-700"
              >
                Annuler
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {panelMode === "add-category" ? (
        <Panel title="Ajouter une catégorie" onClose={closePanel}>
          <form className="grid gap-4" onSubmit={saveCategory}>
            <Field label="Nom de la catégorie" error={categoryError}>
              <input
                value={categoryName}
                onChange={(event) => {
                  setCategoryName(event.target.value);
                  setCategoryError("");
                }}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </Field>

            <button
              type="submit"
              disabled={isPending}
              className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green disabled:opacity-60"
            >
              Enregistrer la catégorie
            </button>

            <button
              type="button"
              onClick={closePanel}
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-5 text-lg font-bold text-slate-700"
            >
              Annuler
            </button>
          </form>
        </Panel>
      ) : null}
    </>
  );
}