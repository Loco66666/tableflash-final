import { Link2, MoreHorizontal, Power, QrCode } from "lucide-react";
import type { TableInfo } from "@/lib/types";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

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
  const actionLabel = table.active ? "Désactiver" : "Activer";

  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-emerald-50 text-2xl font-black text-emerald-800">
          {table.number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black tracking-[-0.03em]">{table.name}</h2>
              <p className="truncate text-lg text-slate-600">{table.area}</p>
            </div>
            <MoreHorizontal className="size-6 shrink-0 text-slate-500" aria-hidden="true" />
          </div>
          <div className="mt-3">
            <StatusBadge label={table.active ? "QR actif" : "Désactivé"} tone={table.active ? "green" : "gray"} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => (table.active ? onCopyLink(table) : onToggleActive(table.id))}
          className="min-h-12 rounded-xl border border-slate-200 px-2 font-semibold text-emerald-800 transition active:bg-emerald-50"
        >
          <span className="inline-flex items-center gap-2">
            {table.active ? <Link2 className="size-5" /> : <Power className="size-5" />} {table.active ? "Copier lien" : "Activer"}
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
      {table.active ? (
        <button
          type="button"
          onClick={() => onToggleActive(table.id)}
          className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold text-slate-700 transition active:bg-slate-50"
          aria-label={`${actionLabel} ${table.name}`}
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
