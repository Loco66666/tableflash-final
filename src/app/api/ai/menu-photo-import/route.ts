import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfileResult, getCurrentUser } from "@/lib/auth/get-current-user";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_IMAGE_SIZE = 24 * 1024 * 1024;
const MAX_IMAGES = 8;
const MAX_PRODUCTS = 80;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type ExtractedMenuProduct = {
  name: string;
  categoryName: string;
  price: number;
  description?: string;
};

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    { status, headers },
  );
}

function getRateLimitKey(request: NextRequest, userId: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return `${userId}:${forwardedFor || realIp || "unknown"}`;
}

function cleanText(value: unknown, maxLength = 90) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function parsePrice(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;

  const normalizedValue = String(value ?? "")
    .replace(/[^\d,.]/g, "")
    .replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
}

function extractOutputText(data: {
  output_text?: string;
  output?: { content?: { text?: string }[] }[];
}) {
  return (
    data.output_text ??
    data.output
      ?.flatMap((item) => item.content ?? [])
      ?.map((content) => content.text ?? "")
      ?.join(" ") ??
    ""
  );
}

function getJsonText(value: string) {
  const trimmedValue = value.trim();
  const fencedMatch = trimmedValue.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const startIndex = trimmedValue.indexOf("{");
  const endIndex = trimmedValue.lastIndexOf("}");

  if (startIndex >= 0 && endIndex > startIndex) {
    return trimmedValue.slice(startIndex, endIndex + 1);
  }

  return trimmedValue;
}

function normalizeProducts(value: unknown): ExtractedMenuProduct[] {
  const data = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const products = Array.isArray(data.products) ? data.products : [];

  return products
    .map((item) => {
      const product = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const name = cleanText(product.name);
      const categoryName = cleanText(product.categoryName || product.category || "À classer");
      const price = Math.round(parsePrice(product.price) * 100) / 100;
      const description = cleanText(product.description, 160);

      return {
        name,
        categoryName,
        price,
        description,
      };
    })
    .filter((product) => product.name && product.categoryName && Number.isFinite(product.price) && product.price > 0)
    .slice(0, MAX_PRODUCTS);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Connectez-vous pour importer un menu.", 401);
    }

    const profileResult = await getCurrentProfileResult(user.id);

    if (!profileResult.ok) {
      return jsonError("Votre profil ne permet pas d'utiliser l'import IA.", 403);
    }

    if (!["restaurant_owner", "restaurant_staff", "super_admin"].includes(profileResult.profile.role)) {
      return jsonError("Vous n'avez pas accès à l'import IA.", 403);
    }

    const rateLimit = await checkRateLimit({
      key: getRateLimitKey(request, user.id),
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
      prefix: "ai-menu-photo-import",
    });

    if (!rateLimit.allowed) {
      return jsonError("Import IA limité temporairement. Réessayez dans quelques minutes.", 429, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return jsonError("Clé OpenAI absente côté serveur.", 500);
    }

    const formData = await request.formData();
    const files = [...formData.getAll("files"), formData.get("file")].filter(
      (value): value is File => value instanceof File && value.size > 0,
    );

    if (files.length === 0) {
      return jsonError("Ajoutez au moins une photo de menu.", 400);
    }

    if (files.length > MAX_IMAGES) {
      return jsonError(`Import limité à ${MAX_IMAGES} photos à la fois.`, 400);
    }

    const totalSize = files.reduce((total, file) => total + file.size, 0);

    if (totalSize > MAX_TOTAL_IMAGE_SIZE) {
      return jsonError("Photos trop lourdes. Maximum 24 Mo au total.", 400);
    }

    for (const file of files) {
      if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
        return jsonError("Format non supporté. Utilisez des photos JPG, PNG ou WebP.", 400);
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return jsonError("Une photo est trop lourde. Maximum 8 Mo par photo.", 400);
      }
    }

    const imageInputs = await Promise.all(
      files.map(async (file) => ({
        type: "input_image",
        image_url: `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`,
        detail: "high",
      })),
    );

    const prompt = [
      "Tu extrais un menu de restaurant depuis une ou plusieurs photos.",
      "Retourne uniquement un JSON valide, sans markdown.",
      "Schéma attendu :",
      '{ "products": [{ "name": "string", "categoryName": "string", "price": 12.9, "description": "string optionnel" }] }',
      "Règles strictes :",
      "- français naturel",
      "- parcours toutes les colonnes, tous les encadrés et toutes les photos",
      "- extrais chaque produit visible, sans te limiter aux premiers éléments",
      "- ne garde que les produits avec un prix lisible ou un prix de section clairement applicable",
      "- prix en euros sous forme de nombre",
      "- regroupe dans des catégories courtes et utiles",
      "- garde les noms commerciaux courts tels qu'ils apparaissent",
      "- les sections Formules, Menus, Menu enfant, Menus midi ou offres avec boisson/frites/dessert doivent devenir des produits importables",
      "- range ces offres dans une catégorie appelée Menus et formules sauf si une catégorie plus précise est écrite",
      "- mets le détail de la formule dans description quand il est lisible, par exemple boisson, frites, dessert, choix inclus",
      "- si une catégorie est absente, déduis une catégorie simple comme Entrées, Plats, Desserts, Boissons",
      "- n'invente pas de produits ni de prix",
      "- si un même produit apparaît plusieurs fois, garde une seule ligne",
      "- limite à 80 produits",
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MENU_IMPORT_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
              ...imageInputs,
            ],
          },
        ],
        max_output_tokens: 9000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("[ai/menu-photo-import] OpenAI request failed", {
        status: response.status,
        errorText,
      });

      return jsonError("Lecture IA du menu impossible pour le moment.", 502);
    }

    const data = await response.json();
    const outputText = extractOutputText(data);

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(getJsonText(outputText));
    } catch {
      console.error("[ai/menu-photo-import] invalid json output", {
        outputText,
      });

      return jsonError("L'IA n'a pas réussi à structurer ce menu. Essayez une photo plus nette.", 422);
    }

    const products = normalizeProducts(parsedJson);

    if (products.length === 0) {
      return jsonError("Aucun produit avec prix lisible détecté. Essayez une photo plus proche et plus nette.", 422);
    }

    return NextResponse.json({
      ok: true,
      products,
    });
  } catch (error) {
    console.error("[ai/menu-photo-import] unexpected error", error);

    return jsonError("Import IA impossible pour le moment.", 500);
  }
}
