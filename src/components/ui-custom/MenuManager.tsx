"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FolderPlus, ImagePlus, Link2, Plus, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import { useMenuStore } from "@/lib/local-store/menuStore";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductFormState = {
  name: string;
  categoryId: string;
  price: string;
  description: string;
  available: boolean;
  featured: boolean;
  promoPrice: string;
  imageUrl: string;
};

function normalizeProduct(product: Product): Product {
  const available = typeof product.available === "boolean" ? product.available : Boolean(product.isAvailable ?? true);
  const featured = Boolean(product.featured ?? product.promoted ?? (product as Product & { promo?: boolean; isPromo?: boolean }).promo ?? (product as Product & { promo?: boolean; isPromo?: boolean }).isPromo);
  const imageUrl = product.imageDataUrl ?? product.imageUrl ?? (product as Product & { image?: string }).image ?? "";
  return {
    ...product,
    description: product.description ?? "",
    available,
    isAvailable: available,
    featured,
    promoted: featured,
    imageUrl,
    imageDataUrl: imageUrl.startsWith("data:image") ? imageUrl : product.imageDataUrl,
    promoPrice: typeof product.promoPrice === "number" && Number.isFinite(product.promoPrice) ? product.promoPrice : undefined,
  };
}

type ProductFormErrors = Partial<Record<"name" | "categoryId" | "price" | "promoPrice" | "image", string>>;

type PanelMode = "add-product" | "edit-product" | "add-category" | null;

