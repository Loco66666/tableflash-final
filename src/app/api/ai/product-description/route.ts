import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfileResult, getCurrentUser } from "@/lib/auth/get-current-user";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_TEXT_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    { status, headers },
  );
}

function cleanText(value: unknown) {
  return String(value ?? "").trim().slice(0, MAX_TEXT_LENGTH);
}

function getRateLimitKey(request: NextRequest, userId: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return `${userId}:${forwardedFor || realIp || "unknown"}`;
}

function fallbackDescription(name: string, categoryName: string, descriptionDraft: string) {
  const base = [name, descriptionDraft || categoryName].filter(Boolean).join(" - ");

  if (!base) {
    return "Produit préparé avec soin, idéal pour compléter votre commande.";
  }

  return base.length > 155 ? `${base.slice(0, 152).trim()}...` : base;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Connectez-vous pour utiliser la génération IA.", 401);
    }

    const profileResult = await getCurrentProfileResult(user.id);

    if (!profileResult.ok) {
      return jsonError("Votre profil ne permet pas d'utiliser la génération IA.", 403);
    }

    if (!["restaurant_owner", "restaurant_staff", "super_admin"].includes(profileResult.profile.role)) {
      return jsonError("Vous n'avez pas accès à la génération IA.", 403);
    }

    const rateLimit = await checkRateLimit({
      key: getRateLimitKey(request, user.id),
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
      prefix: "ai-product-description",
    });

    if (!rateLimit.allowed) {
      return jsonError(
        "Génération IA limitée temporairement. Réessayez dans quelques minutes.",
        429,
        {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return jsonError("Clé OpenAI absente côté serveur.", 500);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError("Requête IA invalide.", 400);
    }

    const bodyData = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const name = cleanText(bodyData.name);
    const categoryName = cleanText(bodyData.categoryName);
    const descriptionDraft = cleanText(bodyData.descriptionDraft);

    if (!name) {
      return jsonError("Le nom du produit est obligatoire pour générer une description.", 400);
    }

    const prompt = [
      "Tu rédiges une courte description de produit pour un menu de restaurant.",
      "Réponds uniquement avec la description finale.",
      "Contraintes strictes :",
      "- français naturel",
      "- une seule phrase",
      "- 80 à 160 caractères maximum",
      "- pas d'emoji",
      "- pas de guillemets",
      "- pas de promesse excessive",
      "- ne pas inventer d'ingrédients précis non fournis",
      "- utiliser les infos données si elles existent",
      "",
      `Nom du produit : ${name}`,
      `Catégorie : ${categoryName || "non précisée"}`,
      `Infos / ingrédients déjà tapés : ${descriptionDraft || "aucune info"}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: prompt,
        max_output_tokens: 90,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("[ai/product-description] OpenAI request failed", {
        status: response.status,
        errorText,
      });

      return jsonError("Génération IA impossible pour le moment.", 502);
    }

    const data = await response.json();
    const rawDescription =
      data.output_text ??
      data.output
        ?.flatMap((item: { content?: { text?: string }[] }) => item.content ?? [])
        ?.map((content: { text?: string }) => content.text ?? "")
        ?.join(" ") ??
      "";

    const description = cleanText(rawDescription).replace(/^["“”']|["“”']$/g, "");

    return NextResponse.json({
      ok: true,
      description: description || fallbackDescription(name, categoryName, descriptionDraft),
    });
  } catch (error) {
    console.error("[ai/product-description] unexpected error", error);

    return jsonError("Génération IA impossible pour le moment.", 500);
  }
}
