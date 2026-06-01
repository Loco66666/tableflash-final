"use client";

import { useRef, useMemo, useState, useTransition } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  Camera,
  FolderCog,
  FolderPlus,
  ImageIcon,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  createMenuCategory,
  createMenuProduct,
  deleteMenuCategory,
  deleteMenuProduct,
  toggleMenuProductAvailability,
  updateMenuCategory,
  updateMenuProduct,
  uploadMenuProductImage,
} from "@/app/dashboard/menu/actions";

type MenuCategory = Category & {
  isActive?: boolean;
  sortOrder?: number;
};

type ProductFormState = {
  name: string;
  categoryId: string;
  price: string;
  promoPrice: string;
  description: string;
  available: boolean;
  featured: boolean;
  imageUrl: string;
};

type ProductFormErrors = Partial<Record<"name" | "categoryId" | "price" | "promoPrice", string>>;

type CategoryFormState = {
  id: string | null;
  name: string;
  isActive: boolean;
};

type PanelMode = "add-product" | "edit-product" | "add-category" | "manage-categories" | null;

const emptyProductForm: ProductFormState = {
  name: "",
  categoryId: "",
  price: "",
  promoPrice: "",
  description: "",
  available: true,
  featured: false,
  imageUrl: "",
};

const emptyCategoryForm: CategoryFormState = {
  id: null,
  name: "",
  isActive: true,
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
    promoPrice:
      typeof product.promoPrice === "number" && product.promoPrice > 0 ? formatPriceInput(product.promoPrice) : "",
    description: product.description ?? "",
    available: typeof product.available === "boolean" ? product.available : true,
    featured: Boolean(product.featured ?? product.promoted),
    imageUrl: product.imageUrl ?? product.imageDataUrl ?? "",
  };
}

