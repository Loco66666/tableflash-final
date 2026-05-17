import { Bell, ChefHat, Check, CreditCard, Heart, QrCode, Table2 } from "lucide-react";
import { SectionCard } from "@/components/ui-custom/SectionCard";

const steps = [
  { label: "Commande envoyée", icon: Check, done: true },
  { label: "Validation", icon: Check, done: true },
  { label: "Règlement", icon: CreditCard, done: true },
  { label: "Préparation", icon: ChefHat, done: true, active: true },
  { label: "Service", icon: Bell, done: false },
];

export function CustomerTrackingPreview({ tableName = "Table 1", tableArea = "" }: { tableName?: string; tableArea?: string }) {
  return (
    <div className="grid gap-6">
      <SectionCard className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-900 text-white"><Check className="size-9" /></span>
        <div className="min-w-0">
          <h2 className="text-2xl font-black text-emerald-800">Commande envoyée</h2>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-lg text-slate-600"><span className="inline-flex items-center gap-2"><Table2 className="size-5" />{tableArea ? `${tableName} • ${tableArea}` : tableName}</span><span className="inline-flex items-center gap-2"><QrCode className="size-5" />28,40 €</span></p>
        </div>
      </SectionCard>
      <section className="rounded-[1.6rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 text-center shadow-card">
        <span className="mx-auto mb-4 grid size-24 place-items-center rounded-full bg-emerald-100 text-emerald-800"><ChefHat className="size-14" /></span>
        <h2 className="text-3xl font-black leading-tight text-emerald-800">Votre commande est en préparation</h2>
        <p className="mt-3 text-lg text-slate-600">L’équipe prépare votre commande.</p>
        <div className="mt-7 grid grid-cols-5 gap-1">
          {steps.map((step) => {
            const Icon = step.icon;
            return <div key={step.label} className="text-center"><span className={(step.active ? "ring-2 ring-emerald-700 " : "") + (step.done ? "bg-emerald-700 text-white" : "bg-white text-slate-400") + " mx-auto grid size-12 place-items-center rounded-full border border-emerald-100"}><Icon className="size-6" /></span><p className={(step.active ? "text-emerald-800" : "text-slate-600") + " mt-2 text-xs font-medium leading-tight"}>{step.label}</p></div>;
          })}
        </div>
      </section>
      <div>
        <h2 className="mb-4 text-2xl font-black tracking-[-0.03em]">Après le repas</h2>
        <SectionCard className="flex min-h-16 items-center gap-4"><span className="grid size-12 place-items-center rounded-full bg-emerald-50 font-black text-blue-600">G</span><span className="flex-1 text-lg font-semibold">Donner un avis sur Google</span></SectionCard>
      </div>
      <footer className="pb-2 text-center text-slate-600"><Heart className="mx-auto mb-2 size-8 text-emerald-800" /><strong className="text-slate-950">Merci pour votre confiance !</strong></footer>
    </div>
  );
}
