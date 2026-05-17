import { Plus, Printer, QrCode, ReceiptText, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { TableQrCard } from "@/components/ui-custom/TableQrCard";
import { tables } from "@/lib/data/seed";

export default function QrPage() {
  return (
    <AppShell>
      <PageHeader title="Le Bistrot des Halles" subtitle="Service midi en cours" />
      <h1 className="mb-5 text-4xl font-black tracking-[-0.05em]">QR par table</h1>
      <SectionCard className="mb-5 grid grid-cols-3 gap-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-center"><div><QrCode className="mx-auto mb-2 size-8 text-emerald-800" /><strong className="text-3xl font-black text-emerald-800">6</strong><p className="text-slate-600">QR actifs</p></div><div><TrendingUp className="mx-auto mb-2 size-8 rounded-full bg-emerald-100 p-1 text-emerald-800" /><strong className="text-3xl font-black text-emerald-800">80</strong><p className="text-slate-600">scans</p></div><div><ReceiptText className="mx-auto mb-2 size-8 rounded-full bg-emerald-100 p-1 text-emerald-800" /><strong className="text-3xl font-black text-emerald-800">17</strong><p className="text-slate-600">commandes QR</p></div></SectionCard>
      <button className="mb-6 min-h-16 rounded-[1.1rem] bg-gradient-to-br from-emerald-600 to-emerald-900 text-xl font-black text-white shadow-green"><span className="inline-flex items-center gap-3"><Plus className="size-8 rounded-full bg-white p-1 text-emerald-800" /> Ajouter une table</span></button>
      <div className="grid gap-4">{tables.map((table) => <TableQrCard key={table.id} table={table} />)}</div>
      <button className="mt-6 min-h-16 rounded-[1.1rem] border border-emerald-800 text-xl font-black text-emerald-800"><span className="inline-flex items-center gap-3"><Printer className="size-7" /> Préparer impression</span></button>
    </AppShell>
  );
}
