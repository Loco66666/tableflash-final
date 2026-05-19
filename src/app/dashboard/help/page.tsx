import { BookOpenCheck, MessageCircleQuestion, QrCode, ShoppingBag, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";

const helpItems = [
  {
    title: "Gérer les commandes",
    subtitle: "Acceptez la commande, encaissez sur place, puis lancez la préparation.",
    icon: ShoppingBag,
    tone: "bg-emerald-50 text-emerald-800",
    href: "/dashboard/orders",
    cta: "Ouvrir les commandes",
  },
  {
    title: "Modifier le menu",
    subtitle: "Ajoutez vos produits, photos, prix, ruptures et mises en avant.",
    icon: UtensilsCrossed,
    tone: "bg-amber-50 text-amber-700",
    href: "/dashboard/menu",
    cta: "Ouvrir le menu",
  },
  {
    title: "Créer les QR",
    subtitle: "Ajoutez vos tables, copiez les liens ou préparez l’impression.",
    icon: QrCode,
    tone: "bg-blue-50 text-blue-700",
    href: "/dashboard/qr",
    cta: "Ouvrir les QR",
  },
  {
    title: "Avis Google",
    subtitle: "Répondez aux avis et proposez Google après le repas.",
    icon: BookOpenCheck,
    tone: "bg-violet-50 text-violet-700",
    href: "/dashboard/reviews",
    cta: "Ouvrir les avis",
  },
];

export default function HelpPage() {
  return (
    <AppShell>
      <PageHeader title="Aide" subtitle="Comprendre TableFlash rapidement" />

      <section className="grid min-w-0 grid-cols-1 gap-4" aria-label="Aide TableFlash">
        <SectionCard className="border-slate-200/90 bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5">
          <p className="text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">Démarrer rapidement</p>
          <p className="mt-2 text-base leading-snug text-slate-600 sm:text-lg">
            Créez votre menu, ajoutez vos tables, imprimez vos QR et recevez vos premières commandes.
          </p>
          <ol className="mt-3 grid gap-1 text-sm font-semibold text-slate-700 sm:grid-cols-2 sm:text-base">
            <li>1. Créer le menu</li>
            <li>2. Ajouter les tables</li>
            <li>3. Imprimer les QR</li>
            <li>4. Suivre les commandes</li>
          </ol>
        </SectionCard>

        {helpItems.map((item) => {
          const Icon = item.icon;
          return (
            <SectionCard key={item.title} className="p-4 sm:p-5">
              <div className="flex min-h-24 items-start gap-3 sm:gap-4">
                <span className={`grid size-12 shrink-0 place-items-center rounded-full sm:size-14 ${item.tone}`}>
                  <Icon className="size-7 sm:size-8" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-2xl">{item.title}</span>
                  <span className="mt-1 block text-base leading-snug text-slate-600 sm:text-lg">{item.subtitle}</span>
                  <Link
                    href={item.href}
                    className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    {item.cta}
                  </Link>
                </span>
              </div>
            </SectionCard>
          );
        })}

        <SectionCard className="flex min-h-24 items-center gap-4 border-slate-200/90 bg-slate-50/80 p-4 sm:p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-slate-700 sm:size-14">
            <MessageCircleQuestion className="size-7 sm:size-8" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-2xl">Besoin d’aide ?</span>
            <span className="mt-1 block text-base leading-snug text-slate-600 sm:text-lg">
              Notez votre question et contactez la personne qui vous accompagne sur TableFlash.
            </span>
          </span>
        </SectionCard>
      </section>
    </AppShell>
  );
}
