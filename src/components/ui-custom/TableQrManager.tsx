"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import QRCode from "react-qr-code";
import {
  createRestaurantTable,
  deleteRestaurantTable,
  toggleRestaurantTable,
  updateRestaurantTable,
} from "@/app/dashboard/qr/actions";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { TableQrCard } from "@/components/ui-custom/TableQrCard";
import type { TableInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type TableForm = {
  name: string;
  area: string;
  isActive: boolean;
};

type TableFormErrors = Partial<Record<"name" | "area", string>>;

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

type PrintFormat = "card" | "sheet";

const initialForm: TableForm = {
  name: "",
  area: "",
  isActive: true,
};

const tableZoneOptions = ["Salle", "Terrasse", "Comptoir", "Étage", "Salon privé", "À emporter"] as const;

const defaultQrTexts = {
  main: "Scannez le QR code ci-dessous pour consulter le menu et passer commande.",
  payment: "Paiement uniquement sur place ou auprès de votre serveur(se).",
  help: "Besoin d’aide ? Notre équipe reste à votre disposition.",
  footer: "Propulsé par TableFlash",
};

function normalizeTableText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatRestaurantNameFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("fr-FR") + part.slice(1))
    .join(" ");
}

function getCustomerPath(table: Pick<TableInfo, "slug">, restaurantSlug: string) {
  return `/r/${restaurantSlug}/table/${table.slug}`;
}

function getFullCustomerUrl(table: TableInfo, origin: string, restaurantSlug: string) {
  const path = getCustomerPath(table, restaurantSlug);

  return origin ? `${origin}${path}` : path;
}

function RealQrCode({ value, size = 220 }: { value: string; size?: number }) {
  return (
    <div className="mx-auto rounded-3xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-emerald-100">
      <div className="rounded-xl bg-white p-3">
        <QRCode
          value={value}
          size={size}
          level="H"
          bgColor="#ffffff"
          fgColor="#064e3b"
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}

function PrintableQrCard({
  restaurantName,
  table,
  link,
  compact = false,
}: {
  restaurantName: string;
  table: TableInfo;
  link: string;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "tf-print-card mx-auto grid bg-white text-slate-950",
        compact
          ? "gap-3 rounded-3xl border border-emerald-100 p-5 shadow-card"
          : "min-h-[148mm] w-full max-w-[105mm] content-between gap-5 rounded-4xl border border-emerald-100 p-7 shadow-[0_20px_70px_rgba(15,23,42,0.12)]",
      )}
    >
      <header className="grid gap-2 text-center">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Bienvenue chez</p>
        <h3 className={cn("font-black tracking-tight text-slate-950", compact ? "text-2xl" : "text-3xl")}>
          {restaurantName}
        </h3>

        <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
          {table.area}
        </p>

        <div className="mx-auto inline-flex min-h-11 items-center rounded-full bg-emerald-900 px-6 text-lg font-black text-white">
          {table.name}
        </div>
      </header>

      <section className="grid gap-4 text-center">
        <p className={cn("mx-auto max-w-[18rem] font-bold leading-relaxed text-slate-700", compact ? "text-base" : "text-lg")}>
          {defaultQrTexts.main}
        </p>

        <RealQrCode value={link} size={compact ? 150 : 230} />

        <p className="mx-auto max-w-[18rem] rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black leading-relaxed text-emerald-900">
          {defaultQrTexts.payment}
        </p>
      </section>

      <footer className="grid gap-2 text-center">
        <p className="text-sm font-semibold leading-relaxed text-slate-500">{defaultQrTexts.help}</p>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">{defaultQrTexts.footer}</p>
      </footer>
    </article>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
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

function Panel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/40 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-panel-title"
    >
      <section className="max-h-[88dvh] w-full overflow-y-auto rounded-[1.7rem] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:max-w-xl">
        <div className="tf-no-print mb-5 flex items-start justify-between gap-4">
          <h2 id="qr-panel-title" className="text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700"
            aria-label="Fermer"
          >
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
      <Link
        href={path}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-base font-black text-emerald-800 shadow-sm transition active:bg-emerald-100"
      >
        <ExternalLink className="size-5" /> Ouvrir le menu client
      </Link>

      <Link href={path} className="break-all text-center text-sm font-semibold text-emerald-900 underline decoration-emerald-300 underline-offset-4">
        {link}
      </Link>
    </div>
  );
}

