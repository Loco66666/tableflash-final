"use client";

import { useRef, useMemo, useState, useTransition } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  Camera,
  Check,
  ClipboardCheck,
  FolderCog,
  FolderPlus,
  ImageIcon,
  Plus,
  Search,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { ProductCard } from "@/components/ui-custom/ProductCard";
import type { Category, Product, ProductOptionGroup, ProductOptionsConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  bulkArchiveMenuProducts,
  bulkMoveMenuProductsToCategory,
  bulkUpdateMenuProductsAvailability,
  createMenuCategory,
  createMenuProduct,
  deleteMenuCategory,
  deleteMenuProduct,
  importMenuProductsFromSuggestions,
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
  optionsConfig: ProductOptionsConfig;
};

type ProductFormErrors = Partial<Record<"name" | "categoryId" | "price" | "promoPrice", string>>;

type CategoryFormState = {
  id: string | null;
  name: string;
  isActive: boolean;
};

type MenuImportDraftProduct = {
  id: string;
  name: string;
  categoryName: string;
  price: string;
  description: string;
  optionsConfig: ProductOptionsConfig;
};

type PanelMode = "add-product" | "edit-product" | "add-category" | "manage-categories" | "import-menu" | "menu-cleanup" | null;


function createEmptyOptionsConfig(): ProductOptionsConfig {
  return {
    groups: [],
    allergens: [],
    availability: {
      enabled: false,
    },
  };
}


const emptyProductForm: ProductFormState = {
  name: "",
  categoryId: "",
  price: "",
  promoPrice: "",
  description: "",
  available: true,
  featured: false,
  imageUrl: "",
  optionsConfig: createEmptyOptionsConfig(),
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

type MenuFamilyContext = {
  shouldGroupPizzaSections: boolean;
};

const PIZZA_SECTION_KEYWORDS = [
  "classique",
  "special",
  "mer",
  "fromage",
  "fromagere",
  "calzone",
  "oriental",
  "royal",
  "savoyard",
  "fermier",
  "texane",
  "vegetarien",
];

const GENERIC_CATEGORY_NAMES = ["categorie", "a classer", "autre", "autres", "divers"];

function hasAnyKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function isGenericCategoryName(categoryName?: string) {
  const normalizedName = normalizeText(categoryName ?? "");

  return GENERIC_CATEGORY_NAMES.includes(normalizedName);
}

function createMenuFamilyContext(categoryNames: string[]): MenuFamilyContext {
  const normalizedNames = categoryNames.map(normalizeText);
  const pizzaSectionScore = normalizedNames.filter((name) => hasAnyKeyword(name, PIZZA_SECTION_KEYWORDS)).length;

  return {
    shouldGroupPizzaSections:
      normalizedNames.some((name) => name.includes("pizza") || name.includes("pizzeria")) || pizzaSectionScore >= 2,
  };
}

function getMenuFamily(categoryName: string, context: MenuFamilyContext = { shouldGroupPizzaSections: false }) {
  const normalizedName = normalizeText(categoryName);

  if (
    normalizedName.includes("pizza") ||
    normalizedName.includes("fromage") ||
    normalizedName.includes("calzone")
  ) {
    return { id: "family-pizza", name: "Pizza" };
  }
  if (
    normalizedName.includes("sandwich") ||
    normalizedName.includes("burger") ||
    normalizedName.includes("wrap")
  ) {
    return { id: "family-sandwich", name: "Sandwich" };
  }
  if (normalizedName.includes("tacos")) return { id: "family-tacos", name: "Tacos" };
  if (normalizedName.includes("salade")) return { id: "family-salades", name: "Salades" };
  if (normalizedName.includes("assiette")) return { id: "family-assiettes", name: "Assiettes" };
  if (normalizedName.includes("pate")) return { id: "family-pates", name: "Pâtes" };
  if (normalizedName.includes("plat")) return { id: "family-plats", name: "Plats" };
  if (normalizedName.includes("menu") || normalizedName.includes("formule")) {
    return { id: "family-menus", name: "Menus et formules" };
  }
  if (normalizedName.includes("boisson") || normalizedName.includes("soda") || normalizedName.includes("eau")) {
    return { id: "family-boissons", name: "Boissons" };
  }
  if (normalizedName.includes("dessert") || normalizedName.includes("glace")) {
    return { id: "family-desserts", name: "Desserts" };
  }
  if (context.shouldGroupPizzaSections && hasAnyKeyword(normalizedName, PIZZA_SECTION_KEYWORDS)) {
    return { id: "family-pizza", name: "Pizza" };
  }

  return {
    id: `family-${normalizedName || "autres"}`,
    name: categoryName || "Autres",
  };
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
    optionsConfig: product.optionsConfig ?? createEmptyOptionsConfig(),
  };
}


type SmartOptionSuggestion = {
  label: string;
  group: ProductOptionGroup;
};

function createOptionGroup(
  id: string,
  name: string,
  type: ProductOptionGroup["type"],
  itemNames: string[],
  required = false,
): ProductOptionGroup {
  return {
    id,
    name,
    type,
    required,
    items: itemNames.map((itemName) => ({
      id: normalizeText(`${id}-${itemName}`),
      name: itemName,
      price: 0,
    })),
  };
}

