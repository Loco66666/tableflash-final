import type { CSSProperties } from "react";
import { restaurantSettings } from "@/lib/data/seed";
import type { RestaurantSettings } from "@/lib/types";

export const appearanceStyleOptions: RestaurantSettings["appearance"]["style"][] = ["Classique", "Moderne", "Premium"];

export const primaryColorOptions = [
  { value: "Vert TableFlash", label: "Vert TableFlash", colors: { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b" } },
  { value: "Bleu", label: "Bleu", colors: { 50: "#eff6ff", 100: "#dbeafe", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" } },
  { value: "Orange", label: "Orange", colors: { 50: "#fff7ed", 100: "#ffedd5", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12" } },
  { value: "Rouge", label: "Rouge", colors: { 50: "#fff1f2", 100: "#ffe4e6", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337" } },
  { value: "Noir", label: "Noir", colors: { 50: "#f8fafc", 100: "#f1f5f9", 600: "#334155", 700: "#1e293b", 800: "#0f172a", 900: "#020617" } },
] as const;

const legacyColorAliases: Record<string, (typeof primaryColorOptions)[number]["value"]> = {
  tableflash: "Vert TableFlash",
  verttableflash: "Vert TableFlash",
  vert: "Vert TableFlash",
  emerald: "Vert TableFlash",
  blue: "Bleu",
  bleu: "Bleu",
  orange: "Orange",
  red: "Rouge",
  rouge: "Rouge",
  black: "Noir",
  noir: "Noir",
};

export type PrimaryColorValue = (typeof primaryColorOptions)[number]["value"];

export function normalizePrimaryColor(value?: string | null): PrimaryColorValue {
  const fallback = "Vert TableFlash" as const;
  if (!value) return fallback;
  const normalized = value.trim();
  if (!normalized) return fallback;
  const direct = primaryColorOptions.find((option) => option.value.toLocaleLowerCase("fr-FR") === normalized.toLocaleLowerCase("fr-FR"));
  if (direct) return direct.value;
  return legacyColorAliases[normalized.replace(/\s+/g, "").toLocaleLowerCase("fr-FR")] ?? fallback;
}

export function normalizeAppearance(appearance?: Partial<RestaurantSettings["appearance"]> | null): RestaurantSettings["appearance"] {
  const style = appearanceStyleOptions.includes((appearance?.style as RestaurantSettings["appearance"]["style"]) ?? "")
    ? (appearance!.style as RestaurantSettings["appearance"]["style"])
    : "Moderne";

  return { style, primaryColor: normalizePrimaryColor(appearance?.primaryColor) };
}

export function getAppearanceTheme(appearance?: Partial<RestaurantSettings["appearance"]> | null) {
  const normalized = normalizeAppearance(appearance);
  const color = primaryColorOptions.find((option) => option.value === normalized.primaryColor) ?? primaryColorOptions[0];
  return {
    ...normalized,
    colorLabel: color.label,
    colors: color.colors,
    radiusClass: normalized.style === "Classique" ? "rounded-xl" : normalized.style === "Premium" ? "rounded-[1.25rem]" : "rounded-2xl",
    cardClass: normalized.style === "Classique" ? "rounded-2xl border" : normalized.style === "Premium" ? "rounded-[1.5rem] border shadow-[0_10px_30px_rgba(15,23,42,0.12)]" : "rounded-[1.25rem] border",
  };
}

export function getAppearanceCssVars(appearance?: Partial<RestaurantSettings["appearance"]> | null): CSSProperties {
  const theme = getAppearanceTheme(appearance);
  return {
    ["--tf-primary" as string]: theme.colors[700],
    ["--tf-primary-dark" as string]: theme.colors[900],
    ["--tf-primary-soft" as string]: theme.colors[50],
    ["--tf-primary-ring" as string]: theme.colors[100],
    ["--tf-primary-50" as string]: theme.colors[50],
    ["--tf-primary-100" as string]: theme.colors[100],
    ["--tf-primary-600" as string]: theme.colors[600],
    ["--tf-primary-700" as string]: theme.colors[700],
    ["--tf-primary-800" as string]: theme.colors[800],
    ["--tf-primary-900" as string]: theme.colors[900],
  };
}

export const defaultAppearance = normalizeAppearance(restaurantSettings.appearance);
