"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, ExternalLink, Plus, Printer, QrCode, ReceiptText, TrendingUp, X } from "lucide-react";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { TableQrCard } from "@/components/ui-custom/TableQrCard";
import { orders as seedOrders } from "@/lib/data/seed";
import { useOrdersStore } from "@/lib/local-store/ordersStore";
import { useTablesStore } from "@/lib/local-store/tablesStore";
import type { TableInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type AddTableForm = {
  name: string;
  area: string;
  active: boolean;
};

type AddTableErrors = Partial<Record<"name" | "area", string>>;
type PrintFormat = "card" | "sheet";

type LinkPanel = {
  title: string;
  link: string;
};

const restaurantSlug = "bistrot-des-halles";
const seedQrOrderCount = seedOrders.filter((order) => order.source === "qr").length;
const initialForm: AddTableForm = { name: "", area: "Salle", active: true };

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function makeSlug(value: string) {
  const slug = normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "table";
}

function getTableNumber(value: string, tables: TableInfo[]) {
  const numericMatch = value.match(/\d+/);
  if (numericMatch) return Number(numericMatch[0]);
  return tables.reduce((highestNumber, table) => Math.max(highestNumber, table.number), 0) + 1;
}

function createClientId(name: string, existingIds: string[]) {
  const baseId = `table-${makeSlug(name)}`;
  if (!existingIds.includes(baseId)) return baseId;

  let index = 2;
  while (existingIds.includes(`${baseId}-${index}`)) {
    index += 1;
  }
  return `${baseId}-${index}`;
}

function normalizeTable(table: TableInfo): TableInfo {
  const name = table.name || `Table ${table.number}`;
  return {
    ...table,
    name,
    customerPath: table.customerPath || `/r/${restaurantSlug}/table/${makeSlug(name)}`,
  };
}

function normalizeTables(tables: TableInfo[]) {
  return tables.map(normalizeTable);
}

function getCustomerPath(table: TableInfo) {
  return table.customerPath || `/r/${restaurantSlug}/table/${makeSlug(table.name || `Table ${table.number}`)}`;
}

function getFullCustomerUrl(table: TableInfo) {
  return `${window.location.origin}${getCustomerPath(table)}`;
}

function getQrOrdersCount(orders: typeof seedOrders) {
  const hasSource = orders.some((order) => "source" in order);
  if (!hasSource) return seedQrOrderCount;
  return orders.filter((order) => order.source === "qr").length;
}

function QrVisual({ value }: { value: string }) {
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
    <div className="mx-auto grid size-52 grid-cols-9 gap-1 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-card" aria-hidden="true">
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

export function TableQrManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { value: storedTables, setValue: setTables } = useTablesStore();
  const { value: orders } = useOrdersStore();
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [form, setForm] = useState<AddTableForm>(initialForm);
  const [errors, setErrors] = useState<AddTableErrors>({});
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);
  const [manualLink, setManualLink] = useState<LinkPanel | null>(null);
  const [qrPanel, setQrPanel] = useState<LinkPanel | null>(null);
  const [printPanelOpen, setPrintPanelOpen] = useState(() => searchParams.get("action") === "print");
  const [selectedPrintIds, setSelectedPrintIds] = useState<string[]>(() => normalizeTables(storedTables).filter((table) => table.active).map((table) => table.id));
  const [printFormat, setPrintFormat] = useState<PrintFormat>("card");

  const tables = useMemo(() => normalizeTables(storedTables), [storedTables]);
  const activeTables = useMemo(() => tables.filter((table) => table.active), [tables]);
  const activePrintIds = useMemo(() => new Set(activeTables.map((table) => table.id)), [activeTables]);
  const selectedActivePrintIds = selectedPrintIds.filter((tableId) => activePrintIds.has(tableId));
  const scanCount = useMemo(() => tables.reduce((total, table) => total + table.scans, 0), [tables]);
  const qrOrdersCount = useMemo(() => getQrOrdersCount(orders), [orders]);

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
    if (!trimmedArea) nextErrors.area = "La zone est requise.";
    if (tables.some((table) => normalizeText(table.name) === normalizeText(trimmedName))) {
      nextErrors.name = "Une table porte déjà ce nom.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const tableNumber = getTableNumber(trimmedName, tables);
    const id = createClientId(trimmedName, tables.map((table) => table.id));
    const customerPath = `/r/${restaurantSlug}/table/${makeSlug(trimmedName)}`;
    const nextTable: TableInfo = {
      id,
      number: tableNumber,
      name: trimmedName,
      area: trimmedArea,
      active: form.active,
      scans: 0,
      customerPath,
    };

    setTables((currentTables) => [...normalizeTables(currentTables), nextTable]);
    resetAddPanel();
  }

  function toggleTable(tableId: string) {
    setTables((currentTables) => normalizeTables(currentTables).map((table) => (table.id === tableId ? { ...table, active: !table.active } : table)));
  }

  async function copyLink(table: TableInfo, explicitLink?: string) {
    const link = explicitLink ?? getFullCustomerUrl(table);
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(link);
        setCopiedTableId(table.id);
        window.setTimeout(() => setCopiedTableId(null), 1800);
        return;
      } catch {
        setManualLink({ title: `Lien ${table.name}`, link });
        return;
      }
    }
    setManualLink({ title: `Lien ${table.name}`, link });
  }

  function viewQr(table: TableInfo) {
    setQrPanel({ title: table.name, link: getFullCustomerUrl(table) });
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
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                autoComplete="off"
              />
            </Field>
            <Field label="Zone" error={errors.area}>
              <input
                value={form.area}
                onChange={(event) => setForm({ ...form, area: event.target.value })}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                list="table-zones"
              />
              <datalist id="table-zones">
                <option value="Salle" />
                <option value="Terrasse" />
                <option value="Comptoir" />
              </datalist>
            </Field>
            <Toggle label="QR actif" checked={form.active} onChange={(active) => setForm({ ...form, active })} />
            <button type="submit" className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green">
              Enregistrer la table
            </button>
          </form>
        </Panel>
      ) : null}

      {manualLink ? (
        <Panel title={manualLink.title} onClose={() => setManualLink(null)}>
          <p className="mb-3 text-base leading-relaxed text-slate-700">Copiez ce lien pour partager le menu client.</p>
          <div className="break-all rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-base font-semibold text-emerald-900">{manualLink.link}</div>
        </Panel>
      ) : null}

      {qrPanel ? (
        <Panel title={qrPanel.title} onClose={() => setQrPanel(null)}>
          <div className="grid gap-5 text-center">
            <QrVisual value={qrPanel.link} />
            <div className="break-all rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{qrPanel.link}</div>
            <button
              type="button"
              onClick={() => {
                const table = tables.find((currentTable) => currentTable.name === qrPanel.title);
                if (table) void copyLink(table, qrPanel.link);
              }}
              className="min-h-12 rounded-2xl border border-slate-200 px-4 text-lg font-bold text-emerald-800"
            >
              <span className="inline-flex items-center gap-2">
                <Copy className="size-5" /> Copier lien
              </span>
            </button>
            <button type="button" onClick={() => router.push(new URL(qrPanel.link).pathname)} className="min-h-12 rounded-2xl bg-emerald-700 px-4 text-lg font-black text-white shadow-green">
              <span className="inline-flex items-center gap-2">
                <ExternalLink className="size-5" /> Ouvrir le menu client
              </span>
            </button>
          </div>
        </Panel>
      ) : null}

      {printPanelOpen ? (
        <Panel title="Préparer impression" onClose={() => setPrintPanelOpen(false)}>
          <div className="grid gap-5">
            <div className="grid gap-3">
              {activeTables.length > 0 ? (
                activeTables.map((table) => {
                  const selected = selectedPrintIds.includes(table.id);
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => togglePrintTable(table.id)}
                      className={cn(
                        "flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 text-left transition",
                        selected ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-700",
                      )}
                      aria-pressed={selected}
                    >
                      <span>
                        <strong className="block text-lg">{table.name}</strong>
                        <span className="text-sm">{table.area}</span>
                      </span>
                      {selected ? <Check className="size-6 shrink-0 text-emerald-800" /> : null}
                    </button>
                  );
                })
              ) : (
                <p className="rounded-2xl bg-emerald-50 p-4 text-center text-base font-semibold text-emerald-900">Activez au moins une table pour préparer l’impression.</p>
              )}
            </div>

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

            <section className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <h3 className="text-lg font-black text-emerald-900">Aperçu impression</h3>
              {activeTables
                .filter((table) => selectedPrintIds.includes(table.id))
                .map((table) => (
                  <div key={table.id} className="rounded-2xl bg-white p-4 shadow-card">
                    <strong className="block text-xl text-slate-950">{table.name}</strong>
                    <span className="text-sm text-slate-600">{getCustomerPath(table)}</span>
                  </div>
                ))}
            </section>

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
