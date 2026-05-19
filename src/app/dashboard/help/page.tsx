import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BookOpenCheck,
  ChevronRight,
  MessageCircleQuestion,
  QrCode,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";

const quickActions: Array<{
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    title: "Gérer une commande",
    subtitle: "Accepter, encaisser, préparer et servir.",
    href: "/dashboard/orders",
    icon: ShoppingBag,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Modifier le menu",
    subtitle: "Ajoutez un produit, une photo ou une rupture.",
    href: "/dashboard/menu",
    icon: UtensilsCrossed,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Créer un QR de table",
    subtitle: "Ajoutez une table, copiez le lien ou affichez le QR.",
    href: "/dashboard/qr",
    icon: QrCode,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Régler les horaires",
    subtitle: "Contrôlez l’ouverture du menu client.",
    href: "/dashboard/settings",
    icon: Settings,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "Avis Google",
    subtitle: "Répondez aux avis et proposez Google après le repas.",
    href: "/dashboard/reviews",
    icon: BookOpenCheck,
    tone: "bg-violet-50 text-violet-700",
  },
];

const faqItems = [
  {
    question: "Pourquoi mon QR ne s’ouvre pas sur téléphone ?",
    answer:
      "Le téléphone doit pouvoir accéder à la même adresse que celle utilisée pour générer le QR. En test local, utilisez l’adresse réseau de l’ordinateur, par exemple http://192.168.1.125:3000.",
  },
  {
    question: "Pourquoi le service est fermé ?",
    answer:
      "Le statut du service suit les horaires configurés dans Réglages. Vérifiez le service midi, le service soir et les jours ouverts.",
  },
  {
    question: "Pourquoi une commande n’apparaît pas ?",
    answer:
      "Vérifiez que vous utilisez la même adresse pour le client et le dashboard. localhost et l’adresse réseau ne partagent pas les mêmes données.",
  },
  {
    question: "Comment mettre un produit en rupture ?",
    answer:
      "Allez dans Menu, ouvrez le produit, puis désactivez Produit disponible. Il restera visible côté restaurateur mais sera masqué côté client.",
  },
  {
    question: "Comment changer le nom du restaurant ?",
    answer: "Allez dans Réglages, section Établissement, modifiez le nom puis enregistrez.",
  },
  {
    question: "Pourquoi la préparation est bloquée ?",
    answer:
      "Une commande doit être marquée payée avant de lancer la préparation. C’est volontaire pour éviter les commandes non réglées.",
  },
];

export default function HelpPage() {
  return (
    <AppShell>
      <PageHeader title="Aide" subtitle="Trouvez rapidement quoi faire" />

      <section className="grid min-w-0 grid-cols-1 gap-4" aria-label="Aide TableFlash">
        <SectionCard className="border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
          <p className="text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">Besoin d’aide avec TableFlash ?</p>
          <p className="mt-2 text-[1.02rem] leading-snug text-slate-600">
            Retrouvez les réponses aux problèmes les plus fréquents pendant le service.
          </p>
          <p className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-emerald-100">
            TableFlash reste simple : menu, QR, commandes, avis et réglages.
          </p>
        </SectionCard>

        <div className="grid min-w-0 grid-cols-1 gap-3" aria-label="Actions rapides">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="block min-w-0 rounded-[1.35rem] transition active:scale-[0.99]">
                <SectionCard className="flex min-h-24 items-center gap-3 p-4">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-full ${item.tone}`}>
                    <Icon className="size-7" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-black leading-tight tracking-[-0.02em] text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-sm leading-snug text-slate-600">{item.subtitle}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-slate-500" aria-hidden="true" />
                </SectionCard>
              </Link>
            );
          })}
        </div>

        <SectionCard className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <MessageCircleQuestion className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-black leading-tight tracking-[-0.03em] text-slate-950">Questions fréquentes</h2>
          </div>

          <div className="grid gap-2">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <summary className="cursor-pointer list-none pr-1 text-[0.98rem] font-bold leading-snug text-slate-900 marker:content-none">
                  {item.question}
                </summary>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="border-emerald-100 bg-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <AlertCircle className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-black leading-tight tracking-[-0.03em] text-slate-950">Préparer une demande d’aide</h2>
              <p className="mt-2 text-[0.98rem] leading-snug text-slate-600">
                Pour gagner du temps, notez la page concernée, la table, la commande et ce que vous avez essayé.
              </p>
              <ul className="mt-3 grid gap-1 text-sm font-semibold text-slate-700">
                <li>• Page concernée</li>
                <li>• Numéro de table</li>
                <li>• Numéro de commande</li>
                <li>• Message ou capture du problème</li>
              </ul>
            </div>
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
