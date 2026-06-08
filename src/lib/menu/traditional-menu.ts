export type TraditionalMenuFamily = {
  id: string;
  name: string;
};

const FAMILY_ORDER = ["starters", "mains", "desserts", "drinks", "menus", "uncategorized"];

const FAMILY_KEYWORDS: Array<TraditionalMenuFamily & { keywords: string[] }> = [
  {
    id: "starters",
    name: "Entr\u00e9es",
    keywords: [
      "entree",
      "entrees",
      "starter",
      "starters",
      "hors d oeuvre",
      "a partager",
      "partager",
      "salade",
      "soupe",
      "charcuterie",
      "tapas",
      "aperitif",
    ],
  },
  {
    id: "mains",
    name: "Plats",
    keywords: [
      "plat",
      "plats",
      "viande",
      "poisson",
      "poulet",
      "boeuf",
      "agneau",
      "veau",
      "gambas",
      "pates",
      "pasta",
      "risotto",
      "pizza",
      "burger",
      "sandwich",
      "tacos",
      "assiette",
      "grillade",
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    keywords: ["dessert", "desserts", "glace", "sorbet", "tarte", "gateau", "creme", "mousse", "fromage blanc"],
  },
  {
    id: "drinks",
    name: "Boissons",
    keywords: [
      "boisson",
      "boissons",
      "vin",
      "vins",
      "cocktail",
      "biere",
      "eau",
      "soda",
      "jus",
      "cafe",
      "the",
      "chaud",
      "fraiche",
      "fraiches",
      "digestif",
      "aperitif",
    ],
  },
  {
    id: "menus",
    name: "Menus",
    keywords: ["menu", "menus", "formule", "formules", "enfant", "midi", "du jour"],
  },
];

export function normalizeMenuText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ");
}

export function getTraditionalMenuFamily(categoryName: string): TraditionalMenuFamily {
  const normalizedName = normalizeMenuText(categoryName);

  const family = FAMILY_KEYWORDS.find((item) =>
    item.keywords.some((keyword) => normalizedName.includes(normalizeMenuText(keyword))),
  );

  if (family) {
    return {
      id: family.id,
      name: family.name,
    };
  }

  return {
    id: "uncategorized",
    name: "A classer",
  };
}

export function getTraditionalMenuFamilyOrder(familyId: string) {
  const index = FAMILY_ORDER.indexOf(familyId);

  return index === -1 ? FAMILY_ORDER.length : index;
}

export function isTraditionalGenericCategory(categoryName?: string) {
  const normalizedName = normalizeMenuText(categoryName ?? "");

  return ["categorie", "a classer", "autre", "autres", "divers", "non classe"].includes(normalizedName);
}
