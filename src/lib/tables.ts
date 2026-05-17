import { tables as seedTables } from "@/lib/data/seed";
import type { TableInfo } from "@/lib/types";

export const restaurantSlug = "bistrot-des-halles";

export const tableZoneOptions = ["Salle", "Terrasse", "Comptoir", "Étage", "Salon privé", "À emporter"] as const;

export type TableZone = (typeof tableZoneOptions)[number];

type LegacyTableInfo = Partial<TableInfo> & {
  number?: number;
  active?: boolean;
  customerPath?: string;
};

export function normalizeTableText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function createSlugBase(value: string) {
  const slug = normalizeTableText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "table";
}

export function createUniqueTableSlug(name: string, existingSlugs: string[]) {
  const baseSlug = createSlugBase(name);
  if (!existingSlugs.includes(baseSlug)) return baseSlug;

  let index = 2;
  while (existingSlugs.includes(`${baseSlug}-${index}`)) {
    index += 1;
  }
  return `${baseSlug}-${index}`;
}

export function createUniqueTableId(slug: string, existingIds: string[]) {
  const baseId = slug.startsWith("table-") ? slug : `table-${slug}`;
  if (!existingIds.includes(baseId)) return baseId;

  let index = 2;
  while (existingIds.includes(`${baseId}-${index}`)) {
    index += 1;
  }
  return `${baseId}-${index}`;
}

export function getTableDisplayNumber(table: Pick<TableInfo, "name" | "slug">) {
  const match = table.name.match(/\d+/) ?? table.slug.match(/\d+/);
  return match ? match[0] : "QR";
}

export function getCustomerPath(table: Pick<TableInfo, "slug">) {
  return `/r/${restaurantSlug}/table/${table.slug}`;
}

export function getTableFallbackName(tableSlug: string) {
  return `Table ${tableSlug}`;
}

export function normalizeTable(table: LegacyTableInfo): TableInfo {
  const legacySlug = table.customerPath?.split("/").filter(Boolean).at(-1);
  const name = table.name || (table.number ? `Table ${table.number}` : getTableFallbackName(table.slug || legacySlug || ""));
  const slug = table.slug || (table.number ? `table-${table.number}` : legacySlug) || createSlugBase(name);
  const id = table.id && table.id.startsWith("table-") ? table.id : slug.startsWith("table-") ? slug : `table-${slug}`;

  return {
    id,
    slug,
    name,
    area: table.area || "Salle",
    isActive: typeof table.isActive === "boolean" ? table.isActive : Boolean(table.active),
    scans: typeof table.scans === "number" ? table.scans : 0,
  };
}

export function normalizeTables(tables: LegacyTableInfo[]) {
  return tables.map(normalizeTable);
}

export function findTableBySlug(tableSlug: string, tables: TableInfo[] = seedTables) {
  return tables.find((table) => table.slug === tableSlug || table.id === tableSlug);
}