function getSmartOptionSuggestions(categoryName?: string): SmartOptionSuggestion[] {
  const normalizedCategory = normalizeText(categoryName ?? "");

  if (normalizedCategory.includes("pizza") || normalizedCategory.includes("pizzeria")) {
    return [
      {
        label: "Tailles 29 cm / 33 cm",
        group: createOptionGroup("sizes", "Taille", "single_choice", ["29 cm", "33 cm", "Méga 40 cm"], true),
      },
      {
        label: "Base tomate / crème",
        group: createOptionGroup("base", "Base", "single_choice", ["Base tomate", "Base crème"], false),
      },
      {
        label: "Suppléments pizza",
        group: createOptionGroup("supplements", "Suppléments", "multiple_choice", ["Fromage", "Œuf", "Champignons", "Jambon", "Poulet"]),
      },
    ];
  }

  if (normalizedCategory.includes("tacos") || normalizedCategory.includes("kebab")) {
    return [
      {
        label: "Choix de viande",
        group: createOptionGroup("meat", "Viande", "multiple_choice", ["Kebab", "Poulet", "Steak", "Merguez"], true),
      },
      {
        label: "Choix de sauce",
        group: createOptionGroup("sauce", "Sauce", "single_choice", ["Blanche", "Algérienne", "Samouraï", "Andalouse"], true),
      },
      {
        label: "Formule seul / menu",
        group: createOptionGroup("formula", "Formule", "single_choice", ["Seul", "Menu avec boisson"], false),
      },
    ];
  }

  if (normalizedCategory.includes("burger") || normalizedCategory.includes("hamburger")) {
    return [
      {
        label: "Suppléments burger",
        group: createOptionGroup("supplements", "Suppléments", "multiple_choice", ["Cheddar", "Bacon", "Œuf", "Double steak"]),
      },
      {
        label: "Cuisson steak",
        group: createOptionGroup("cooking", "Cuisson", "single_choice", ["Saignant", "À point", "Bien cuit"]),
      },
      {
        label: "Formule menu",
        group: createOptionGroup("formula", "Formule", "single_choice", ["Burger seul", "Menu frites + boisson"]),
      },
    ];
  }

  if (
    normalizedCategory.includes("boisson") ||
    normalizedCategory.includes("soda") ||
    normalizedCategory.includes("eau") ||
    normalizedCategory.includes("jus")
  ) {
    return [
      {
        label: "Formats bouteille / canette",
        group: createOptionGroup("drink-size", "Format", "single_choice", ["33 cl", "50 cl", "1 L", "1,5 L", "2 L"]),
      },
      {
        label: "Glaçons / citron",
        group: createOptionGroup("drink-options", "Options boisson", "multiple_choice", ["Glaçons", "Sans glaçons", "Citron", "Paille"]),
      },
      {
        label: "Pack / menu",
        group: createOptionGroup("drink-formula", "Formule", "single_choice", ["À l’unité", "Avec menu", "Pack famille"]),
      },
    ];
  }

  if (
    normalizedCategory.includes("cafe") ||
    normalizedCategory.includes("coffee") ||
    normalizedCategory.includes("latte") ||
    normalizedCategory.includes("the") ||
    normalizedCategory.includes("chocolat")
  ) {
    return [
      {
        label: "Taille café",
        group: createOptionGroup("coffee-size", "Taille", "single_choice", ["Petit", "Moyen", "Grand"]),
      },
      {
        label: "Type de lait",
        group: createOptionGroup("milk", "Lait", "single_choice", ["Entier", "Avoine", "Soja", "Amande"]),
      },
      {
        label: "Chaud / glacé",
        group: createOptionGroup("temperature", "Préparation", "single_choice", ["Chaud", "Glacé"]),
      },
    ];
  }

  if (
    normalizedCategory.includes("plat") ||
    normalizedCategory.includes("brasserie") ||
    normalizedCategory.includes("viande") ||
    normalizedCategory.includes("grillade")
  ) {
    return [
      {
        label: "Cuisson",
        group: createOptionGroup("cooking", "Cuisson", "single_choice", ["Bleu", "Saignant", "À point", "Bien cuit"]),
      },
      {
        label: "Sauce",
        group: createOptionGroup("sauce", "Sauce", "single_choice", ["Poivre", "Roquefort", "Béarnaise"]),
      },
      {
        label: "Accompagnement",
        group: createOptionGroup("side", "Accompagnement", "single_choice", ["Frites", "Salade", "Riz", "Légumes"]),
      },
    ];
  }

  if (normalizedCategory.includes("sushi") || normalizedCategory.includes("maki") || normalizedCategory.includes("california")) {
    return [
      {
        label: "Sauce soja",
        group: createOptionGroup("soy", "Sauce soja", "single_choice", ["Sucrée", "Salée"]),
      },
      {
        label: "Wasabi / gingembre",
        group: createOptionGroup("wasabi-ginger", "Accompagnements", "multiple_choice", ["Wasabi", "Gingembre"]),
      },
      {
        label: "Suppléments japonais",
        group: createOptionGroup("supplements", "Suppléments", "multiple_choice", ["Soupe miso", "Riz", "Salade de chou"]),
      },
    ];
  }

  if (normalizedCategory.includes("crepe") || normalizedCategory.includes("galette")) {
    return [
      {
        label: "Cuisson Œuf",
        group: createOptionGroup("egg", "Œuf", "single_choice", ["Miroir", "Brouillé", "Sans Œuf"]),
      },
      {
        label: "Suppléments crêperie",
        group: createOptionGroup("supplements", "Suppléments", "multiple_choice", ["Fromage", "Jambon", "Champignons"]),
      },
      {
        label: "Formule",
        group: createOptionGroup("formula", "Formule", "single_choice", ["Produit seul", "Formule avec boisson"]),
      },
    ];
  }

  if (normalizedCategory.includes("glace") || normalizedCategory.includes("glacier") || normalizedCategory.includes("coupe")) {
    return [
      {
        label: "Parfums",
        group: createOptionGroup("flavours", "Parfums", "multiple_choice", ["Vanille", "Chocolat", "Fraise", "Pistache"]),
      },
      {
        label: "Toppings",
        group: createOptionGroup("toppings", "Toppings", "multiple_choice", ["Chantilly", "Coulis chocolat", "Noisettes"]),
      },
      {
        label: "Pot / cornet",
        group: createOptionGroup("container", "Service", "single_choice", ["Pot", "Cornet"]),
      },
    ];
  }

  return [
    {
      label: "Taille / format",
      group: createOptionGroup("size", "Taille / format", "single_choice", ["Petit", "Moyen", "Grand"]),
    },
    {
      label: "Choix client",
      group: createOptionGroup("choice", "Choix client", "single_choice", ["Option 1", "Option 2"]),
    },
    {
      label: "Supplément",
      group: createOptionGroup("supplements", "Suppléments", "multiple_choice", ["Supplément 1", "Supplément 2"]),
    },
    {
      label: "Allergènes",
      group: createOptionGroup("allergens", "Allergènes", "multiple_choice", ["Gluten", "Lait", "Œufs", "Fruits à coque"]),
    },
  ];
}


