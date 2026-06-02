import { NextResponse } from "next/server";

const MAX_TEXT_LENGTH = 500;

function cleanText(value: unknown) {
  return String(value ?? "").trim().slice(0, MAX_TEXT_LENGTH);
}

function fallbackDescription(name: string, categoryName: string, descriptionDraft: string) {
  const base = [name, descriptionDraft || categoryName].filter(Boolean).join(" - ");

  if (!base) {
    return "Produit préparé avec soin, idéal pour compléter votre commande.";
  }

  return base.length > 155 ? `${base.slice(0, 152).trim()}...` : base;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          message: "Clé OpenAI absente côté serveur.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();

    const name = cleanText(body.name);
    const categoryName = cleanText(body.categoryName);
    const descriptionDraft = cleanText(body.descriptionDraft);

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          message: "Le nom du produit est obligatoire pour générer une description.",
        },
        { status: 400 },
      );
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
        model: "gpt-5.5-mini",
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

      return NextResponse.json(
        {
          ok: false,
          message: "Génération IA impossible pour le moment.",
        },
        { status: 502 },
      );
    }

    const data = await response.json();
    const rawDescription =
      data.output_text ??
      data.output?.flatMap((item: { content?: { text?: string }[] }) => item.content ?? [])
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

    return NextResponse.json(
      {
        ok: false,
        message: "Génération IA impossible pour le moment.",
      },
      { status: 500 },
    );
  }
}