export function TableQrManager({
  restaurantName,
  restaurantSlug,
  initialTables,
  qrOrdersCount,
}: {
  restaurantName?: string;
  restaurantSlug: string;
  initialTables: TableInfo[];
  qrOrdersCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [editTable, setEditTable] = useState<TableInfo | null>(null);
  const [form, setForm] = useState<TableForm>(initialForm);
  const [editForm, setEditForm] = useState<TableForm>(initialForm);
  const [errors, setErrors] = useState<TableFormErrors>({});
  const [editErrors, setEditErrors] = useState<TableFormErrors>({});
  const [actionError, setActionError] = useState("");
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);
  const [manualLink, setManualLink] = useState<LinkPanel | null>(null);
  const [qrPanel, setQrPanel] = useState<QrPanel | null>(null);
  const [printPanelOpen, setPrintPanelOpen] = useState(false);
  const [selectedPrintIds, setSelectedPrintIds] = useState<string[]>(() => initialTables.filter((table) => table.isActive).map((table) => table.id));
  const [printFormat, setPrintFormat] = useState<PrintFormat>("card");
  const [origin, setOrigin] = useState("");

  const tables = initialTables;
  const restaurantDisplayName = restaurantName?.trim() || formatRestaurantNameFromSlug(restaurantSlug);
  const activeTables = useMemo(() => tables.filter((table) => table.isActive), [tables]);
  const activePrintIds = useMemo(() => new Set(activeTables.map((table) => table.id)), [activeTables]);
  const selectedActivePrintIds = selectedPrintIds.filter((tableId) => activePrintIds.has(tableId));
  const scanCount = useMemo(() => tables.reduce((total, table) => total + table.scans, 0), [tables]);
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

  function validateForm(input: TableForm, ignoredTableId?: string) {
    const trimmedName = input.name.trim();
    const trimmedArea = input.area.trim();
    const nextErrors: TableFormErrors = {};

    if (!trimmedName) nextErrors.name = "Le nom de la table est requis.";
    if (!trimmedArea) nextErrors.area = "Choisissez une zone.";

    if (
      tables.some(
        (table) =>
          table.id !== ignoredTableId && normalizeTableText(table.name) === normalizeTableText(trimmedName),
      )
    ) {
      nextErrors.name = "Une table porte déjà ce nom.";
    }

    return nextErrors;
  }

  function resetAddPanel() {
    setForm(initialForm);
    setErrors({});
    setActionError("");
    setAddPanelOpen(false);
  }

  function openEditPanel(table: TableInfo) {
    setEditTable(table);
    setEditForm({
      name: table.name,
      area: table.area,
      isActive: table.isActive,
    });
    setEditErrors({});
    setActionError("");
  }

  function resetEditPanel() {
    setEditTable(null);
    setEditForm(initialForm);
    setEditErrors({});
    setActionError("");
  }

  function submitTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const trimmedName = form.name.trim();
    const trimmedArea = form.area.trim();

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");

          await createRestaurantTable({
            name: trimmedName,
            zone: trimmedArea,
            isActive: form.isActive,
          });

          resetAddPanel();
          router.refresh();
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Création impossible.");
        }
      })();
    });
  }

  function submitEditTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editTable) return;

    const nextErrors = validateForm(editForm, editTable.id);
    setEditErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const trimmedName = editForm.name.trim();
    const trimmedArea = editForm.area.trim();

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");

          await updateRestaurantTable({
            tableId: editTable.id,
            name: trimmedName,
            zone: trimmedArea,
            isActive: editForm.isActive,
          });

          resetEditPanel();
          router.refresh();
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Modification impossible.");
        }
      })();
    });
  }

  function deleteTable(table: TableInfo) {
    const confirmed = window.confirm(
      `Supprimer ${table.name} ?\n\nSi cette table a déjà des commandes, elle ne pourra pas être supprimée. Vous pourrez simplement la désactiver.`,
    );

    if (!confirmed) return;

    startTransition(() => {
      void (async () => {
        try {
          setActionError("");

          await deleteRestaurantTable({
            tableId: table.id,
          });

          resetEditPanel();
          router.refresh();
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Suppression impossible.");
        }
      })();
    });
  }

  function toggleTable(table: TableInfo) {
    startTransition(() => {
      void (async () => {
        try {
          setActionError("");

          await toggleRestaurantTable({
            tableId: table.id,
            isActive: !table.isActive,
          });

          router.refresh();
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Mise à jour impossible.");
        }
      })();
    });
  }

  async function copyLink(table: TableInfo, explicitLink?: string) {
    const link = explicitLink ?? getFullCustomerUrl(table, origin || window.location.origin, restaurantSlug);

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(link);
        setCopiedTableId(table.id);
        window.setTimeout(() => setCopiedTableId(null), 1800);
        return;
      } catch {
        setManualLink({
          title: `Lien ${table.name}`,
          link,
          path: getCustomerPath(table, restaurantSlug),
        });
        return;
      }
    }

    setManualLink({
      title: `Lien ${table.name}`,
      link,
      path: getCustomerPath(table, restaurantSlug),
    });
  }

  function viewQr(table: TableInfo) {
    setQrPanel({
      table,
      link: getFullCustomerUrl(table, origin || window.location.origin, restaurantSlug),
      path: getCustomerPath(table, restaurantSlug),
    });
  }

  function openCustomerMenu(table: TableInfo) {
    if (!table.isActive) return;

    const path = getCustomerPath(table, restaurantSlug);
    window.open(path, "_blank", "noopener,noreferrer");
  }

  function openPrintPanel() {
    setSelectedPrintIds(activeTables.map((table) => table.id));
    setPrintPanelOpen(true);
  }

  function togglePrintTable(tableId: string) {
    setSelectedPrintIds((currentIds) =>
      currentIds.includes(tableId) ? currentIds.filter((id) => id !== tableId) : [...currentIds, tableId],
    );
  }

  function printSelection() {
    window.print();
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A6 portrait;
            margin: 0;
          }

          body * {
            visibility: hidden;
          }

          .tf-qr-print-area,
          .tf-qr-print-area * {
            visibility: visible;
          }

          .tf-qr-print-area {
            position: absolute;
            inset: 0;
            width: 100%;
            background: white;
          }

          .tf-print-card {
            break-after: page;
            page-break-after: always;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: 0 !important;
            max-width: none !important;
            width: 105mm !important;
            min-height: 148mm !important;
          }

          .tf-print-card:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .tf-no-print {
            display: none !important;
          }
        }
      `}</style>

      {actionError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {actionError}
        </div>
      ) : null}

      <h1 className="mb-5 text-4xl font-black tracking-tight">QR par table</h1>

      <SectionCard className="mb-5 grid grid-cols-3 gap-2 border-emerald-100 bg-linear-to-br from-emerald-50 to-white text-center">
        <div>
          <QrCode className="mx-auto mb-2 size-8 text-emerald-800" />
          <strong className="text-3xl font-black text-emerald-800">{activeTables.length}</strong>
          <p className="text-sm text-slate-600 min-[390px]:text-base">QR actifs</p>
        </div>

        <div>
          <TrendingUp className="mx-auto mb-2 size-8 rounded-full bg-emerald-100 p-1 text-emerald-800" />
          <strong className="text-3xl font-black text-emerald-800">{scanCount}</strong>
          <p className="text-sm text-slate-600 min-[390px]:text-base">Scans</p>
        </div>

        <div>
          <ReceiptText className="mx-auto mb-2 size-8 rounded-full bg-emerald-100 p-1 text-emerald-800" />
          <strong className="text-3xl font-black text-emerald-800">{qrOrdersCount}</strong>
          <p className="text-sm text-slate-600 min-[390px]:text-base">Commandes</p>
        </div>
      </SectionCard>

      <button
        type="button"
        onClick={() => setAddPanelOpen(true)}
        disabled={isPending}
        className="mb-6 min-h-16 w-full rounded-[1.1rem] bg-linear-to-br from-emerald-600 to-emerald-900 px-4 text-xl font-black text-white shadow-green disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-3">
          <Plus className="size-8 rounded-full bg-white p-1 text-emerald-800" /> Ajouter une table
        </span>
      </button>

      {tables.length > 0 ? (
        <div className="grid gap-4">
          {tables.map((table) => (
            <div key={table.id} className="grid gap-2">
              <TableQrCard
                table={table}
                onCopyLink={copyLink}
                onToggleActive={toggleTable}
                onViewQr={viewQr}
                onOpenCustomerMenu={openCustomerMenu}
                onEdit={openEditPanel}
              />

              {copiedTableId === table.id ? (
                <p className="rounded-full bg-emerald-50 px-4 py-2 text-center text-sm font-bold text-emerald-800" role="status">
                  Lien copié
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-card">
          <h2 className="text-2xl font-black tracking-tight text-emerald-900">Aucune table créée</h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-700">Ajoutez une table pour générer son QR.</p>
        </section>
      )}

      <button
        type="button"
        onClick={openPrintPanel}
        disabled={isPending}
        className="mt-6 min-h-16 w-full rounded-[1.1rem] border border-emerald-800 px-4 text-xl font-black text-emerald-800 disabled:opacity-60"
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

            <button
              type="submit"
              disabled={isPending}
              className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green disabled:opacity-60"
            >
              Enregistrer la table
            </button>
          </form>
        </Panel>
      ) : null}

      {editTable ? (
        <Panel title={`Modifier ${editTable.name}`} onClose={resetEditPanel}>
          <form className="grid gap-4" onSubmit={submitEditTable}>
            <Field label="Nom de la table" error={editErrors.name}>
              <input
                value={editForm.name}
                onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                placeholder="Table 8"
                className="min-h-14 rounded-2xl border border-slate-200 px-4 text-lg font-semibold outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </Field>

            <Field label="Zone" error={editErrors.area}>
              <select
                value={editForm.area}
                onChange={(event) => setEditForm({ ...editForm, area: event.target.value })}
                className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-lg font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                aria-invalid={Boolean(editErrors.area)}
              >
                <option value="">Choisir une zone</option>
                {tableZoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </Field>

            <Toggle
              label="QR actif"
              checked={editForm.isActive}
              onChange={(isActive) => setEditForm({ ...editForm, isActive })}
            />

            <button
              type="submit"
              disabled={isPending}
              className="min-h-14 rounded-2xl bg-emerald-700 px-5 text-lg font-black text-white shadow-green disabled:opacity-60"
            >
              Enregistrer les modifications
            </button>

            <button
              type="button"
              onClick={() => deleteTable(editTable)}
              disabled={isPending}
              className="min-h-14 rounded-2xl border border-red-200 bg-red-50 px-5 text-lg font-black text-red-700 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="size-5" /> Supprimer la table
              </span>
            </button>

            <p className="text-sm font-semibold leading-relaxed text-slate-500">
              Si la table a déjà reçu des commandes, elle ne sera pas supprimée. Désactivez-la pour retirer son QR du service.
            </p>
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
              <span
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full px-4 text-sm font-black",
                  qrPanel.table.isActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600",
                )}
              >
                {qrPanel.table.isActive ? "QR actif" : "Désactivé"}
              </span>
            </div>

            <p className="text-lg font-semibold text-slate-600">{qrPanel.table.area}</p>

            <RealQrCode value={qrPanel.link} />

            {qrPanel.table.isActive ? <CustomerMenuLink path={qrPanel.path} link={qrPanel.link} /> : null}

            <button
              type="button"
              onClick={() => void copyLink(qrPanel.table, qrPanel.link)}
              disabled={!qrPanel.table.isActive}
              className="min-h-12 rounded-2xl border border-slate-200 px-4 text-lg font-bold text-emerald-800 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <span className="inline-flex items-center gap-2">
                <Copy className="size-5" /> Copier lien
              </span>
            </button>

            <Link
              href={qrPanel.path}
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-lg font-black shadow-green",
                qrPanel.table.isActive
                  ? "bg-emerald-700 text-white"
                  : "pointer-events-none bg-slate-200 text-slate-500 shadow-none",
              )}
            >
              <ExternalLink className="size-5" /> Ouvrir le menu client
            </Link>
          </div>
        </Panel>
      ) : null}

      {printPanelOpen ? (
        <Panel title="Préparer impression" onClose={() => setPrintPanelOpen(false)}>
          <div className="grid gap-5">
            <div className="tf-no-print grid gap-5">
              <p className="text-base leading-relaxed text-slate-700">
                Sélectionnez les tables actives, vérifiez les liens clients, puis lancez l’impression.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrintFormat("card")}
                  className={cn(
                    "min-h-12 rounded-2xl border px-3 font-bold",
                    printFormat === "card" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 text-slate-700",
                  )}
                  aria-pressed={printFormat === "card"}
                >
                  Fiche A6
                </button>

                <button
                  type="button"
                  onClick={() => setPrintFormat("sheet")}
                  className={cn(
                    "min-h-12 rounded-2xl border px-3 font-bold",
                    printFormat === "sheet" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 text-slate-700",
                  )}
                  aria-pressed={printFormat === "sheet"}
                >
                  Planche QR
                </button>
              </div>

              <section className="grid gap-3" aria-label="Tables actives à imprimer">
                {activeTables.length > 0 ? (
                  activeTables.map((table) => {
                    const selected = selectedPrintIds.includes(table.id);

                    return (
                      <article
                        key={table.id}
                        className={cn(
                          "grid gap-4 rounded-3xl border bg-white p-4 shadow-card transition",
                          selected ? "border-emerald-700 ring-4 ring-emerald-50" : "border-slate-200",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => togglePrintTable(table.id)}
                          className="flex min-h-14 items-center justify-between gap-3 text-left"
                          aria-pressed={selected}
                        >
                          <span>
                            <strong className="block text-xl text-slate-950">{table.name}</strong>
                            <span className="text-sm font-semibold text-slate-600">{table.area}</span>
                          </span>

                          <span
                            className={cn(
                              "grid size-8 shrink-0 place-items-center rounded-full border",
                              selected ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-transparent",
                            )}
                          >
                            <Check className="size-5" />
                          </span>
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <p className="rounded-2xl bg-emerald-50 p-4 text-center text-base font-semibold text-emerald-900">
                    Activez au moins une table pour préparer l’impression.
                  </p>
                )}
              </section>

              {selectedPrintTables.length > 0 ? (
                <p className="rounded-2xl bg-emerald-50 p-4 text-center text-base font-black text-emerald-900">
                  {selectedPrintTables.length} table{selectedPrintTables.length > 1 ? "s" : ""} sélectionnée
                  {selectedPrintTables.length > 1 ? "s" : ""}
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

            {selectedPrintTables.length > 0 ? (
              <section
                className={cn(
                  "tf-qr-print-area grid gap-5",
                  printFormat === "sheet" ? "sm:grid-cols-2" : "",
                )}
                aria-label="Aperçu impression QR"
              >
                {selectedPrintTables.map((table) => {
                  const link = getFullCustomerUrl(table, origin, restaurantSlug);

                  return (
                    <PrintableQrCard
                      key={table.id}
                      restaurantName={restaurantDisplayName}
                      table={table}
                      link={link}
                      compact={printFormat === "sheet"}
                    />
                  );
                })}
              </section>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </>
  );
}