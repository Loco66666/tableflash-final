import type { LucideIcon } from "lucide-react";
import { AlertCircle, ChevronDown, MessageCircleQuestion, QrCode, Settings, ShoppingBag, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";

const quickTopics: Array<{
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    title: "Commandes",
    subtitle: "Encaisser, préparer, servir",
    href: "/dashboard/orders",
    icon: ShoppingBag,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Menu",
    subtitle: "Produits, photos, ruptures",
    href: "/dashboard/menu",
    icon: UtensilsCrossed,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "QR",
    subtitle: "Tables, liens, impression",
    href: "/dashboard/qr",
    icon: QrCode,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Réglages",
    subtitle: "Horaires, nom, avis Google",
    href: "/dashboard/settings",
    icon: Settings,
    tone: "bg-teal-50 text-teal-700",
  },
];

const faqItems = [
  {
    question: "Pourquoi mon QR ne s’ouvre pas ?",
    answer:
      "Le téléphone doit accéder à la même adresse que le QR. En test local, utilisez l’adresse réseau de l’ordinateur, par exemple 192.168.1.125:3000.",
  },
  {
    question: "Pourquoi le service est fermé ?",
    answer: "Le service suit les horaires réglés dans Réglages. Vérifiez le midi, le soir et les jours ouverts.",
  },
  {
    question: "Pourquoi une commande n’apparaît pas ?",
    answer:
      "Client et dashboard doivent utiliser la même adresse. localhost et l’adresse réseau ne partagent pas les mêmes données.",
  },
  {
    question: "Comment mettre un produit en rupture ?",
    answer: "Allez dans Menu, ouvrez le produit, puis désactivez Produit disponible. Il sera masqué côté client.",
  },
  {
    question: "Comment changer le nom du restaurant ?",
    answer: "Allez dans Réglages, section Établissement, modifiez le nom puis enregistrez.",
  },
  {
    question: "Pourquoi la préparation est bloquée ?",
    answer: "Une commande doit être marquée payée avant la préparation. Cela évite de préparer une commande non réglée.",
  },
];

export default function HelpPage() {
  return (
    <AppShell>
      <PageHeader title="Aide" subtitle="Trouvez rapidement une solution" />

      <section className="grid min-w-0 grid-cols-1 gap-4 pb-28" aria-label="Centre d’aide TableFlash">
        <SectionCard className="rounded-3xl border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-bold leading-tight text-slate-950">Besoin d’aide pendant le service ?</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">Choisissez un sujet ou consultez les réponses rapides.</p>
        </SectionCard>

        <div className="grid min-w-0 grid-cols-1 gap-3" aria-label="Sujets rapides">
          {quickTopics.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="block min-w-0 rounded-2xl transition active:scale-[0.99]">
                <SectionCard className="flex items-center gap-3 rounded-2xl p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full ${item.tone}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold leading-tight text-slate-950">{item.title}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-slate-600">{item.subtitle}</span>
                  </span>
                  <ChevronDown className="size-4 shrink-0 -rotate-90 text-slate-400" aria-hidden="true" />
                </SectionCard>
              </Link>
            );
          })}
        </div>

        <SectionCard className="rounded-3xl p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <MessageCircleQuestion className="size-4.5" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-bold leading-tight text-slate-950">Questions fréquentes</h2>
          </div>

          <div className="grid gap-2">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-base font-semibold leading-snug text-slate-900 marker:content-none">
                  <span className="flex-1">{item.question}</span>
                  <ChevronDown className="size-4 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-2 pr-6 text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="rounded-3xl border-emerald-100 bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <AlertCircle className="size-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight text-slate-950">Avant de demander de l’aide</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">Notez les informations utiles pour gagner du temps.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Page concernée", "Table", "Commande", "Capture du problème"].map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
