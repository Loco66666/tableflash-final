"use client";

import { ExternalLink, Link2, Power, QrCode } from "lucide-react";
import type { TableInfo } from "@/lib/types";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { getTableDisplayNumber } from "@/lib/tables";

export function TableQrCard({
  table,
  onCopyLink,
  onToggleActive,
  onViewQr,
  onOpenCustomerMenu,
}: {
  table: TableInfo;
  onCopyLink: (table: TableInfo) => void;
  onToggleActive: (tableId: string) => void;
  onViewQr: (table: TableInfo) => void;
  onOpenCustomerMenu: (table: TableInfo) => void;
}) {
  const actionLabel = table.isActive ? "Désactiver" : "Activer";
  const displayNumber = getTableDisplayNumber(table);

  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-emerald-50 text-2xl font-black text-emerald-800">
          {displayNumber}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black tracking-[-0.03em]">{table.name}</h2>
              <p className="truncate text-lg text-slate-600">{table.area}</p>
            </div>
          </div>
          <div className="mt-3">
            <StatusBadge label={table.isActive ? "QR actif" : "Désactivé"} tone={table.isActive ? "green" : "gray"} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
        <button
          type="button"
          onClick={() => onCopyLink(table)}
          disabled={!table.isActive}
          className="min-h-12 rounded-xl border border-slate-200 px-2 font-semibold text-emerald-800 transition active:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <span className="inline-flex items-center gap-2">
            <Link2 className="size-5" /> {table.isActive ? "Copier lien" : "QR désactivé"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onViewQr(table)}
          className="min-h-12 rounded-xl border border-slate-200 px-2 font-semibold transition active:bg-emerald-50"
        >
          <span className="inline-flex items-center gap-2">
            <QrCode className="size-5 text-emerald-800" /> Voir QR
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={() => onOpenCustomerMenu(table)}
        className="mt-3 min-h-11 w-full rounded-xl border border-emerald-200 px-3 font-semibold text-emerald-800 transition active:bg-emerald-50"
      >
        <span className="inline-flex items-center gap-2">
          <ExternalLink className="size-5" /> Ouvrir le menu client
        </span>
      </button>
      <button
        type="button"
        onClick={() => onToggleActive(table.id)}
        className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-700 transition active:bg-slate-50"
        aria-label={`${actionLabel} ${table.name}`}
      >
        <span className="inline-flex items-center gap-2">
          <Power className="size-5" /> {actionLabel}
        </span>
      </button>
    </article>
  );
}
