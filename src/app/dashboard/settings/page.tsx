"use client";

import { useState } from "react";
import { Building2, Check, ChevronRight, Clock, CreditCard, Paintbrush, QrCode, Save, Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";
import { useSettingsStore } from "@/lib/local-store/settingsStore";

const sections = [
  { title: "Établissement", subtitle: "Nom, adresse, téléphone", icon: Building2 },
  { title: "Horaires", subtitle: "Service midi • Service soir", icon: Clock },
  { title: "Commandes", subtitle: "Paiement sur place", icon: CreditCard },
  { title: "QR", subtitle: "Instruction QR", icon: QrCode },
  { title: "Apparence", subtitle: "Classique premium", icon: Paintbrush },
];

export default function SettingsPage() {
  const { value: settings, setValue: setSettings } = useSettingsStore();
  const [saved, setSaved] = useState(false);
  const googleReviewUrl = settings.googleReviewUrl ?? "";

  function saveSettings() {
    setSettings((currentSettings) => ({ ...currentSettings, googleReviewUrl: googleReviewUrl.trim() }));
    setSaved(true);
  }

  return (
    <AppShell>
      <PageHeader title="Réglages" />
      <SectionCard className="mb-7 flex items-center gap-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
        <span className="grid size-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-900 text-white shadow-green"><Check className="size-14" /></span>
        <div>
          <p className="text-2xl font-black text-emerald-800">État de préparation</p>
          <h2 className="text-5xl font-black tracking-[-0.06em] text-emerald-800">100% prêt</h2>
        </div>
      </SectionCard>

      <SectionCard className="mb-4">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-800"><Star className="size-8" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-black tracking-[-0.03em]">Avis Google</h2>
            <p className="text-lg text-slate-600">Lien Google Avis</p>
          </div>
        </div>
        <label htmlFor="google-review-url" className="mt-5 block text-lg font-black">Lien Google Avis</label>
        <input
          id="google-review-url"
          value={googleReviewUrl}
          onChange={(event) => {
            setSettings((currentSettings) => ({ ...currentSettings, googleReviewUrl: event.target.value }));
            setSaved(false);
          }}
          inputMode="url"
          className="mt-2 min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          aria-describedby="google-review-help"
        />
        <p id="google-review-help" className="mt-2 text-slate-600">Ajoutez ici le lien utilisé pour inviter vos clients satisfaits à laisser un avis.</p>
        {saved ? <p className="mt-3 font-black text-emerald-800">Lien enregistré</p> : null}
      </SectionCard>

      <div className="grid gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <SectionCard key={section.title} className="flex min-h-24 items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-800"><Icon className="size-8" /></span>
              <div className="min-w-0 flex-1"><h2 className="text-2xl font-black tracking-[-0.03em]">{section.title}</h2><p className="truncate text-lg text-slate-600">{section.subtitle}</p></div>
              <ChevronRight className="size-7 text-slate-500" />
            </SectionCard>
          );
        })}
      </div>
      <button type="button" onClick={saveSettings} className="mt-7 min-h-16 rounded-[1.2rem] bg-gradient-to-br from-emerald-600 to-emerald-900 text-xl font-black text-white shadow-green">
        <span className="inline-flex items-center gap-4"><Save className="size-8" /> Enregistrer</span>
      </button>
    </AppShell>
  );
}
