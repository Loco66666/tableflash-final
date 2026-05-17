import { Building2, ChevronRight, Clock, CreditCard, Paintbrush, QrCode, Save, Star, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";

const sections = [
  { title: "Établissement", subtitle: "Nom, adresse, téléphone", icon: Building2 },
  { title: "Horaires", subtitle: "Service midi • Service soir", icon: Clock },
  { title: "Commandes", subtitle: "Paiement sur place", icon: CreditCard },
  { title: "QR", subtitle: "Instruction QR", icon: QrCode },
  { title: "Avis Google", subtitle: "Lien Google Avis", icon: Star },
  { title: "Apparence", subtitle: "Classique premium", icon: Paintbrush },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader title="Réglages" />
      <SectionCard className="mb-7 flex items-center gap-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6"><span className="grid size-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 text-white shadow-green"><Check className="size-14" /></span><div><p className="text-2xl font-black text-emerald-800">État de préparation</p><h2 className="text-5xl font-black tracking-[-0.06em] text-emerald-800">100% prêt</h2></div></SectionCard>
      <div className="grid gap-4">{sections.map((section) => { const Icon = section.icon; return <SectionCard key={section.title} className="flex min-h-24 items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-800"><Icon className="size-8" /></span><div className="min-w-0 flex-1"><h2 className="text-2xl font-black tracking-[-0.03em]">{section.title}</h2><p className="truncate text-lg text-slate-600">{section.subtitle}</p></div><ChevronRight className="size-7 text-slate-500" /></SectionCard>; })}</div>
      <button className="mt-7 min-h-16 rounded-[1.2rem] bg-gradient-to-br from-emerald-600 to-emerald-900 text-xl font-black text-white shadow-green"><span className="inline-flex items-center gap-4"><Save className="size-8" /> Enregistrer</span></button>
    </AppShell>
  );
}
