import { BookOpenCheck, MessageCircleQuestion, QrCode, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";

const helpItems = [
  {
    title: "Gérer les commandes",
    subtitle: "Accepter, encaisser, préparer et servir.",
    icon: ShoppingBag,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    title: "Modifier le menu",
    subtitle: "Ajoutez vos produits, photos, ruptures et prix.",
    icon: UtensilsCrossed,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Créer les QR",
    subtitle: "Ajoutez une table, copiez le lien ou imprimez le QR.",
    icon: QrCode,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Avis Google",
    subtitle: "Répondez aux avis et proposez Google après le repas.",
    icon: BookOpenCheck,
    tone: "bg-violet-50 text-violet-700",
  },
];

export default function HelpPage() {
  return (
    <AppShell>
      <PageHeader title="Aide" subtitle="Comprendre TableFlash rapidement" />

      <section className="grid min-w-0 grid-cols-1 gap-4" aria-label="Aide TableFlash">
        {helpItems.map((item) => {
          const Icon = item.icon;
          return (
            <SectionCard key={item.title} className="flex min-h-24 items-center gap-4 p-5">
              <span className={`grid size-14 shrink-0 place-items-center rounded-full ${item.tone}`}>
                <Icon className="size-8" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">{item.title}</span>
                <span className="mt-1 block text-lg leading-snug text-slate-600">{item.subtitle}</span>
              </span>
            </SectionCard>
          );
        })}

        <SectionCard className="flex min-h-24 items-center gap-4 border-slate-200/90 bg-slate-50/80 p-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-slate-700">
            <MessageCircleQuestion className="size-8" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">Besoin d’aide ?</span>
            <span className="mt-1 block text-lg leading-snug text-slate-600">Préparez votre question avant de contacter le support.</span>
          </span>
        </SectionCard>
      </section>
    </AppShell>
  );
}
