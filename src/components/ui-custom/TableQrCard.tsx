"use client";

import { useState } from "react";
import { Check, Link2, MoreHorizontal, Power, QrCode } from "lucide-react";
import type { TableInfo } from "@/lib/types";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { getTableDisplayNumber } from "@/lib/tables";

export function TableQrCard({
  table,
  onCopyLink,
  onToggleActive,
  onViewQr,
}: {
  table: TableInfo;
  onCopyLink: (table: TableInfo) => void;
  onToggleActive: (tableId: string) => void;
  onViewQr: (table: TableInfo) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const actionLabel = table.isActive ? "Désactiver" : "Activer";
  const displayNumber = getTableDisplayNumber(table);

  function runMenuAction(action: () => void) {
    action();
    setMenuOpen(false);
  }

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
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="grid size-11 place-items-center rounded-full bg-slate-50 text-slate-600 transition active:bg-slate-100"
                aria-label={`Actions ${table.name}`}
                aria-expanded={menuOpen}
              >
                <MoreHorizontal className="size-6" aria-hidden="true" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-12 z-10 grid w-56 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
                  <button
                    type="button"
                    onClick={() => runMenuAction(() => onViewQr(table))}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left font-bold text-slate-800 transition active:bg-emerald-50"
                  >
                    <QrCode className="size-5 text-emerald-800" /> Voir QR
                  </button>
                  <button
                    type="button"
                    onClick={() => runMenuAction(() => onCopyLink(table))}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left font-bold text-slate-800 transition active:bg-emerald-50"
                  >
                    <Link2 className="size-5 text-emerald-800" /> Copier lien
                  </button>
                  <button
                    type="button"
                    onClick={() => runMenuAction(() => onToggleActive(table.id))}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left font-bold text-slate-800 transition active:bg-emerald-50"
                  >
                    {table.isActive ? <Power className="size-5 text-slate-600" /> : <Check className="size-5 text-emerald-800" />} {actionLabel}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3">
            <StatusBadge label={table.isActive ? "QR actif" : "Désactivé"} tone={table.isActive ? "green" : "gray"} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onCopyLink(table)}
          className="min-h-12 rounded-xl border border-slate-200 px-2 font-semibold text-emerald-800 transition active:bg-emerald-50"
        >
          <span className="inline-flex items-center gap-2">
            <Link2 className="size-5" /> Copier lien
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