function ProductOptionsEditor({
  categoryName,
  optionsConfig,
  onChange,
}: {
  categoryName?: string;
  optionsConfig: ProductOptionsConfig;
  onChange: (nextOptionsConfig: ProductOptionsConfig) => void;
}) {
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});
  const [itemPriceInputs, setItemPriceInputs] = useState<Record<string, string>>({});
  const suggestions = getSmartOptionSuggestions(categoryName);

  function addGroup(group: ProductOptionGroup) {
    const exists = optionsConfig.groups.some((currentGroup) => currentGroup.id === group.id);

    if (exists) return;

    onChange({
      ...optionsConfig,
      groups: [...optionsConfig.groups, group],
    });
  }

  function removeGroup(groupId: string) {
    onChange({
      ...optionsConfig,
      groups: optionsConfig.groups.filter((group) => group.id !== groupId),
    });
  }

  function updateGroup(groupId: string, nextGroup: ProductOptionGroup) {
    onChange({
      ...optionsConfig,
      groups: optionsConfig.groups.map((group) => (group.id === groupId ? nextGroup : group)),
    });
  }

  function updateItemName(group: ProductOptionGroup, itemId: string, name: string) {
    updateGroup(group.id, {
      ...group,
      items: group.items.map((item) => (item.id === itemId ? { ...item, name } : item)),
    });
  }

  function updateItemPrice(group: ProductOptionGroup, itemId: string, price: string) {
    const rawPrice = price.replace(",", ".");

    if (!/^\d{0,5}(\.\d{0,8})?$/.test(rawPrice)) return;

    setItemPriceInputs((current) => ({
      ...current,
      [itemId]: price,
    }));

    if (rawPrice === "" || rawPrice === "." || rawPrice.endsWith(".")) return;

    const numericPrice = Number(rawPrice);

    if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 99999.99999999) return;

    updateGroup(group.id, {
      ...group,
      items: group.items.map((item) => (item.id === itemId ? { ...item, price: numericPrice } : item)),
    });
  }

  function removeItem(group: ProductOptionGroup, itemId: string) {
    updateGroup(group.id, {
      ...group,
      items: group.items.filter((item) => item.id !== itemId),
    });
  }

  function addCustomItem(group: ProductOptionGroup) {
    const rawName = newItemNames[group.id]?.trim();

    if (!rawName) return;

    const itemId = normalizeText(`${group.id}-${rawName}-${Date.now()}`);

    updateGroup(group.id, {
      ...group,
      items: [
        ...group.items,
        {
          id: itemId,
          name: rawName,
          price: 0,
        },
      ],
    });

    setNewItemNames((current) => ({
      ...current,
      [group.id]: "",
    }));
  }

  return (
    <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="text-base font-black text-slate-950">Ajouter des options avancées</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
            Tailles, sauces, suppléments, formules, disponibilité et allergènes.
          </p>
        </div>

        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-50 text-xl font-black text-slate-500 transition group-open:rotate-45">
          +
        </span>
      </summary>

      <div className="grid gap-3 border-t border-slate-100 px-4 pb-4 pt-3">
        <div className="rounded-2xl bg-emerald-50 p-3">
          <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-900">
                {categoryName ? `Suggestions pour ${categoryName}` : "Suggestions intelligentes"}
              </p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-800/80">
                Cliquez sur un modèle pour créer une section modifiable.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => {
              const alreadyAdded = optionsConfig.groups.some((group) => group.id === suggestion.group.id);

              return (
                <button
                  key={suggestion.group.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => addGroup(suggestion.group)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <Plus className="size-4" />
                  {alreadyAdded ? "Ajouté" : suggestion.label}
                </button>
              );
            })}
          </div>
        </div>

        {optionsConfig.groups.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Options ajoutées</p>

            {optionsConfig.groups.map((group) => (
              <div key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <input
                      value={group.name}
                      onChange={(event) => updateGroup(group.id, { ...group, name: event.target.value })}
                      className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                      aria-label="Nom du groupe d'options"
                    />

                    <label className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                      <input
                        type="checkbox"
                        checked={group.required}
                        onChange={(event) => updateGroup(group.id, { ...group, required: event.target.checked })}
                        className="size-4 accent-emerald-700"
                      />
                      Choix obligatoire
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-red-100 bg-white text-red-600"
                    aria-label={`Supprimer ${group.name}`}
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="mt-3 grid gap-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="grid gap-2 min-[430px]:grid-cols-[1fr_112px_40px] min-[430px]:items-center">
                      <input
                        value={item.name}
                        onChange={(event) => updateItemName(group, item.id, event.target.value)}
                        className="min-h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                        aria-label="Nom de l'option"
                      />

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={itemPriceInputs[item.id] ?? String(item.price ?? 0)}
                          onChange={(event) => updateItemPrice(group, item.id, event.target.value)}
                          onBlur={() =>
                            setItemPriceInputs((current) => ({
                              ...current,
                              [item.id]: String(item.price ?? 0),
                            }))
                          }
                          placeholder="0.00"
                          className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-7 text-sm font-bold text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                          aria-label="Prix supplémentaire"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                          
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(group, item.id)}
                        className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"
                        aria-label={`Supprimer ${item.name}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <input
                      value={newItemNames[group.id] ?? ""}
                      onChange={(event) =>
                        setNewItemNames((current) => ({
                          ...current,
                          [group.id]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomItem(group);
                        }
                      }}
                      placeholder="Ajouter une option puis Entrée"
                      className="min-h-10 min-w-0 flex-1 rounded-xl border border-dashed border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                    />

                    <button
                      type="button"
                      onClick={() => addCustomItem(group)}
                      className="min-h-10 shrink-0 rounded-xl bg-emerald-700 px-3 text-xs font-black text-white"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-semibold leading-relaxed text-slate-500">
            Aucun groupe ajouté pour le moment. Le produit peut rester simple si vous n&apos;avez pas besoin
            d&apos;options.
          </p>
        )}
      </div>
    </details>
  );
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


export function MenuManager({
  initialCategories,
  initialProducts,
}: {
  initialCategories: MenuCategory[];
  initialProducts: Product[];
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const menuImportFileInputRef = useRef<HTMLInputElement | null>(null);
  const menuImportCameraInputRef = useRef<HTMLInputElement | null>(null);
  const categoryFormRef = useRef<HTMLFormElement | null>(null);
  const categoryNameInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isExtractingMenuPhoto, setIsExtractingMenuPhoto] = useState(false);
  const [descriptionAiFeedback, setDescriptionAiFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => new Set());
  const [selectedCategoryProductIds, setSelectedCategoryProductIds] = useState<Set<string>>(() => new Set());
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productErrors, setProductErrors] = useState<ProductFormErrors>({});
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [categoryError, setCategoryError] = useState("");
  const [menuImportDraftProducts, setMenuImportDraftProducts] = useState<MenuImportDraftProduct[]>([]);
  const [menuImportImageName, setMenuImportImageName] = useState("");
  const [expandedImportProductId, setExpandedImportProductId] = useState<string | null>(null);
  const [bulkMoveCategoryId, setBulkMoveCategoryId] = useState("");
  const [categoryMoveTargetId, setCategoryMoveTargetId] = useState("");
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

  const menuFamilyContext = useMemo(
    () => createMenuFamilyContext(activeCategories.map((category) => category.name)),
    [activeCategories],
  );

  const categoryById = useMemo(
    () => new Map(menuCategories.map((category) => [category.id, category])),
    [menuCategories],
  );

  const filterCategories = useMemo(() => {
    const familyById = new Map<string, { id: string; name: string; icon: string; isActive: boolean }>();

    for (const category of activeCategories) {
      const family = getMenuFamily(category.name, menuFamilyContext);
      if (!familyById.has(family.id)) {
        familyById.set(family.id, {
          ...family,
          icon: "sparkles",
          isActive: true,
        });
      }
    }

    return [{ id: "all", name: "Tous", icon: "sparkles", isActive: true }, ...familyById.values()];
  }, [activeCategories, menuFamilyContext]);

  const products = useMemo(
    () =>
      initialProducts.map((product) => {
        const categoryName = categoryById.get(product.categoryId)?.name ?? "Catégorie";
        const family = getMenuFamily(categoryName, menuFamilyContext);

        return {
          ...product,
          categoryName,
          categoryFamilyId: family.id,
          categoryFamilyName: family.name,
        };
      }),
    [categoryById, initialProducts, menuFamilyContext],
  );

  const productCountByCategoryId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of initialProducts) {
      if (!product.categoryId) continue;
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }

    return counts;
  }, [initialProducts]);

  const emptyCategories = useMemo(
    () => menuCategories.filter((category) => (productCountByCategoryId.get(category.id) ?? 0) === 0),
    [menuCategories, productCountByCategoryId],
  );
  const productsWithoutPhoto = useMemo(
    () => products.filter((product) => !(product.imageUrl || product.imageDataUrl)),
    [products],
  );
  const productsWithPriceIssue = useMemo(
    () => products.filter((product) => !Number.isFinite(product.price) || product.price <= 0),
    [products],
  );
  const duplicateProductGroups = useMemo(() => {
    const groups = new Map<string, typeof products>();

    for (const product of products) {
      if (isGenericCategoryName(product.categoryName)) continue;

      const key = normalizeText(product.name);
      if (!key) continue;

      const group = groups.get(key) ?? [];
      group.push(product);
      groups.set(key, group);
    }

    return [...groups.entries()]
      .map(([key, duplicateProducts]) => ({
        key,
        name: duplicateProducts[0]?.name ?? "Produit",
        products: duplicateProducts,
      }))
      .filter((group) => group.products.length > 1);
  }, [products]);
  const menuCleanupIssueCount =
    emptyCategories.length + productsWithPriceIssue.length;

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return products.filter((product) => {
      const categoryName = product.categoryName ?? "";
      const matchesSearch = normalizedSearch
        ? normalizeText(`${product.name} ${categoryName} ${product.description}`).includes(normalizedSearch)
        : true;

      const isAvailable = typeof product.available === "boolean" ? product.available : true;

      const matchesCategory =
        selectedCategoryId === "all"
          ? isAvailable
          : selectedCategoryId === "unavailable"
            ? !isAvailable
            : isAvailable && product.categoryFamilyId === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategoryId]);

  const selectedProductCount = selectedProductIds.size;
  const selectedFilterCategory = useMemo(
    () =>
      selectedCategoryId === "all" || selectedCategoryId === "unavailable"
        ? null
        : filterCategories.find((category) => category.id === selectedCategoryId) ?? null,
    [filterCategories, selectedCategoryId],
  );
  const selectableProductIds = useMemo(
    () =>
      filteredProducts
        .filter((product) => selectedCategoryId === "unavailable" || product.available !== false)
        .map((product) => product.id),
    [filteredProducts, selectedCategoryId],
  );
  const allAvailableProductIds = useMemo(
    () => products.filter((product) => product.available !== false).map((product) => product.id),
    [products],
  );
  const selectableProductCount = selectableProductIds.length;
  const allVisibleProductsSelected =
    selectableProductIds.length > 0 && selectableProductIds.every((productId) => selectedProductIds.has(productId));
  const allMenuProductsSelected =
    allAvailableProductIds.length > 0 && allAvailableProductIds.every((productId) => selectedProductIds.has(productId));
  const selectionContextLabel = selectedFilterCategory
    ? `Produits disponibles de ${selectedFilterCategory.name}`
    : selectedCategoryId === "unavailable"
      ? "Produits indisponibles"
      : "Produits disponibles affichés";
  const selectVisibleButtonLabel = selectedFilterCategory
    ? `Sélectionner ${selectedFilterCategory.name}`
    : selectedCategoryId === "unavailable"
      ? "Sélectionner les indisponibles"
      : "Sélectionner la vue";
  const productSections = useMemo(() => {
    const shouldGroupBySubcategory = selectedCategoryId !== "all" && selectedCategoryId !== "unavailable";

    if (!shouldGroupBySubcategory) {
      return [
        {
          id: "all-products",
          title: null as string | null,
          products: filteredProducts,
        },
      ];
    }

    const sections = new Map<string, { id: string; title: string; products: typeof filteredProducts }>();

    for (const product of filteredProducts) {
      const title = product.categoryName ?? "Autres";
      const id = normalizeText(title) || "autres";
      const section = sections.get(id) ?? {
        id,
        title,
        products: [],
      };

      section.products.push(product);
      sections.set(id, section);
    }

    return [...sections.values()];
  }, [filteredProducts, selectedCategoryId]);
  const categoryEditProducts = useMemo(
    () => (categoryForm.id ? products.filter((product) => product.categoryId === categoryForm.id) : []),
    [categoryForm.id, products],
  );
  const selectedCategoryProductCount = selectedCategoryProductIds.size;
  const categoryEditProductIds = useMemo(
    () => categoryEditProducts.map((product) => product.id),
    [categoryEditProducts],
  );
  const allCategoryProductsSelected =
    categoryEditProductIds.length > 0 &&
    categoryEditProductIds.every((productId) => selectedCategoryProductIds.has(productId));

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

  function openMenuCleanup() {
    setCategoryForm(emptyCategoryForm);
    setSelectedCategoryProductIds(new Set());
    setActionError("");
    setActionMessage("");
    setPanelMode("menu-cleanup");
  }

  function openMenuImport() {
    setMenuImportDraftProducts([]);
    setMenuImportImageName("");
    setExpandedImportProductId(null);
    setActionError("");
    setActionMessage("");
    setPanelMode("import-menu");
  }

  function closePanel() {
    setPanelMode(null);
    setEditingProductId(null);
    setProductErrors({});
    setCategoryError("");
    setActionError("");
    setActionMessage("");
    setDescriptionAiFeedback(null);
    setIsUploadingImage(false);
    setIsExtractingMenuPhoto(false);
    setBulkMoveCategoryId("");
    setCategoryMoveTargetId("");
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

  async function generateProductDescription() {
    const productName = productForm.name.trim();

    if (!productName) {
      setDescriptionAiFeedback({
        type: "error",
        text: "Ajoutez d'abord le nom du produit.",
      });
      return;
    }

    const categoryName = menuCategories.find((category) => category.id === productForm.categoryId)?.name ?? "";

    setIsGeneratingDescription(true);
    setActionError("");
    setActionMessage("");
    setDescriptionAiFeedback(null);

    try {
      const response = await fetch("/api/ai/product-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: productName,
          categoryName,
          descriptionDraft: productForm.description,
        }),
      });

      let result: {
        ok?: boolean;
        description?: string;
        message?: string;
      } = {};

      try {
        result = (await response.json()) as typeof result;
      } catch {
        result = {};
      }

      if (!response.ok || !result.ok || !result.description) {
        throw new Error(result.message ?? "Description IA impossible pour le moment.");
      }

      setProductForm((currentForm) => ({
        ...currentForm,
        description: result.description ?? currentForm.description,
      }));

      setDescriptionAiFeedback({
        type: "success",
        text: "Description générée. Vous pouvez la modifier avant d'enregistrer.",
      });
    } catch (error) {
      setDescriptionAiFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Description IA impossible pour le moment.",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  }

  async function extractMenuPhoto(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) return;

    const unsupportedFile = files.find((file) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type));

    if (unsupportedFile) {
      setActionError("Format non supporté pour l'import IA. Utilisez JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    setIsExtractingMenuPhoto(true);
    setActionError("");
    setActionMessage("");
    setMenuImportImageName(files.length === 1 ? files[0].name : `${files.length} photos`);

    try {
      const response = await fetch("/api/ai/menu-photo-import", {
        method: "POST",
        body: formData,
      });

      let result: {
        ok?: boolean;
        products?: {
          name?: string;
          categoryName?: string;
          price?: number;
          description?: string;
          optionsConfig?: ProductOptionsConfig;
        }[];
        message?: string;
      } = {};

      try {
        result = (await response.json()) as typeof result;
      } catch {
        result = {};
      }

      if (!response.ok || !result.ok || !Array.isArray(result.products)) {
        throw new Error(result.message ?? "Lecture IA du menu impossible.");
      }

      setMenuImportDraftProducts(
        result.products.map((product, index) => ({
          id: `${Date.now()}-${index}`,
          name: product.name ?? "",
          categoryName: product.categoryName ?? "À classer",
          price: typeof product.price === "number" ? formatPriceInput(product.price) : "",
          description: product.description ?? "",
          optionsConfig: product.optionsConfig ?? createEmptyOptionsConfig(),
        })),
      );
      setExpandedImportProductId(null);
      setActionMessage(`${result.products.length} produit(s) détecté(s). Vérifiez avant import.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Lecture IA du menu impossible.");
      setMenuImportDraftProducts([]);
    } finally {
      setIsExtractingMenuPhoto(false);
      event.target.value = "";
    }
  }

  function updateMenuImportProduct(productId: string, field: keyof Omit<MenuImportDraftProduct, "id">, value: string) {
    setMenuImportDraftProducts((currentProducts) =>
      currentProducts.map((product) => (product.id === productId ? { ...product, [field]: value } : product)),
    );
  }

  function removeMenuImportProduct(productId: string) {
    setMenuImportDraftProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
  }

  function importMenuDraftProducts() {
    const productsToImport = menuImportDraftProducts
      .map((product) => ({
        name: product.name.trim(),
        categoryName: product.categoryName.trim(),
        price: parsePrice(product.price),
        description: product.description.trim(),
        optionsConfig: product.optionsConfig,
      }))
      .filter((product) => product.name && product.categoryName && Number.isFinite(product.price) && product.price > 0);

    if (productsToImport.length === 0) {
      setActionError("Aucun produit valide à importer.");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const result = await importMenuProductsFromSuggestions({
            products: productsToImport,
          });

          setActionMessage(
            `${result.importedProducts} produit(s) importé(s). ${result.createdCategories} catégorie(s) créée(s).`,
          );
          closePanel();
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Import impossible.");
        }
      })();
    });
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
            optionsConfig: productForm.optionsConfig,
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
          setSelectedCategoryProductIds(new Set());

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
    setSelectedCategoryProductIds(new Set());
    setCategoryMoveTargetId("");
    setCategoryError("");
    setActionError("");
    setActionMessage("");

    window.requestAnimationFrame(() => {
      categoryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      categoryNameInputRef.current?.focus();
      categoryNameInputRef.current?.select();
    });
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
    const productCount = productCountByCategoryId.get(category.id) ?? 0;
    const confirmed =
      productCount > 0
        ? window.confirm(
            `Supprimer la catégorie "${category.name}" ?\n\nElle contient ${productCount} produit(s). Ils seront archivés, rendus indisponibles et retirés de cette catégorie.`,
          )
        : window.confirm(`Supprimer la catégorie "${category.name}" ?`);

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const result = await deleteMenuCategory({
            categoryId: category.id,
            archiveProducts: productCount > 0,
          });

          if (result.archivedProducts > 0) {
            setActionMessage(`${result.archivedProducts} produit(s) archivé(s). Catégorie supprimée.`);
          }

          setCategoryForm(emptyCategoryForm);
          setSelectedCategoryProductIds(new Set());
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Suppression impossible.");
        }
      })();
    });
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (nextSelection.has(productId)) {
        nextSelection.delete(productId);
      } else {
        nextSelection.add(productId);
      }

      return nextSelection;
    });
  }

  function selectVisibleProducts() {
    setSelectedProductIds((currentSelection) => new Set([...currentSelection, ...selectableProductIds]));
  }

  function selectAllMenuProducts() {
    setSelectedProductIds(new Set(allAvailableProductIds));
  }

  function clearProductSelection() {
    setSelectedProductIds(new Set());
    setBulkMoveCategoryId("");
  }

  function selectProductsForCleanup(productIds: string[], message: string) {
    setSelectedProductIds(new Set(productIds));
    setSelectedCategoryId("all");
    setSearch("");
    setPanelMode(null);
    setActionMessage(message);
    setActionError("");
  }

  function toggleCategoryProductSelection(productId: string) {
    setSelectedCategoryProductIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (nextSelection.has(productId)) {
        nextSelection.delete(productId);
      } else {
        nextSelection.add(productId);
      }

      return nextSelection;
    });
  }

  function selectAllCategoryProducts() {
    setSelectedCategoryProductIds(new Set(categoryEditProductIds));
  }

  function clearCategoryProductSelection() {
    setSelectedCategoryProductIds(new Set());
    setCategoryMoveTargetId("");
  }

  function bulkMoveSelection() {
    const productIds = Array.from(selectedProductIds);
    const targetCategory = menuCategories.find((category) => category.id === bulkMoveCategoryId);

    if (productIds.length === 0 || !targetCategory) return;

    const confirmed = window.confirm(
      `Déplacer ${productIds.length} produit(s) vers "${targetCategory.name}" ?`,
    );

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const result = await bulkMoveMenuProductsToCategory({
            productIds,
            categoryId: targetCategory.id,
          });

          setSelectedProductIds(new Set());
          setBulkMoveCategoryId("");
          setActionMessage(`${result.movedProducts} produit(s) déplacé(s) vers "${targetCategory.name}".`);
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Déplacement groupé impossible.");
        }
      })();
    });
  }

  function bulkMoveCategoryProductSelection() {
    const productIds = Array.from(selectedCategoryProductIds);
    const targetCategory = menuCategories.find((category) => category.id === categoryMoveTargetId);

    if (productIds.length === 0 || !targetCategory) return;

    const confirmed = window.confirm(
      `Déplacer ${productIds.length} produit(s) vers "${targetCategory.name}" ?`,
    );

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const result = await bulkMoveMenuProductsToCategory({
            productIds,
            categoryId: targetCategory.id,
          });

          setSelectedCategoryProductIds(new Set());
          setCategoryMoveTargetId("");
          setActionMessage(`${result.movedProducts} produit(s) déplacé(s) vers "${targetCategory.name}".`);
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Déplacement groupé impossible.");
        }
      })();
    });
  }

  function bulkDisableSelection() {
    const productIds = Array.from(selectedProductIds);

    if (productIds.length === 0) return;

    const confirmed = window.confirm(
      `Rendre ${productIds.length} produit(s) indisponible(s) ?\n\nIls resteront dans votre catalogue, mais ne seront plus commandables côté client.`,
    );

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const result = await bulkUpdateMenuProductsAvailability({
            productIds,
            available: false,
          });

          setSelectedProductIds(new Set());
          setActionMessage(`${result.updatedProducts} produit(s) rendu(s) indisponible(s).`);
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Action groupée impossible.");
        }
      })();
    });
  }

  function bulkArchiveSelection() {
    const productIds = Array.from(selectedProductIds);

    if (productIds.length === 0) return;

    const confirmed = window.confirm(
      `Supprimer ${productIds.length} produit(s) du menu ?\n\nIls seront retirés du menu et rendus indisponibles, mais l'historique des commandes sera conservé.`,
    );

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const result = await bulkArchiveMenuProducts({
            productIds,
          });

          setSelectedProductIds(new Set());
          setActionMessage(
            `${result.deletedProducts} produit(s) supprimé(s). ${result.archivedProducts} produit(s) conservé(s) pour l'historique et retiré(s) du menu.`,
          );
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Archivage groupé impossible.");
        }
      })();
    });
  }

  function bulkArchiveCategoryProductSelection() {
    const productIds = Array.from(selectedCategoryProductIds);

    if (productIds.length === 0) return;

    const confirmed = window.confirm(
      `Archiver ${productIds.length} produit(s) de cette catégorie ?\n\nIls seront retirés du menu et rendus indisponibles, mais l'historique des commandes sera conservé.`,
    );

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");
          setActionMessage("");

          const result = await bulkArchiveMenuProducts({
            productIds,
          });

          setSelectedCategoryProductIds(new Set());
          setSelectedProductIds((currentSelection) => {
            const nextSelection = new Set(currentSelection);
            for (const productId of productIds) {
              nextSelection.delete(productId);
            }
            return nextSelection;
          });
          setActionMessage(
            `${result.deletedProducts} produit(s) supprimé(s). ${result.archivedProducts} produit(s) conservé(s) pour l'historique et retiré(s) de cette catégorie.`,
          );
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Archivage groupé impossible.");
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

          setSelectedProductIds((currentSelection) => {
            const nextSelection = new Set(currentSelection);
            nextSelection.delete(product.id);
            return nextSelection;
          });

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
            onClick={openMenuImport}
            disabled={isPending || isExtractingMenuPhoto}
            className="min-h-16 rounded-[1.2rem] border border-slate-200 bg-white text-lg font-black text-emerald-800 shadow-card disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-3">
              <Wand2 className="size-7" />
              Importer photo
            </span>
          </button>

          <button
            type="button"
            onClick={openMenuCleanup}
            disabled={isPending || menuCategories.length === 0}
            className="min-h-16 rounded-[1.2rem] border border-slate-200 bg-white text-lg font-black text-emerald-800 shadow-card disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-3">
              <ClipboardCheck className="size-7" />
              Nettoyer menu
              {menuCleanupIssueCount > 0 ? (
                <span className="grid min-w-6 place-items-center rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">
                  {menuCleanupIssueCount}
                </span>
              ) : null}
            </span>
          </button>

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
            onClick={() => {
              setSelectedCategoryId(category.id);
              clearProductSelection();
            }}
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
          onClick={() => {
            setSelectedCategoryId("unavailable");
            clearProductSelection();
          }}
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

      {filteredProducts.length > 0 ? (
        <div className="mb-4 grid gap-3 rounded-[1.2rem] border border-slate-200 bg-white p-3 shadow-card">
          <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <div>
              <p className="text-sm font-black text-slate-700">
                {selectedProductCount > 0 ? `${selectedProductCount} produit(s) sélectionné(s)` : selectionContextLabel}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {selectedCategoryId === "unavailable"
                  ? `${filteredProducts.length} produit(s) indisponible(s) affiché(s)`
                  : `${selectableProductCount} produit(s) disponible(s) sélectionnable(s)`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={allVisibleProductsSelected ? clearProductSelection : selectVisibleProducts}
                disabled={isPending || selectableProductCount === 0}
                className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 disabled:opacity-60"
              >
                {allVisibleProductsSelected ? "Tout désélectionner" : selectVisibleButtonLabel}
              </button>

              <button
                type="button"
                onClick={allMenuProductsSelected ? clearProductSelection : selectAllMenuProducts}
                disabled={isPending || allAvailableProductIds.length === 0}
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 disabled:opacity-60"
              >
                {allMenuProductsSelected ? "Désélectionner le menu" : "Sélectionner tout le menu"}
              </button>

              {selectedProductCount > 0 ? (
                <button
                  type="button"
                  onClick={clearProductSelection}
                  disabled={isPending}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 disabled:opacity-60"
                >
                  Annuler
                </button>
              ) : null}
            </div>
          </div>

          {selectedProductCount > 0 ? (
            <div className="grid gap-2">
              <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-[1fr_auto]">
                <select
                  value={bulkMoveCategoryId}
                  onChange={(event) => setBulkMoveCategoryId(event.target.value)}
                  disabled={isPending}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  aria-label="Catégorie de destination"
                >
                  <option value="">Déplacer vers une catégorie</option>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={bulkMoveSelection}
                  disabled={isPending || !bulkMoveCategoryId}
                  className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 disabled:opacity-60"
                >
                  Déplacer
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-2">
              <button
                type="button"
                onClick={bulkDisableSelection}
                disabled={isPending}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 disabled:opacity-60"
              >
                Rendre indisponibles
              </button>

              <button
                type="button"
                onClick={bulkArchiveSelection}
                disabled={isPending}
                className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 disabled:opacity-60"
              >
                Supprimer/retirer la sélection
              </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4">
        {filteredProducts.length > 0 ? (
          productSections.map((section) => (
            <section key={section.id} className="grid gap-3">
              {section.title ? (
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                  <h2 className="text-lg font-black text-slate-950">{section.title}</h2>
                  <span className="shrink-0 text-xs font-black uppercase tracking-wide text-slate-400">
                    {section.products.length} produit(s)
                  </span>
                </div>
              ) : null}

              {section.products.map((product) => {
                const isSelected = selectedProductIds.has(product.id);

                return (
                  <div key={product.id} className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => toggleProductSelection(product.id)}
                      disabled={isPending}
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-3 rounded-xl border px-4 text-left text-sm font-black shadow-card transition disabled:opacity-60",
                        isSelected
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-600",
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="inline-flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-md border",
                            isSelected ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white",
                          )}
                        >
                          {isSelected ? <Check className="size-3.5" /> : null}
                        </span>
                        <span className="truncate">{isSelected ? "Prêt à supprimer" : "Cocher pour suppression"}</span>
                      </span>
                      <span className="min-w-0 truncate text-xs font-black text-slate-400">{product.name}</span>
                    </button>

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
                );
              })}
            </section>
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
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    categoryId: event.target.value,
                    optionsConfig: createEmptyOptionsConfig(),
                  })
                }
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

            <Field
              label="Description"
              helper="Ajoutez quelques ingrédients ou infos, puis laissez l'IA proposer une description courte."
            >
              <textarea
                value={productForm.description}
                onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
                rows={3}
                placeholder="Ex : steak, cheddar, sauce maison"
                className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />

              <button
                type="button"
                onClick={generateProductDescription}
                disabled={isPending || isGeneratingDescription || !productForm.name.trim()}
                className="mt-2 min-h-11 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                {isGeneratingDescription ? "Génération en cours..." : "Générer une description avec IA"}
              </button>

              {descriptionAiFeedback ? (
                <p
                  className={cn(
                    "mt-2 rounded-2xl px-4 py-3 text-sm font-bold",
                    descriptionAiFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  {descriptionAiFeedback.text}
                </p>
              ) : null}
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
            <ProductOptionsEditor
              categoryName={menuCategories.find((category) => category.id === productForm.categoryId)?.name}
              optionsConfig={productForm.optionsConfig}
              onChange={(optionsConfig) => setProductForm({ ...productForm, optionsConfig })}
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

      {panelMode === "import-menu" ? (
        <Panel title="Importer un menu par photo" onClose={closePanel}>
          <div className="grid gap-4 safe-pb-form">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-base font-black text-emerald-900">Photo du menu actuel</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-emerald-800/80">
                Prenez une photo nette. L&apos;IA propose les produits, puis vous corrigez avant import.
              </p>
            </div>

            <input ref={menuImportFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={extractMenuPhoto} />
            <input ref={menuImportCameraInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" className="hidden" onChange={extractMenuPhoto} />

            <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
              <button type="button" onClick={() => menuImportCameraInputRef.current?.click()} disabled={isExtractingMenuPhoto || isPending} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black text-emerald-800 disabled:opacity-60">
                <span className="inline-flex items-center gap-2"><Camera className="size-5" />Prendre photo</span>
              </button>
              <button type="button" onClick={() => menuImportFileInputRef.current?.click()} disabled={isExtractingMenuPhoto || isPending} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base font-black text-emerald-800 disabled:opacity-60">
                <span className="inline-flex items-center gap-2"><Upload className="size-5" />Choisir photos</span>
              </button>
            </div>

            {menuImportImageName ? <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">Photo analysée : {menuImportImageName}</p> : null}
            {isExtractingMenuPhoto ? <p className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-center text-sm font-black text-emerald-800">Analyse du menu en cours...</p> : null}

            {menuImportDraftProducts.length > 0 ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-500">Produits détectés ({menuImportDraftProducts.length})</p>
                  <p className="text-xs font-semibold text-slate-500">Corrigez avant import</p>
                </div>

                {menuImportDraftProducts.map((product, index) => {
                  const expanded = expandedImportProductId === product.id;
                  const optionGroupCount = product.optionsConfig.groups.length;

                  return (
                    <article key={product.id} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <div className="grid grid-cols-[32px_1fr_92px_40px] items-center gap-2">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-emerald-800">{index + 1}</span>
                        <input value={product.name} onChange={(event) => updateMenuImportProduct(product.id, "name", event.target.value)} placeholder="Produit" className="min-h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100" />
                        <input value={product.price} inputMode="decimal" onChange={(event) => updateMenuImportProduct(product.id, "price", event.target.value)} placeholder="Prix" className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100" />
                        <button type="button" onClick={() => removeMenuImportProduct(product.id)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-red-100 bg-white text-red-600" aria-label="Retirer ce produit">
                          <X className="size-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <input value={product.categoryName} onChange={(event) => updateMenuImportProduct(product.id, "categoryName", event.target.value)} placeholder="Catégorie" className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100" />
                        <button type="button" onClick={() => setExpandedImportProductId(expanded ? null : product.id)} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
                          {expanded ? "Fermer" : "Détail"}
                        </button>
                      </div>

                      {optionGroupCount > 0 ? (
                        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                          Ce produit a peut-être des options : {optionGroupCount} groupe(s) détecté(s)
                        </p>
                      ) : null}

                      {expanded ? (
                        <div className="grid gap-2">
                          <textarea value={product.description} onChange={(event) => updateMenuImportProduct(product.id, "description", event.target.value)} rows={2} placeholder="Description optionnelle" className="min-h-20 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100" />

                          {optionGroupCount > 0 ? (
                            <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Options à valider après import</p>
                              {product.optionsConfig.groups.map((group) => (
                                <p key={group.id} className="text-sm font-bold text-slate-700">
                                  {group.name} : {group.items.map((item) => item.name).join(", ")}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <span className="grid gap-2 text-sm font-bold text-slate-500"><ImageIcon className="mx-auto size-8" />Aucun produit détecté pour le moment</span>
              </div>
            )}

            <div className="sticky bottom-0 z-10 -mx-1 grid gap-2 border-t border-slate-200 bg-white/95 px-1 pt-3 backdrop-blur">
              <button type="button" onClick={importMenuDraftProducts} disabled={isPending || isExtractingMenuPhoto || menuImportDraftProducts.length === 0} className="min-h-12 rounded-2xl bg-emerald-700 px-5 text-base font-black text-white shadow-green disabled:opacity-60">
                <span className="inline-flex items-center gap-2"><Check className="size-5" />Importer les produits validés</span>
              </button>
              <button type="button" onClick={closePanel} className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 text-base font-bold text-slate-700">Annuler</button>
            </div>
          </div>
        </Panel>
      ) : null}

      {panelMode === "menu-cleanup" ? (
        <Panel title="Nettoyer le menu" onClose={closePanel}>
          <div className="grid gap-4 safe-pb-form">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-base font-black text-emerald-900">
                {menuCleanupIssueCount > 0 ? `${menuCleanupIssueCount} correction(s) prioritaire(s)` : "Menu opérationnel"}
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-emerald-800/80">
                Les photos et doublons possibles restent des recommandations non bloquantes.
              </p>
            </div>

            {menuCleanupIssueCount === 0 &&
            productsWithoutPhoto.length === 0 &&
            duplicateProductGroups.length === 0 ? (
              <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-emerald-200 bg-white p-5 text-center">
                <span className="grid gap-2 text-sm font-bold text-emerald-800">
                  <Check className="mx-auto size-8" />
                  Aucun problème évident détecté dans le menu.
                </span>
              </div>
            ) : null}

            {duplicateProductGroups.length > 0 ? (
              <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                <div>
                  <h3 className="text-lg font-black text-slate-950">Vérifications de doublons</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Ce n&apos;est pas forcément une erreur. Vérifiez seulement les lignes réellement importées en double.
                  </p>
                </div>

                {duplicateProductGroups.slice(0, 8).map((group) => (
                  <article key={group.key} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-slate-900">{group.name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {group.products.length} produit(s) avec le même nom
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          selectProductsForCleanup(
                            group.products.map((product) => product.id),
                            "Doublons sélectionnés. Décochez le produit à garder, puis supprimez la sélection.",
                          )
                        }
                        className="min-h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"
                      >
                        Sélectionner
                      </button>
                    </div>

                    <div className="grid gap-1">
                      {group.products.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="flex min-h-10 items-center justify-between gap-3 rounded-xl bg-white px-3 text-left text-sm font-bold text-slate-700"
                        >
                          <span className="min-w-0 truncate">{product.categoryName}</span>
                          <span className="shrink-0 font-black text-slate-900">
                            {formatPriceInput(product.promoPrice ?? product.price)} €
                          </span>
                        </button>
                      ))}
                    </div>
                  </article>
                ))}

                {duplicateProductGroups.length > 8 ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                    + {duplicateProductGroups.length - 8} autre(s) groupe(s) à vérifier plus tard.
                  </p>
                ) : null}
              </section>
            ) : null}

            {emptyCategories.length > 0 ? (
              <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                <div>
                  <h3 className="text-lg font-black text-slate-950">Catégories vides</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Supprimez les catégories inutiles pour garder un menu plus lisible.
                  </p>
                </div>

                <div className="grid gap-2">
                  {emptyCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span className="min-w-0 truncate text-sm font-black text-slate-900">{category.name}</span>
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        disabled={isPending}
                        className="min-h-10 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 disabled:opacity-60"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {productsWithoutPhoto.length > 0 ? (
              <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Photos recommandées</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {productsWithoutPhoto.length} produit(s) sans photo. Ce n&apos;est pas bloquant, mais cela rend le menu client plus vendeur.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      selectProductsForCleanup(
                        productsWithoutPhoto.map((product) => product.id),
                        "Produits sans photo sélectionnés. Vous pouvez les traiter en priorité.",
                      )
                    }
                    className="min-h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"
                  >
                    Sélectionner
                  </button>
                </div>

                <div className="grid gap-2">
                  {productsWithoutPhoto.slice(0, 8).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openEditProduct(product)}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-slate-900">{product.name}</span>
                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{product.categoryName}</span>
                      </span>
                      <span className="shrink-0 text-xs font-black text-emerald-800">Modifier</span>
                    </button>
                  ))}

                  {productsWithoutPhoto.length > 8 ? (
                    <p className="text-xs font-semibold text-slate-500">
                      + {productsWithoutPhoto.length - 8} autre(s) produit(s) sans photo.
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {productsWithPriceIssue.length > 0 ? (
              <section className="grid gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div>
                  <h3 className="text-lg font-black text-red-900">Prix à vérifier</h3>
                  <p className="mt-1 text-sm font-semibold text-red-800/80">
                    Un produit sans prix fiable peut bloquer ou fausser une commande.
                  </p>
                </div>

                <div className="grid gap-2">
                  {productsWithPriceIssue.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openEditProduct(product)}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-red-100 bg-white px-3 text-left"
                    >
                      <span className="min-w-0 truncate text-sm font-black text-slate-900">{product.name}</span>
                      <span className="shrink-0 text-xs font-black text-red-700">Corriger</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="sticky bottom-0 z-10 -mx-1 grid gap-2 border-t border-slate-200 bg-white/95 px-1 pt-3 backdrop-blur">
              <button
                type="button"
                onClick={closePanel}
                className="min-h-12 rounded-2xl bg-emerald-700 px-5 text-base font-black text-white shadow-green"
              >
                Terminer
              </button>
            </div>
          </div>
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
            <form
              ref={categoryFormRef}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              onSubmit={saveCategory}
            >
              <Field
                label={categoryForm.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
                error={categoryError}
              >
                <input
                  ref={categoryNameInputRef}
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

              {categoryForm.id ? (
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-col gap-2 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-800">Produits de cette catégorie</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {categoryEditProducts.length} produit(s) dans {categoryForm.name || "cette catégorie"}
                      </p>
                    </div>

                    {categoryEditProducts.length > 0 ? (
                      <button
                        type="button"
                        onClick={allCategoryProductsSelected ? clearCategoryProductSelection : selectAllCategoryProducts}
                        disabled={isPending}
                        className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 disabled:opacity-60"
                      >
                        {allCategoryProductsSelected ? "Tout désélectionner" : "Tout sélectionner"}
                      </button>
                    ) : null}
                  </div>

                  {categoryEditProducts.length > 0 ? (
                    <div className="grid gap-2">
                      {categoryEditProducts.map((product) => {
                        const isSelected = selectedCategoryProductIds.has(product.id);
                        const isAvailable = typeof product.available === "boolean" ? product.available : true;

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => toggleCategoryProductSelection(product.id)}
                            disabled={isPending}
                            className={cn(
                              "grid min-h-12 grid-cols-[24px_1fr_auto] items-center gap-3 rounded-xl border px-3 text-left disabled:opacity-60",
                              isSelected
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-white",
                            )}
                            aria-pressed={isSelected}
                          >
                            <span
                              className={cn(
                                "grid size-5 place-items-center rounded-md border",
                                isSelected ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white",
                              )}
                            >
                              {isSelected ? <Check className="size-3.5" /> : null}
                            </span>

                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-900">{product.name}</span>
                              <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                                {isAvailable ? "Disponible" : "Indisponible"}
                              </span>
                            </span>

                            <span className="text-sm font-black text-slate-700">
                              {formatPriceInput(product.promoPrice ?? product.price)} €
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm font-bold text-slate-500">
                      Aucun produit dans cette catégorie.
                    </p>
                  )}

                  {selectedCategoryProductCount > 0 ? (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-[1fr_auto]">
                        <select
                          value={categoryMoveTargetId}
                          onChange={(event) => setCategoryMoveTargetId(event.target.value)}
                          disabled={isPending}
                          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                          aria-label="Catégorie de destination"
                        >
                          <option value="">Déplacer vers une catégorie</option>
                          {activeCategories
                            .filter((category) => category.id !== categoryForm.id)
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </select>

                        <button
                          type="button"
                          onClick={bulkMoveCategoryProductSelection}
                          disabled={isPending || !categoryMoveTargetId}
                          className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-800 disabled:opacity-60"
                        >
                          Déplacer
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={bulkArchiveCategoryProductSelection}
                        disabled={isPending}
                        className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 disabled:opacity-60"
                      >
                        Archiver {selectedCategoryProductCount} produit(s) sélectionné(s)
                      </button>
                    </div>
                  ) : null}
                </div>
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
                    setSelectedCategoryProductIds(new Set());
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
                      {category.isActive === false ? "Catégorie masquée" : "Catégorie active"} ·{" "}{productCountByCategoryId.get(category.id) ?? 0} produit(s)
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