function Panel({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
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
          <h2 id="menu-panel-title" className="text-2xl font-black tracking-tight text-slate-950">
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
  helper,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  helper?: string;
}) {
  return (
    <label className="grid gap-2 text-base font-black text-slate-800">
      <span>{label}</span>
      {children}
      {helper ? <span className="text-sm font-semibold text-slate-500">{helper}</span> : null}
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
      aria-pressed={checked}
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


type SmartOptionTemplate = {
  keywords: string[];
  label: string;
  description: string;
  suggestions: string[];
};

const smartOptionTemplates: SmartOptionTemplate[] = [
  {
    keywords: ["pizza", "pizzeria"],
    label: "Suggestions pour Pizza",
    description: "Ajoutez rapidement les tailles, bases et suppl?ments les plus fr?quents.",
    suggestions: ["Tailles 29 cm / 33 cm", "Base tomate / cr?me", "Suppl?ments"],
  },
  {
    keywords: ["tacos"],
    label: "Suggestions pour Tacos",
    description: "Pr?parez les choix indispensables pour personnaliser un tacos.",
    suggestions: ["Choix de viande", "Choix de sauce", "Formule seul / menu"],
  },
  {
    keywords: ["burger", "hamburger"],
    label: "Suggestions pour Burger",
    description: "Ajoutez les suppl?ments et options classiques d'un burger.",
    suggestions: ["Suppl?ments", "Cuisson", "Formule menu"],
  },
  {
    keywords: ["plat", "brasserie", "restaurant", "viande", "grillade"],
    label: "Suggestions pour Brasserie",
    description: "Ajoutez les options utiles pour les plats servis ? table.",
    suggestions: ["Cuisson", "Sauce", "Accompagnement"],
  },
  {
    keywords: ["sushi", "maki", "japonais", "california"],
    label: "Suggestions pour Sushi",
    description: "Ajoutez les accompagnements habituels des menus japonais.",
    suggestions: ["Sauce soja", "Wasabi / gingembre", "Suppl?ments"],
  },
  {
    keywords: ["caf?", "coffee", "latte", "boisson", "th?", "chocolat"],
    label: "Suggestions pour Boisson",
    description: "Ajoutez les formats et personnalisations simples.",
    suggestions: ["Taille", "Lait", "Chaud / glac?"],
  },
  {
    keywords: ["bar", "tapas", "planche"],
    label: "Suggestions pour Bar / Tapas",
    description: "Ajoutez les formats, suppl?ments et disponibilit?s utiles.",
    suggestions: ["Taille", "Suppl?ments", "Disponibilit? horaire"],
  },
  {
    keywords: ["cr?pe", "crepe", "galette", "cr?perie"],
    label: "Suggestions pour Cr?perie",
    description: "Ajoutez les options courantes pour galettes et cr?pes.",
    suggestions: ["Cuisson ?uf", "Suppl?ments", "Formule"],
  },
  {
    keywords: ["glace", "glacier", "coupe", "boule"],
    label: "Suggestions pour Glacier",
    description: "Ajoutez parfums, formats et toppings.",
    suggestions: ["Parfums", "Toppings", "Pot / cornet"],
  },
];

const genericOptionTemplate: SmartOptionTemplate = {
  keywords: [],
  label: "Besoin d'options pour ce produit ?",
  description: "Ajoutez des options seulement si ce produit en a besoin.",
  suggestions: ["Taille / format", "Choix client", "Suppl?ment", "Formule", "Allerg?nes"],
};

function normalizeTemplateText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getSmartOptionTemplate(categoryName?: string) {
  const normalizedCategory = normalizeTemplateText(categoryName ?? "");

  return (
    smartOptionTemplates.find((template) =>
      template.keywords.some((keyword) => normalizedCategory.includes(normalizeTemplateText(keyword))),
    ) ?? genericOptionTemplate
  );
}

function SmartOptionSuggestions({ categoryName }: { categoryName?: string }) {
  const template = getSmartOptionTemplate(categoryName);

  return (
    <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-base font-black text-slate-950">Ajouter des options avanc?es</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Tailles, sauces, suppl?ments, formules, disponibilit?, allerg?nes
          </p>
        </div>

        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-50 text-xl font-black text-slate-500 transition group-open:rotate-45">
          +
        </span>
      </summary>

      <div className="border-t border-slate-100 px-4 pb-4 pt-3">
        <div className="rounded-2xl bg-emerald-50 p-3">
          <p className="text-sm font-black text-emerald-900">{template.label}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-800/80">{template.description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {template.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <Plus className="size-4" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500">
          Ces suggestions sont facultatives. Le restaurateur peut les utiliser, les modifier ou garder un produit simple.
        </p>
      </div>
    </details>
  );
}


export function MenuManager({
  initialCategories,
  initialProducts,
}: {
  initialCategories: MenuCategory[];
  initialProducts: Product[];
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productErrors, setProductErrors] = useState<ProductFormErrors>({});
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [categoryError, setCategoryError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const menuCategories = useMemo(
    () =>
      initialCategories.map((category) => ({
        ...category,
        isActive: category.isActive ?? true,
      })),
    [initialCategories],
  );

  const activeCategories = useMemo(
    () => menuCategories.filter((category) => category.isActive !== false),
    [menuCategories],
  );

  const filterCategories = useMemo(
    () => [{ id: "all", name: "Tous", icon: "sparkles", isActive: true }, ...activeCategories],
    [activeCategories],
  );

  const categoryById = useMemo(
    () => new Map(menuCategories.map((category) => [category.id, category])),
    [menuCategories],
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
        (selectedCategoryId === "unavailable" ? !isAvailable : product.categoryId === selectedCategoryId);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategoryId]);

  function openAddProduct() {
    setEditingProductId(null);
    setProductForm({ ...emptyProductForm, categoryId: activeCategories[0]?.id ?? "" });
    setProductErrors({});
    setActionError("");
    setActionMessage("");
    setPanelMode("add-product");
  }

  function openEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm(getProductForm(product));
    setProductErrors({});
    setActionError("");
    setActionMessage("");
    setPanelMode("edit-product");
  }

  function openAddCategory() {
    setCategoryForm(emptyCategoryForm);
    setCategoryError("");
    setActionError("");
    setActionMessage("");
    setPanelMode("add-category");
  }

  function openManageCategories() {
    setCategoryForm(emptyCategoryForm);
    setCategoryError("");
    setActionError("");
    setActionMessage("");
    setPanelMode("manage-categories");
  }

  function closePanel() {
    setPanelMode(null);
    setEditingProductId(null);
    setProductErrors({});
    setCategoryError("");
    setActionError("");
    setActionMessage("");
    setIsUploadingImage(false);
  }

  function validateProductForm() {
    const nextErrors: ProductFormErrors = {};
    const price = parsePrice(productForm.price);
    const promoPrice = productForm.promoPrice.trim() ? parsePrice(productForm.promoPrice) : null;

    if (!productForm.name.trim()) nextErrors.name = "Le nom est requis.";
    if (!productForm.categoryId) nextErrors.categoryId = "La catégorie est requise.";
    if (!productForm.price.trim() || !Number.isFinite(price) || price <= 0) {
      nextErrors.price = "Indiquez un prix positif.";
    }

    if (promoPrice !== null && (!Number.isFinite(promoPrice) || promoPrice <= 0)) {
      nextErrors.promoPrice = "Indiquez un prix promo valide.";
    }

    if (promoPrice !== null && Number.isFinite(price) && promoPrice >= price) {
      nextErrors.promoPrice = "Le prix promo doit être inférieur au prix normal.";
    }

    setProductErrors(nextErrors);

    return {
      valid: Object.keys(nextErrors).length === 0,
      price,
      promoPrice,
    };
  }

  async function uploadSelectedImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingImage(true);
    setActionError("");
    setActionMessage("");

    try {
      const result = await uploadMenuProductImage(formData);
      setProductForm((currentForm) => ({
        ...currentForm,
        imageUrl: result.imageUrl,
      }));
      setActionMessage("Photo ajoutée au produit.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { valid, price, promoPrice } = validateProductForm();

    if (!valid) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const payload = {
            name: productForm.name,
            categoryId: productForm.categoryId,
            price,
            promoPrice,
            description: productForm.description,
            available: productForm.available,
            featured: productForm.featured,
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
      })();
    });
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = categoryForm.name.trim();

    if (!trimmedName) {
      setCategoryError("Le nom est requis.");
      return;
    }

    const duplicate = menuCategories.some(
      (category) =>
        category.id !== categoryForm.id && normalizeText(category.name) === normalizeText(trimmedName),
    );

    if (duplicate) {
      setCategoryError("Cette catégorie existe déjà.");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          if (categoryForm.id) {
            await updateMenuCategory({
              categoryId: categoryForm.id,
              name: trimmedName,
              isActive: categoryForm.isActive,
            });
          } else {
            await createMenuCategory({ name: trimmedName });
          }

          setCategoryForm(emptyCategoryForm);

          if (panelMode === "add-category") {
            closePanel();
          }
        } catch (error) {
          setCategoryError(error instanceof Error ? error.message : "Action impossible.");
        }
      })();
    });
  }

  function editCategory(category: MenuCategory) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      isActive: category.isActive !== false,
    });
    setCategoryError("");
    setActionError("");
    setActionMessage("");
  }

  function toggleCategory(category: MenuCategory) {
    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          await updateMenuCategory({
            categoryId: category.id,
            name: category.name,
            isActive: !(category.isActive !== false),
          });
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Mise à jour impossible.");
        }
      })();
    });
  }

  function removeCategory(category: MenuCategory) {
    const confirmed = window.confirm(
      `Supprimer la catégorie "${category.name}" ?\n\nSi elle contient des produits, la suppression sera refusée.`,
    );

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");
          await deleteMenuCategory({ categoryId: category.id });
          setCategoryForm(emptyCategoryForm);
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Suppression impossible.");
        }
      })();
    });
  }

  function toggleAvailability(product: Product) {
    const nextAvailable = !(typeof product.available === "boolean" ? product.available : true);

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          await toggleMenuProductAvailability({
            productId: product.id,
            available: nextAvailable,
          });
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Mise à jour impossible.");
        }
      })();
    });
  }

  function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Supprimer "${product.name}" ?\n\nSi ce produit a déjà été commandé, il sera rendu indisponible au lieu d’être supprimé.`,
    );

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const result = await deleteMenuProduct({ productId: product.id });

          if (result.message) {
            setActionMessage(result.message);
          }
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Suppression impossible.");
        }
      })();
    });
  }

  return (
    <>
      {actionError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {actionError}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid gap-4">
        <button
          type="button"
          onClick={openAddProduct}
          disabled={isPending || activeCategories.length === 0}
          className="min-h-20 rounded-[1.2rem] bg-linear-to-br from-emerald-600 to-emerald-900 text-xl font-black text-white shadow-green disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-4">
            <Plus className="size-9 rounded-full bg-white p-1 text-emerald-800" />
            Ajouter un produit
          </span>
        </button>

        <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
          <button
            type="button"
            onClick={openAddCategory}
            disabled={isPending}
            className="min-h-16 rounded-[1.2rem] border border-slate-200 bg-white text-lg font-black text-emerald-800 shadow-card disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-3">
              <FolderPlus className="size-7" />
              Ajouter catégorie
            </span>
          </button>

          <button
            type="button"
            onClick={openManageCategories}
            disabled={isPending || menuCategories.length === 0}
            className="min-h-16 rounded-[1.2rem] border border-slate-200 bg-white text-lg font-black text-emerald-800 shadow-card disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-3">
              <FolderCog className="size-7" />
              Gérer catégories
            </span>
          </button>
        </div>
      </div>

      {activeCategories.length === 0 ? (
        <section className="mt-6 rounded-[1.35rem] border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center">
          <h2 className="text-2xl font-black tracking-tight text-emerald-900">Commencez par créer une catégorie</h2>
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
        {filterCategories.map((category) => (
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
          onClick={() => setSelectedCategoryId("unavailable")}
          className={cn(
            "min-h-12 shrink-0 rounded-2xl px-5 text-lg font-semibold",
            selectedCategoryId === "unavailable"
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
                  {product.available ? "Rendre indisponible" : "Remettre disponible"}
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => deleteProduct(product)}
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
            <h2 className="text-2xl font-black tracking-tight text-emerald-900">Aucun produit trouvé</h2>
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
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3">
          <Field label="Prix" error={productErrors.price} helper="Prix affiché au client">
                <input
                  inputMode="decimal"
                  value={productForm.price}
                  onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
                  placeholder="12,90"
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                />
              </Field>

              <Field label="Prix promo" error={productErrors.promoPrice} helper="Optionnel, doit être inférieur au prix normal">
                <input
                  inputMode="decimal"
                  value={productForm.promoPrice}
                  onChange={(event) => setProductForm({ ...productForm, promoPrice: event.target.value })}
                  placeholder="9,90"
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={productForm.description}
                onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                rows={3}
                className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </Field>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-base font-black text-slate-800">Photo du produit</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Ajoutez une photo depuis le téléphone ou prenez une photo directement.
                </p>
              </div>

              {productForm.imageUrl ? (
                <div className="grid max-h-56 place-items-center overflow-hidden rounded-2xl border border-emerald-100 bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productForm.imageUrl}
                    alt="Photo du produit"
                    className="max-h-52 w-full rounded-xl object-contain"
                  />
                </div>
              ) : (
                <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
                  <span className="grid gap-2 text-sm font-bold text-slate-500">
                    <ImageIcon className="mx-auto size-8" />
                    Aucune photo
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadSelectedImage}
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={uploadSelectedImage}
              />

              <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || isPending}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black text-emerald-800 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <Upload className="size-5" />
                    Choisir une photo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploadingImage || isPending}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black text-emerald-800 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <Camera className="size-5" />
                    Prendre une photo
                  </span>
                </button>
              </div>

              {productForm.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, imageUrl: "" })}
                  disabled={isUploadingImage || isPending}
                  className="min-h-11 rounded-2xl border border-red-200 bg-red-50 px-4 text-base font-black text-red-700 disabled:opacity-60"
                >
                  Supprimer la photo
                </button>
              ) : null}

              {isUploadingImage ? (
                <p className="text-center text-sm font-bold text-emerald-800">Upload de la photo en cours...</p>
              ) : null}
            </div>

            <div className="grid gap-3 rounded-2xl bg-slate-50 p-3">
              <Toggle
                label="Produit disponible"
                sublabel={productForm.available ? "Visible sur le menu client" : "Masqué du menu client"}
                checked={productForm.available}
                onChange={(checked) => setProductForm({ ...productForm, available: checked })}
              />

              <Toggle
                label="Produit recommandé"
                sublabel={productForm.featured ? "Mis en avant sur le menu client" : "Affichage normal"}
                checked={productForm.featured}
                onChange={(checked) => setProductForm({ ...productForm, featured: checked })}
              />
            </div>

            <SmartOptionSuggestions
              categoryName={menuCategories.find((category) => category.id === productForm.categoryId)?.name}
            />

            <div className="sticky bottom-0 z-10 -mx-1 grid gap-2 border-t border-slate-200 bg-white/95 px-1 pt-3 backdrop-blur">
              <button
                type="submit"
                disabled={isPending || isUploadingImage}
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
                value={categoryForm.name}
                onChange={(event) => {
                  setCategoryForm({ ...categoryForm, name: event.target.value });
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

      {panelMode === "manage-categories" ? (
        <Panel title="Gérer les catégories" onClose={closePanel}>
          <div className="grid gap-5">
            <form className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3" onSubmit={saveCategory}>
              <Field
                label={categoryForm.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
                error={categoryError}
              >
                <input
                  value={categoryForm.name}
                  onChange={(event) => {
                    setCategoryForm({ ...categoryForm, name: event.target.value });
                    setCategoryError("");
                  }}
                  placeholder="Exemple : Burgers, Desserts, Boissons..."
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                />
              </Field>

              {categoryForm.id ? (
                <Toggle
                  label="Catégorie active"
                  sublabel={categoryForm.isActive ? "Visible dans les menus" : "Masquée des menus"}
                  checked={categoryForm.isActive}
                  onChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
                />
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="min-h-12 rounded-2xl bg-emerald-700 px-5 text-base font-black text-white shadow-green disabled:opacity-60"
              >
                {categoryForm.id ? "Enregistrer la catégorie" : "Ajouter la catégorie"}
              </button>

              {categoryForm.id ? (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryForm(emptyCategoryForm);
                    setCategoryError("");
                  }}
                  className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 text-base font-bold text-slate-700"
                >
                  Annuler la modification
                </button>
              ) : null}
            </form>

            <div className="grid gap-3">
              {menuCategories.map((category) => (
                <article
                  key={category.id}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
                >
                  <div>
                    <h3 className="text-xl font-black text-slate-950">{category.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {category.isActive === false ? "Catégorie masquée" : "Catégorie active"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => editCategory(category)}
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700"
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      disabled={isPending}
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:opacity-60"
                    >
                      {category.isActive === false ? "Réactiver" : "Masquer"}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeCategory(category)}
                      disabled={isPending}
                      className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-black text-red-700 disabled:opacity-60"
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Panel>
      ) : null}
    </>
  );
}