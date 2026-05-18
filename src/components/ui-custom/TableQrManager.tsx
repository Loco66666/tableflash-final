"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy, ExternalLink, Plus, Printer, QrCode, ReceiptText, TrendingUp, X } from "lucide-react";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { TableQrCard } from "@/components/ui-custom/TableQrCard";
import { orders as seedOrders } from "@/lib/data/seed";
import { useOrdersStore } from "@/lib/local-store/ordersStore";
import { useSettingsStore } from "@/lib/local-store/settingsStore";
import { useTablesStore } from "@/lib/local-store/tablesStore";
import {
  createUniqueTableId,
  createUniqueTableSlug,
  getCustomerPath,
  normalizeTableText,
  normalizeTables,
  tableZoneOptions,
} from "@/lib/tables";
import type { TableInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type AddTableForm = {
  name: string;
  area: string;
  isActive: boolean;
};

type AddTableErrors = Partial<Record<"name" | "area", string>>;
type PrintFormat = "card" | "sheet";

type LinkPanel = {
  title: string;
  link: string;
  path: string;
};

type QrPanel = {
  table: TableInfo;
  link: string;
  path: string;
};

const seedQrOrderCount = seedOrders.filter((order) => order.source === "qr").length;
const initialForm: AddTableForm = { name: "", area: "", isActive: true };

function getFullCustomerUrl(table: TableInfo, origin: string, publicSlug: string) {
  const path = getCustomerPath(table, publicSlug);
  return origin ? `${origin}${path}` : path;
}

function getQrOrdersCount(orders: typeof seedOrders) {
  const hasSource = orders.some((order) => "source" in order);
  if (!hasSource) return seedQrOrderCount;
  return orders.filter((order) => order.source === "qr").length;
}

function QrVisual({ value, compact = false }: { value: string; compact?: boolean }) {
  const cells = useMemo(() => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) % 9973;
    }

    return Array.from({ length: 81 }, (_, index) => {
      const row = Math.floor(index / 9);
      const column = index % 9;
      const inTopLeft = row < 3 && column < 3;
      const inTopRight = row < 3 && column > 5;
      const inBottomLeft = row > 5 && column < 3;
      return inTopLeft || inTopRight || inBottomLeft || ((hash + row * 7 + column * 11 + row * column) % 4 === 0);
    });
  }, [value]);

  return (
    <div
      className={cn(
        "mx-auto grid grid-cols-9 gap-1 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-card",
        compact ? "size-36" : "size-52",
      )}
      aria-hidden="true"
    >
      {cells.map((filled, index) => (
        <span key={index} className={cn("rounded-[0.22rem]", filled ? "bg-emerald-900" : "bg-emerald-50")} />
      ))}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-base font-bold text-slate-800">
      {label}
      {children}
      {error ? <span className="text-sm font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 text-left"
      aria-pressed={checked}
    >
      <span className="text-base font-bold text-slate-800">{label}</span>
      <span className={cn("flex h-8 w-14 items-center rounded-full p-1 transition", checked ? "bg-emerald-700" : "bg-slate-300")}>
        <span className={cn("size-6 rounded-full bg-white transition", checked && "translate-x-6")} />
      </span>
    </button>
  );
}

