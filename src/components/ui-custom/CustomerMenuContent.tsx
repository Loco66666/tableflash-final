"use client";

import { Heart, Leaf, Utensils, Cake, CupSoda } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerCartBar } from "@/components/ui-custom/CustomerCartBar";
import { CustomerProductCard } from "@/components/ui-custom/CustomerProductCard";
import { CustomerTrackingPreview } from "@/components/ui-custom/CustomerTrackingPreview";
import { products } from "@/lib/data/seed";
import { useTablesStore } from "@/lib/local-store/tablesStore";
import { findTableBySlug, getTableFallbackName, normalizeTables } from "@/lib/tables";
import type { TableInfo } from "@/lib/types";

const chips = [
  { label: "Entrées", icon: Leaf },
  { label: "Plats", icon: Utensils },
  { label: "Desserts", icon: Cake },
  { label: "Boissons", icon: CupSoda },
];

export function CustomerMenuContent({ tableSlug, initialTable }: { tableSlug: string; initialTable?: TableInfo }) {
  const { value: storedTables } = useTablesStore();
  const tables = normalizeTables(storedTables);
  const table = findTableBySlug(tableSlug, tables) ?? initialTable;
  const tableName = table?.name ?? getTableFallbackName(tableSlug);
  const tableArea = table?.area ?? "";
  const subtitle = tableArea ? `${tableName} • ${tableArea}` : tableName;

  return (
    <AppShell showNav={false}>
      <PageHeader title="Le Bistrot des Halles" subtitle={subtitle} customer />
      <section className="mb-6 rounded-[1.25rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-card">
        <div className="flex min-h-14 items-center gap-4 text-lg text-slate-700">
          <Heart className="size-8 shrink-0 text-emerald-800" />
          <div className="min-w-0">
            <p className="font-bold text-slate-950">{tableName}</p>
            {tableArea ? <p className="text-base font-semibold text-slate-600">{tableArea}</p> : null}
          </div>
        </div>
      </section>
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip, index) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              type="button"
              className={(index === 1 ? "bg-emerald-700 text-white shadow-green" : "border border-slate-200 bg-white text-slate-700 shadow-card") + " flex min-h-14 shrink-0 items-center gap-2 rounded-full px-5 text-lg font-semibold"}
            >
              <Icon className="size-5" />
              {chip.label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-4">
        {products.filter((product) => product.available).map((product) => <CustomerProductCard key={product.id} product={product} />)}
      </div>
      <CustomerCartBar />
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Suivi de commande</h2>
        <CustomerTrackingPreview tableName={tableName} tableArea={tableArea} />
      </section>
    </AppShell>
  );
}
