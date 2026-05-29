import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock3,
  Headphones,
  MessageCircle,
  MessageCircleQuestion,
  QrCode,
  Settings,
  ShoppingBag,
  Star,
  UtensilsCrossed,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";

const supportWhatsappUrl =
  "https://wa.me/33624737745?text=Bonjour%20TableFlash%2C%20j%E2%80%99ai%20besoin%20d%E2%80%99aide.%0A%0ARestaurant%20%3A%0APage%20concern%C3%A9e%20%3A%0ANum%C3%A9ro%20de%20table%20%3A%0ANum%C3%A9ro%20de%20commande%20%3A%0ADescription%20du%20probl%C3%A8me%20%3A";

const quickTopics: Array<{
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    title: "Commandes",
    subtitle: "Accepter, encaisser, préparer, terminer",
    href: "/dashboard/orders",
    icon: ShoppingBag,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Menu",
    subtitle: "Produits, photos, prix, ruptures",
    href: "/dashboard/menu",
    icon: UtensilsCrossed,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "QR",
    subtitle: "Tables, liens clients, impression",
    href: "/dashboard/qr",
    icon: QrCode,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Avis clients",
    subtitle: "Retours clients et avis Google",
    href: "/dashboard/reviews",
    icon: Star,
    tone: "bg-orange-50 text-orange-700",
  },
  {
    title: "Réglages",
    subtitle: "Horaires, service, infos restaurant",
    href: "/dashboard/settings",
    icon: Settings,
    tone: "bg-teal-50 text-teal-700",
  },
];

const emergencyChecks: Array<{
  title: string;
  text: string;
  icon: LucideIcon;
}> = [
  {
    title: "Une commande n’apparaît pas",
    text: "Vérifiez que les commandes QR sont activées, que la table est active et que le client a bien confirmé son panier.",
    icon: ShoppingBag,
  },
  {
    title: "Un QR ne fonctionne pas",
    text: "Vérifiez que la table est active dans QR, puis ouvrez le menu client depuis le dashboard pour tester le lien.",
    icon: QrCode,
  },
  {
    title: "Le service paraît fermé",
    text: "Vérifiez les horaires, les jours ouverts et l’activation des commandes dans les réglages.",
    icon: Clock3,
  },
  {
    title: "Un produit ne doit plus être commandé",
    text: "Allez dans Menu, ouvrez le produit, puis désactivez sa disponibilité. Il disparaît côté client.",
    icon: UtensilsCrossed,
  },
];

const faqItems = [
  {
    question: "Pourquoi mon QR ne s’ouvre pas ?",
    answer:
      "Vérifiez que le QR de la table est actif dans l’onglet QR. Utilisez aussi le bouton “Ouvrir le menu client” pour confirmer que le lien fonctionne avant de l’imprimer ou de le donner au client.",
  },
  {
    question: "Pourquoi le service est fermé côté client ?",
    answer:
      "Le service dépend des réglages du restaurant : commandes activées, horaires, jours ouverts et QR actifs. Vérifiez d’abord Réglages, puis l’onglet QR.",
  },
  {
    question: "Pourquoi une commande n’apparaît pas ?",
    answer:
      "La commande apparaît après confirmation du panier par le client. Si elle n’arrive pas, vérifiez que les commandes QR sont activées, que la table est active, puis rechargez l’écran Commandes.",
  },
  {
    question: "Comment mettre un produit en rupture ?",
    answer:
      "Allez dans Menu, ouvrez le produit, puis désactivez “Produit disponible”. Le produit sera masqué ou indiqué indisponible côté client selon la configuration.",
  },
  {
    question: "Comment modifier une table ou un QR ?",
    answer:
      "Allez dans QR. Vous pouvez activer, désactiver, modifier une table, copier son lien, voir son QR ou préparer l’impression.",
  },
  {
    question: "Comment changer le nom, l’adresse ou le téléphone du restaurant ?",
    answer:
      "Allez dans Réglages, section Établissement. Modifiez les informations utiles, puis enregistrez. Ces informations servent à l’affichage public du restaurant.",
  },
  {
    question: "Pourquoi la préparation est bloquée ?",
    answer:
      "Une commande doit être acceptée puis marquée payée avant de lancer la préparation. Cela évite de préparer une commande qui n’a pas encore été réglée sur place.",
  },
  {
    question: "Quand le client peut-il laisser un avis ?",
    answer:
      "Le client peut laisser un avis une fois la commande terminée. Les avis positifs peuvent ensuite proposer un partage sur Google si le lien Google Avis est renseigné.",
  },
];

const supportChecklist = ["Page concernée", "Numéro de table", "Numéro de commande", "Capture du problème"];

export default function HelpPage() {
  return (
    <AppShell>
      <PageHeader title="Aide" subtitle="Résoudre rapidement un problème pendant le service" />

      <section className="grid min-w-0 grid-cols-1 gap-4 pb-28" aria-label="Centre d’aide TableFlash">
        <SectionCard className="rounded-3xl border-emerald-100 bg-linear-to-br from-white to-emerald-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <WifiOff className="size-5" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h2 className="text-lg font-black leading-tight text-slate-950">Problème pendant le service ?</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Commencez par vérifier les points rapides ci-dessous. Ils règlent la plupart des blocages en salle.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {emergencyChecks.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-2xl border border-emerald-100 bg-white p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div className="grid min-w-0 grid-cols-1 gap-3" aria-label="Accès rapides">
          {quickTopics.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.title} href={item.href} className="block min-w-0 rounded-2xl transition active:scale-[0.99]">
                <SectionCard className="flex items-center gap-3 rounded-2xl p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full ${item.tone}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-black leading-tight text-slate-950">{item.title}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-slate-600">{item.subtitle}</span>
                  </span>

                  <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
                </SectionCard>
              </Link>
            );
          })}
        </div>

        <SectionCard className="rounded-3xl p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <MessageCircleQuestion className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-black leading-tight text-slate-950">Questions fréquentes</h2>
          </div>

          <div className="grid gap-2">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-base font-bold leading-snug text-slate-900 marker:content-none">
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
              <Headphones className="size-5" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black leading-tight text-slate-950">Contacter le support TableFlash</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                En cas de blocage pendant le service, envoyez une capture et les informations utiles.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {supportChecklist.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                    {item}
                  </span>
                ))}
              </div>

              <a
                href={supportWhatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-base font-black text-white shadow-green transition active:scale-[0.99]"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
                Contacter sur WhatsApp
              </a>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="rounded-3xl border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-emerald-700">
              <AlertCircle className="size-5" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h2 className="text-lg font-black leading-tight text-slate-950">À retenir</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                Les réglages principaux se trouvent dans Commandes, Menu, QR et Réglages. En cas de doute, vérifiez d’abord
                que le service est ouvert, que le QR est actif et que les produits sont disponibles.
              </p>
            </div>
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}