function Panel({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="qr-panel-title">
      <section className="max-h-[88dvh] w-full overflow-y-auto rounded-[1.7rem] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:max-w-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="qr-panel-title" className="text-2xl font-black tracking-[-0.03em] text-slate-950">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function CustomerMenuLink({ path, link, className }: { path: string; link: string; className?: string }) {
  return (
    <div className={cn("grid gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4", className)}>
      <Link href={path} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-base font-black text-emerald-800 shadow-sm transition active:bg-emerald-100">
        <ExternalLink className="size-5" /> Ouvrir le menu client
      </Link>
      <Link href={path} className="break-all text-center text-sm font-semibold text-emerald-900 underline decoration-emerald-300 underline-offset-4">
        {link}
      </Link>
    </div>
  );
}

export function TableQrManager() {
  const searchParams = useSearchParams();
  const { value: storedTables, setValue: setTables } = useTablesStore();
  const { value: orders } = useOrdersStore();
  const { value: settings } = useSettingsStore();
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [form, setForm] = useState<AddTableForm>(initialForm);
  const [errors, setErrors] = useState<AddTableErrors>({});
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);
  const [manualLink, setManualLink] = useState<LinkPanel | null>(null);
  const [qrPanel, setQrPanel] = useState<QrPanel | null>(null);
  const [printPanelOpen, setPrintPanelOpen] = useState(false);
  const [selectedPrintIds, setSelectedPrintIds] = useState<string[]>(() => normalizeTables(storedTables).filter((table) => table.isActive).map((table) => table.id));
  const [printFormat, setPrintFormat] = useState<PrintFormat>("card");
  const [origin, setOrigin] = useState("");

  const publicSlug = settings.publicSlug?.trim() || "bistrot-des-halles";
  const tables = useMemo(() => normalizeTables(storedTables), [storedTables]);
  const activeTables = useMemo(() => tables.filter((table) => table.isActive), [tables]);
  const activePrintIds = useMemo(() => new Set(activeTables.map((table) => table.id)), [activeTables]);
  const selectedActivePrintIds = selectedPrintIds.filter((tableId) => activePrintIds.has(tableId));
  const scanCount = useMemo(() => tables.reduce((total, table) => total + table.scans, 0), [tables]);
  const qrOrdersCount = useMemo(() => getQrOrdersCount(orders), [orders]);
  const selectedPrintTables = activeTables.filter((table) => selectedPrintIds.includes(table.id));

  useEffect(() => {
    const originTimer = window.setTimeout(() => setOrigin(window.location.origin), 0);

    return () => window.clearTimeout(originTimer);
  }, []);

  useEffect(() => {
    if (searchParams.get("action") !== "print") return;

    const panelTimer = window.setTimeout(() => {
      setSelectedPrintIds(activeTables.map((table) => table.id));
      setPrintPanelOpen(true);
    }, 0);

    return () => window.clearTimeout(panelTimer);
  }, [activeTables, searchParams]);

  function resetAddPanel() {
    setForm(initialForm);
    setErrors({});
    setAddPanelOpen(false);
  }

  function submitTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedArea = form.area.trim();
    const nextErrors: AddTableErrors = {};

    if (!trimmedName) nextErrors.name = "Le nom de la table est requis.";
    if (!trimmedArea) nextErrors.area = "Choisissez une zone";
    if (tables.some((table) => normalizeTableText(table.name) === normalizeTableText(trimmedName))) {
      nextErrors.name = "Une table porte déjà ce nom.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const slug = createUniqueTableSlug(trimmedName, tables.map((table) => table.slug));
    const id = createUniqueTableId(slug, tables.map((table) => table.id));
    const nextTable: TableInfo = {
      id,
      slug,
      name: trimmedName,
      area: trimmedArea,
      isActive: form.isActive,
      scans: 0,
    };

    setTables((currentTables) => [...normalizeTables(currentTables), nextTable]);
    resetAddPanel();
  }

  function toggleTable(tableId: string) {
    setTables((currentTables) => normalizeTables(currentTables).map((table) => (table.id === tableId ? { ...table, isActive: !table.isActive } : table)));
  }

  async function copyLink(table: TableInfo, explicitLink?: string) {
    const link = explicitLink ?? getFullCustomerUrl(table, origin || window.location.origin, publicSlug);
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(link);
        setCopiedTableId(table.id);
        window.setTimeout(() => setCopiedTableId(null), 1800);
        return;
      } catch {
        setManualLink({ title: `Lien ${table.name}`, link, path: getCustomerPath(table, publicSlug) });
        return;
      }
    }
    setManualLink({ title: `Lien ${table.name}`, link, path: getCustomerPath(table, publicSlug) });
  }

  function viewQr(table: TableInfo) {
    setQrPanel({ table, link: getFullCustomerUrl(table, origin || window.location.origin, publicSlug), path: getCustomerPath(table, publicSlug) });
  }

  function openPrintPanel() {
    setSelectedPrintIds(activeTables.map((table) => table.id));
    setPrintPanelOpen(true);
  }

  function togglePrintTable(tableId: string) {
    setSelectedPrintIds((currentIds) => (currentIds.includes(tableId) ? currentIds.filter((id) => id !== tableId) : [...currentIds, tableId]));
  }

  function printSelection() {
    window.print();
  }

  return (
    <>
      <h1 className="mb-5 text-4xl font-black tracking-[-0.05em]">QR par table</h1>
      <SectionCard className="mb-5 grid grid-cols-3 gap-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-center">
        <div>
          <QrCode className="mx-auto mb-2 size-8 text-emerald-800" />
          <strong className="text-3xl font-black text-emerald-800">{activeTables.length}</strong>
          <p className="text-sm text-slate-600 min-[390px]:text-base">QR actifs</p>
        </div>
        <div>
          <TrendingUp className="mx-auto mb-2 size-8 rounded-full bg-emerald-100 p-1 text-emerald-800" />
          <strong className="text-3xl font-black text-emerald-800">{scanCount}</strong>
          <p className="text-sm text-slate-600 min-[390px]:text-base">scans</p>
        </div>
        <div>
          <ReceiptText className="mx-auto mb-2 size-8 rounded-full bg-emerald-100 p-1 text-emerald-800" />
          <strong className="text-3xl font-black text-emerald-800">{qrOrdersCount}</strong>
          <p className="text-sm text-slate-600 min-[390px]:text-base">commandes QR</p>
        </div>
      </SectionCard>

      <button
        type="button"
        onClick={() => setAddPanelOpen(true)}
        className="mb-6 min-h-16 rounded-[1.1rem] bg-gradient-to-br from-emerald-600 to-emerald-900 px-4 text-xl font-black text-white shadow-green"
      >
        <span className="inline-flex items-center gap-3">
          <Plus className="size-8 rounded-full bg-white p-1 text-emerald-800" /> Ajouter une table
        </span>
      </button>

      {tables.length > 0 ? (
        <div className="grid gap-4">
          {tables.map((table) => (
            <div key={table.id} className="grid gap-2">
              <TableQrCard table={table} onCopyLink={copyLink} onToggleActive={toggleTable} onViewQr={viewQr} />
              {copiedTableId === table.id ? (
                <p className="rounded-full bg-emerald-50 px-4 py-2 text-center text-sm font-bold text-emerald-800" role="status">
                  Lien copié
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <section className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-card">
          <h2 className="text-2xl font-black tracking-[-0.03em] text-emerald-900">Aucune table créée</h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">Ajoutez une table pour générer son QR.</p>
        </section>
      )}

      <button
        type="button"
        onClick={openPrintPanel}
        className="mt-6 min-h-16 rounded-[1.1rem] border border-emerald-800 px-4 text-xl font-black text-emerald-800"
      >
        <span className="inline-flex items-center gap-3">
          <Printer className="size-7" /> Préparer impression
        </span>
      </button>

      {addPanelOpen ? (
        <Panel title="Ajouter une table" onClose={resetAddPanel}>
          <form className="grid gap-4" onSubmit={submitTable}>
            <Field label="Nom de la table" error={errors.name}>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Table 8"
                className="min-h-14 rounded-2xl border border-slate-200 px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </Field>
            <Field label="Zone" error={errors.area}>
              <select
                value={form.area}
                onChange={(event) => setForm({ ...form, area: event.target.value })}
                className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-lg font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                aria-invalid={Boolean(errors.area)}
              >
                <option value="">Choisir une zone</option>
                {tableZoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </Field>
            <Toggle label="QR actif" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
            <button type="submit" className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green">
              Enregistrer la table
            </button>
          </form>
        </Panel>
      ) : null}

      {manualLink ? (
        <Panel title={manualLink.title} onClose={() => setManualLink(null)}>
          <div className="grid gap-4">
            <p className="text-base leading-relaxed text-slate-700">Copiez ce lien ou ouvrez directement le menu client.</p>
            <CustomerMenuLink path={manualLink.path} link={manualLink.link} />
          </div>
        </Panel>
      ) : null}

      {qrPanel ? (
        <Panel title={qrPanel.table.name} onClose={() => setQrPanel(null)}>
          <div className="grid gap-5 text-center">
            <div className="mx-auto">
              <span className={cn("inline-flex min-h-9 items-center rounded-full px-4 text-sm font-black", qrPanel.table.isActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>
                {qrPanel.table.isActive ? "QR actif" : "Désactivé"}
              </span>
            </div>
            <p className="text-lg font-semibold text-slate-600">{qrPanel.table.area}</p>
            <CustomerMenuLink path={qrPanel.path} link={qrPanel.link} />
            <QrVisual value={qrPanel.link} />
            <button
              type="button"
              onClick={() => void copyLink(qrPanel.table, qrPanel.link)}
              className="min-h-12 rounded-2xl border border-slate-200 px-4 text-lg font-bold text-emerald-800"
            >
              <span className="inline-flex items-center gap-2">
                <Copy className="size-5" /> Copier lien
              </span>
            </button>
            <Link href={qrPanel.path} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-lg font-black text-white shadow-green">
              <ExternalLink className="size-5" /> Ouvrir le menu client
            </Link>
          </div>
        </Panel>
      ) : null}

      {printPanelOpen ? (
        <Panel title="Préparer impression" onClose={() => setPrintPanelOpen(false)}>
          <div className="grid gap-5">
            <p className="text-base leading-relaxed text-slate-700">Sélectionnez les tables actives, vérifiez les liens clients, puis lancez l’impression.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrintFormat("card")}
                className={cn("min-h-12 rounded-2xl border px-3 font-bold", printFormat === "card" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 text-slate-700")}
                aria-pressed={printFormat === "card"}
              >
                Fiche table
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("sheet")}
                className={cn("min-h-12 rounded-2xl border px-3 font-bold", printFormat === "sheet" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 text-slate-700")}
                aria-pressed={printFormat === "sheet"}
              >
                Planche QR
              </button>
            </div>

            <section className="grid gap-3" aria-label="Tables actives à imprimer">
              {activeTables.length > 0 ? (
                activeTables.map((table) => {
                  const selected = selectedPrintIds.includes(table.id);
                  const path = getCustomerPath(table, publicSlug);
                  const link = getFullCustomerUrl(table, origin, publicSlug);
                  return (
                    <article
                      key={table.id}
                      className={cn(
                        "grid gap-4 rounded-[1.35rem] border bg-white p-4 shadow-card transition",
                        selected ? "border-emerald-700 ring-4 ring-emerald-50" : "border-slate-200",
                      )}
                    >
                      <button type="button" onClick={() => togglePrintTable(table.id)} className="flex min-h-14 items-center justify-between gap-3 text-left" aria-pressed={selected}>
                        <span>
                          <strong className="block text-xl text-slate-950">{table.name}</strong>
                          <span className="text-sm font-semibold text-slate-600">{table.area}</span>
                        </span>
                        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border", selected ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-transparent")}>
                          <Check className="size-5" />
                        </span>
                      </button>
                      {selected ? (
                        <div className={cn("grid gap-4", printFormat === "sheet" ? "sm:grid-cols-[9rem_1fr] sm:items-center" : "")}>
                          <QrVisual value={link} compact />
                          <CustomerMenuLink path={path} link={link} />
                        </div>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <p className="rounded-2xl bg-emerald-50 p-4 text-center text-base font-semibold text-emerald-900">Activez au moins une table pour préparer l’impression.</p>
              )}
            </section>

            {selectedPrintTables.length > 0 ? (
              <p className="rounded-2xl bg-emerald-50 p-4 text-center text-base font-black text-emerald-900">
                {selectedPrintTables.length} table{selectedPrintTables.length > 1 ? "s" : ""} sélectionnée{selectedPrintTables.length > 1 ? "s" : ""}
              </p>
            ) : null}

            <button
              type="button"
              onClick={printSelection}
              disabled={selectedActivePrintIds.length === 0}
              className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green disabled:bg-slate-300 disabled:shadow-none"
            >
              Imprimer la sélection
            </button>
          </div>
        </Panel>
      ) : null}
    </>
  );
}