const emptyProductForm: ProductFormState = {
  name: "",
  categoryId: "",
  price: "",
  description: "",
  available: true,
  featured: false,
  promoPrice: "",
  imageUrl: "",
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function makeSlug(value: string) {
  const slug = normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "element";
}

function parsePrice(value: string) {
  const normalizedValue = value.replace(/\s/g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

function formatPriceInput(value: number) {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function createClientId(prefix: string, label: string, existingIds: string[]) {
  const baseId = `${prefix}-${makeSlug(label)}`;
  if (!existingIds.includes(baseId)) return baseId;

  let index = 2;
  while (existingIds.includes(`${baseId}-${index}`)) {
    index += 1;
  }
  return `${baseId}-${index}`;
}

function getProductForm(product: Product): ProductFormState {
  const normalizedProduct = normalizeProduct(product);
  return {
    name: normalizedProduct.name ?? "",
    categoryId: normalizedProduct.categoryId ?? "",
    price: formatPriceInput(normalizedProduct.price),
    description: normalizedProduct.description ?? "",
    available: normalizedProduct.available,
    featured: Boolean(normalizedProduct.featured ?? normalizedProduct.promoted),
    promoPrice: typeof normalizedProduct.promoPrice === "number" ? formatPriceInput(normalizedProduct.promoPrice) : "",
    imageUrl: normalizedProduct.imageDataUrl ?? normalizedProduct.imageUrl ?? "",
  };
}

function ProductForm({
  categories,
  errors,
  form,
  mode,
  onChange,
  onClose,
  onSubmit,
}: {
  categories: Category[];
  errors: ProductFormErrors;
  form: ProductFormState;
  mode: "add" | "edit";
  onChange: (nextForm: ProductFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const title = mode === "add" ? "Ajouter un produit" : "Modifier le produit";
  const submitLabel = mode === "add" ? "Enregistrer le produit" : "Enregistrer les changements";

  return (
    <Panel title={title} onClose={onClose}>
      <form className="grid gap-3.5 safe-pb-form" onSubmit={onSubmit}>
        <Field label="Nom du produit" error={errors.name}>
          <input
            value={form.name ?? ""}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          />
        </Field>
        <Field label="Catégorie" error={errors.categoryId}>
          <select
            value={form.categoryId ?? ""}
            onChange={(event) => onChange({ ...form, categoryId: event.target.value })}
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">Choisir une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prix" error={errors.price}>
          <input
            inputMode="decimal"
            value={form.price ?? ""}
            onChange={(event) => onChange({ ...form, price: event.target.value })}
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          />
        </Field>
        <Field label="Description">
          <textarea
            value={form.description ?? ""}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            rows={3}
            className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          />
        </Field>
        <div className="grid gap-3 rounded-2xl bg-slate-50 p-3">
          <Toggle
            label="Produit disponible"
            sublabel={form.available ? "Visible sur le menu client" : "Masqué du menu client et marqué en rupture côté restaurant"}
            checked={form.available}
            onChange={(checked) => onChange({ ...form, available: checked })}
          />
          <Toggle
            label="Mettre en avant"
            sublabel="Ajoute un badge visible sur la carte."
            checked={form.featured}
            onChange={(checked) => onChange({ ...form, featured: checked })}
          />
        </div>
        <Field label="Prix promotionnel" error={errors.promoPrice}>
          <input inputMode="decimal" value={form.promoPrice ?? ""} onChange={(event) => onChange({ ...form, promoPrice: event.target.value })} className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100" />
        </Field>
        <ImageField form={form} onChange={onChange} error={errors.image} />
        <div className="sticky bottom-0 z-10 -mx-1 grid gap-2 border-t border-slate-200 bg-white/95 px-1 pt-3 backdrop-blur">
          <button type="submit" className="min-h-12 rounded-2xl bg-emerald-700 px-5 text-base font-black text-white shadow-green">
            {submitLabel}
          </button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 text-base font-bold text-slate-700">
            Annuler
          </button>
        </div>
      </form>
    </Panel>
  );
}


function ImageField({ form, onChange, error }: { form: ProductFormState; onChange: (nextForm: ProductFormState) => void; error?: string }) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [failedImageSrc, setFailedImageSrc] = useState("");
  const imageValue = form.imageUrl ?? "";
  const trimmedImageValue = imageValue.trim();
  const hasImageValue = Boolean(trimmedImageValue);
  const isDataImage = trimmedImageValue.startsWith("data:image");
  const hasLocalImage = isDataImage;
  const hasPreviewImage = hasImageValue && failedImageSrc !== trimmedImageValue;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      onChange({ ...form });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFailedImageSrc("");
      setShowUrlInput(false);
      onChange({ ...form, imageUrl: String(reader.result ?? "") });
    };
    reader.readAsDataURL(file);
  }

  return (
    <Field label="Image du produit" error={error}>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="h-40 max-h-45 overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-slate-100 via-slate-50 to-white p-2 shadow-card">
          {hasPreviewImage ? (
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white/70 p-2">
              <Image
                src={trimmedImageValue}
                alt="Aperçu du produit"
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                unoptimized
                className="rounded-lg object-contain p-2"
                onError={() => setFailedImageSrc(trimmedImageValue)}
              />
            </div>
          ) : (
            <div className="grid h-full place-items-center rounded-xl bg-white/75 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-600 shadow-card">
                <ImagePlus className="size-4" />
                Visuel automatique
              </span>
            </div>
          )}
        </div>

        <p className="text-sm font-semibold text-slate-500">{hasImageValue && hasPreviewImage ? "Photo ajoutée" : "Ajoutez une photo du produit. TableFlash affichera un visuel automatique."}</p>

        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white">
            <ImagePlus className="size-4" />
            {hasImageValue ? "Remplacer la photo" : "Ajouter une photo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          <button type="button" onClick={() => setShowUrlInput((prev) => !prev)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <Link2 className="size-4" />Utiliser une URL
          </button>

          {hasImageValue ? <button type="button" onClick={() => {
            setFailedImageSrc("");
            onChange({ ...form, imageUrl: "" });
          }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"><Trash2 className="size-4" />Supprimer l’image</button> : null}
        </div>

        {showUrlInput ? (
          <div className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">URL d’image</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <Link2 className="size-4 text-slate-400" />
              <input
                value={hasLocalImage ? "" : imageValue}
                onChange={(event) => {
                  setFailedImageSrc("");
                  onChange({ ...form, imageUrl: event.target.value });
                }}
                className="min-h-11 w-full bg-transparent text-base font-semibold outline-none"
                placeholder="https://..."
              />
            </div>
            {hasLocalImage ? <p className="text-xs font-semibold text-slate-500">Une photo locale est déjà utilisée pour l’aperçu.</p> : null}
          </div>
        ) : null}
      </div>
    </Field>
  );
}

function Panel({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="menu-panel-title">
      <section className="max-h-[92dvh] w-full max-w-160 overflow-y-auto rounded-[1.6rem] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="menu-panel-title" className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700" aria-label="Fermer">
            <X className="size-6" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return (
    <label className="grid gap-2 text-base font-black text-slate-800">
      <span>{label}</span>
      {children}
      {error ? <span className="text-sm font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function Toggle({ checked, label, onChange, sublabel }: { checked: boolean; label: string; onChange: (checked: boolean) => void; sublabel: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex min-h-16 items-center justify-between gap-4 rounded-2xl bg-white px-4 text-left shadow-card">
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

export function MenuManager() {
  const { value, setValue } = useMenuStore();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productErrors, setProductErrors] = useState<ProductFormErrors>({});
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const queryParamsHandled = useRef(false);

  const categories = value.categories;
  const menuCategories = useMemo(() => categories.filter((category) => category.id !== "all"), [categories]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const products = useMemo(
    () =>
      value.products.map((product) => ({
        ...product,
        categoryName: categoryById.get(product.categoryId)?.name ?? "Catégorie",
      })),
    [categoryById, value.products],
  );

  useEffect(() => {
    if (queryParamsHandled.current) return;
    queryParamsHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const shouldAddProduct = params.get("action") === "add-product";
    const shouldShowRupture = params.get("filter") === "rupture";

    window.setTimeout(() => {
      if (shouldAddProduct) {
        setProductForm({ ...emptyProductForm, categoryId: menuCategories[0]?.id ?? "" });
        setProductErrors({});
        setPanelMode("add-product");
      }
      if (shouldShowRupture) {
        setSelectedCategoryId("rupture");
      }
    }, 0);
  }, [menuCategories]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    return products.filter((product) => {
      const categoryName = product.categoryName ?? "";
      const matchesSearch = normalizedSearch
        ? normalizeText(`${product.name} ${categoryName} ${product.description}`).includes(normalizedSearch)
        : true;
      const matchesCategory =
        selectedCategoryId === "all" ||
        (selectedCategoryId === "rupture" ? !product.available : product.categoryId === selectedCategoryId);
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategoryId]);

  function openAddProduct() {
    setEditingProductId(null);
    setProductForm({ ...emptyProductForm, categoryId: menuCategories[0]?.id ?? "" });
    setProductErrors({});
    setPanelMode("add-product");
  }

  function openEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm(getProductForm(product));
    setProductErrors({});
    setPanelMode("edit-product");
  }

  function closePanel() {
    setPanelMode(null);
    setEditingProductId(null);
    setProductErrors({});
    setCategoryError("");
  }

  function validateProductForm() {
    const nextErrors: ProductFormErrors = {};
    const price = parsePrice(productForm.price);
    const promoPrice = productForm.promoPrice ? parsePrice(productForm.promoPrice) : Number.NaN;
    if (!productForm.name.trim()) nextErrors.name = "Le nom est requis.";
    if (!productForm.categoryId) nextErrors.categoryId = "La catégorie est requise.";
    if (!productForm.price.trim() || !Number.isFinite(price) || price <= 0) nextErrors.price = "Indiquez un prix positif.";
    if (productForm.promoPrice && (!Number.isFinite(promoPrice) || promoPrice <= 0 || promoPrice >= price)) nextErrors.promoPrice = "Le prix promotionnel doit être inférieur au prix normal";
    if (productForm.imageUrl.startsWith("data:image") && productForm.imageUrl.length > 2_800_000) nextErrors.image = "Image trop lourde. Choisissez une photo plus légère.";
    setProductErrors(nextErrors);
    return { valid: Object.keys(nextErrors).length === 0, price, promoPrice };
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { valid, price, promoPrice } = validateProductForm();
    if (!valid) return;

    const trimmedName = productForm.name.trim();
    const trimmedImageUrl = productForm.imageUrl.trim();
    const nextProduct: Product = {
      id:
        panelMode === "edit-product" && editingProductId
          ? editingProductId
          : createClientId("product", trimmedName, value.products.map((product) => product.id)),
      name: trimmedName,
      categoryId: productForm.categoryId,
      description: productForm.description.trim(),
      price,
      available: productForm.available,
      featured: productForm.featured,
      promoted: productForm.featured,
      promoPrice: Number.isFinite(promoPrice) ? promoPrice : undefined,
      visual: "salad",
      ...(trimmedImageUrl ? { imageUrl: trimmedImageUrl, imageDataUrl: trimmedImageUrl.startsWith("data:image") ? trimmedImageUrl : undefined } : {}),
    };

    setValue((currentValue) => {
      if (panelMode === "edit-product" && editingProductId) {
        return {
          ...currentValue,
          products: currentValue.products.map((product) => (product.id === editingProductId ? normalizeProduct(nextProduct) : normalizeProduct(product))),
        };
      }
      return { ...currentValue, products: [normalizeProduct(nextProduct), ...currentValue.products.map(normalizeProduct)] };
    });
    closePanel();
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setCategoryError("Le nom est requis.");
      return;
    }

    const duplicate = menuCategories.some((category) => normalizeText(category.name) === normalizeText(trimmedName));
    if (duplicate) {
      setCategoryError("Cette catégorie existe déjà.");
      return;
    }

    const nextCategory: Category = {
      id: createClientId("category", trimmedName, categories.map((category) => category.id)),
      name: trimmedName,
      icon: "sparkles",
    };

    setValue((currentValue) => ({ ...currentValue, categories: [...currentValue.categories, nextCategory] }));
    setSelectedCategoryId(nextCategory.id);
    setCategoryName("");
    closePanel();
  }

  return (
    <>
      <div className="grid gap-4">
        <button type="button" onClick={openAddProduct} className="min-h-20 rounded-[1.2rem] bg-linear-to-br from-emerald-600 to-emerald-900 text-xl font-black text-white shadow-green">
          <span className="inline-flex items-center gap-4">
            <Plus className="size-9 rounded-full bg-white p-1 text-emerald-800" />Ajouter un produit
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setCategoryName("");
            setCategoryError("");
            setPanelMode("add-category");
          }}
          className="min-h-16 rounded-[1.2rem] border border-slate-200 bg-white text-xl font-black text-emerald-800 shadow-card"
        >
          <span className="inline-flex items-center gap-4">
            <FolderPlus className="size-8" />Ajouter une catégorie
          </span>
        </button>
      </div>

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
              selectedCategoryId === category.id ? "bg-emerald-700 text-white shadow-green" : "border border-slate-200 bg-white text-slate-700 shadow-card",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => <ProductCard key={product.id} product={product} onEdit={openEditProduct} />)
        ) : (
          <section className="rounded-[1.35rem] border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-emerald-900">Aucun produit trouvé</h2>
            <p className="mt-2 text-base font-semibold text-slate-600">Modifiez la recherche ou ajoutez un produit.</p>
          </section>
        )}
      </div>

      {panelMode === "add-product" || panelMode === "edit-product" ? (
        <ProductForm
          categories={menuCategories}
          errors={productErrors}
          form={productForm}
          mode={panelMode === "add-product" ? "add" : "edit"}
          onChange={setProductForm}
          onClose={closePanel}
          onSubmit={saveProduct}
        />
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
            <button type="submit" className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green">
              Enregistrer la catégorie
            </button>
            <button type="button" onClick={closePanel} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-5 text-lg font-bold text-slate-700">
              Annuler
            </button>
          </form>
        </Panel>
      ) : null}
    </>
  );
}
