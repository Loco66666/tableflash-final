import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock3,
  ClipboardList,
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
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";

type PilotOrder = {
  id: string;
  order_number: number | null;
  status: string;
  payment_status: string;
  created_at: string | null;
};

type PilotTable = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type PilotProduct = {
  id: string;
  is_available: boolean;
};

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

function getPilotStatusLabel(status: string, paymentStatus?: string) {
  if (status === "pending") return "Nouvelle";
  if (status === "accepted" && paymentStatus === "paid") return "Payee";
  if (status === "accepted") return "A encaisser";
  if (status === "preparing") return "En preparation";
  if (status === "ready") return "Prete";
  if (status === "served") return "Servie";
  if (status === "rejected") return "Refusee";
  if (status === "cancelled") return "Annulee";

  return status;
}

function getShortDateTime(value: string | null) {
  if (!value) return "Aucune date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Aucune date";

  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function HelpPage() {
  const { restaurant, settings } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const [{ data: tablesData }, { data: productsData }, { data: ordersData }] = await Promise.all([
    supabase.from("restaurant_tables").select("id, name, slug, is_active").eq("restaurant_id", restaurant.id).returns<PilotTable[]>(),
    supabase.from("menu_products").select("id, is_available").eq("restaurant_id", restaurant.id).returns<PilotProduct[]>(),
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, created_at")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<PilotOrder[]>(),
  ]);

  const tables = tablesData ?? [];
  const products = productsData ?? [];
  const recentOrders = ordersData ?? [];
  const activeTablesCount = tables.filter((table) => table.is_active).length;
  const firstActiveTable = tables.find((table) => table.is_active);
  const availableProductsCount = products.filter((product) => product.is_available).length;
  const lastOrder = recentOrders[0];

  const pilotChecks = [
    {
      label: "Commandes QR activees",
      ready: settings?.orders_enabled !== false,
      href: "/dashboard/settings",
    },
    {
      label: "QR actifs",
      ready: settings?.qr_enabled !== false && activeTablesCount > 0,
      href: "/dashboard/qr",
    },
    {
      label: "Produits disponibles",
      ready: availableProductsCount > 0,
      href: "/dashboard/menu",
    },
    {
      label: "Paiement sur place clair",
      ready: true,
      href: "/dashboard/settings",
    },
    {
      label: "Avis clients actives",
      ready: settings?.reviews_enabled !== false,
      href: "/dashboard/reviews",
    },
  ];

  const readyCount = pilotChecks.filter((check) => check.ready).length;
  const pilotReady = readyCount === pilotChecks.length;
  const serviceSteps = [
    {
      title: "Avant le service",
      items: [
        "Verifier que les commandes QR sont activees.",
        "Ouvrir un QR de table et confirmer que le menu client s'affiche.",
        "Masquer les produits en rupture avant les premiers clients.",
      ],
      href: firstActiveTable ? `/r/${restaurant.slug}/table/${firstActiveTable.slug}` : "/dashboard/qr",
      cta: firstActiveTable ? `Tester ${firstActiveTable.name}` : "Creer une table QR",
    },
    {
      title: "Pendant le service",
      items: [
        "Garder l'ecran Commandes ouvert.",
        "Accepter, encaisser, preparer, puis terminer chaque commande.",
        "Utiliser le refresh si le serveur change d'onglet ou de telephone.",
      ],
      href: "/dashboard/orders",
      cta: "Voir les commandes",
    },
    {
      title: "Fin de service",
      items: [
        "Verifier les commandes servies et les avis recus.",
        "Exporter les commandes du jour en CSV.",
        "Reactiver les produits remis en stock pour le service suivant.",
      ],
      href: "/dashboard/orders/export?period=today",
      cta: "Exporter aujourd'hui",
    },
  ];

  return (
    <AppShell>
      <PageHeader title="Aide" subtitle="Résoudre rapidement un problème pendant le service" />

      <section className="grid min-w-0 grid-cols-1 gap-4 pb-28" aria-label="Centre d’aide TableFlash">
        <SectionCard className="rounded-3xl border-emerald-100 bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <ClipboardList className="size-5" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black leading-tight text-slate-950">Checklist installation pilote</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {pilotReady
                  ? "Le restaurant est pret pour un service accompagne."
                  : `${readyCount}/${pilotChecks.length} points prets avant le service.`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {pilotChecks.map((check) => (
              <Link key={check.label} href={check.href} className="block rounded-2xl transition active:scale-[0.99]">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <span
                    className={
                      check.ready
                        ? "grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"
                        : "grid size-8 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700"
                    }
                  >
                    {check.ready ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-black text-slate-900">{check.label}</span>
                  <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              <span className="font-black text-slate-950">Restaurant :</span> {restaurant.name}
            </p>
            <p>
              <span className="font-black text-slate-950">Slug public :</span> {restaurant.slug}
            </p>
            <p>
              <span className="font-black text-slate-950">Tables actives :</span> {activeTablesCount}/{tables.length}
            </p>
            <p>
              <span className="font-black text-slate-950">Produits disponibles :</span> {availableProductsCount}/{products.length}
            </p>
            <p>
              <span className="font-black text-slate-950">Derniere commande :</span>{" "}
              {lastOrder
                ? `n°${lastOrder.order_number ?? lastOrder.id.slice(0, 8)} - ${getPilotStatusLabel(
                    lastOrder.status,
                    lastOrder.payment_status,
                  )} - ${getShortDateTime(lastOrder.created_at)}`
                : "Aucune commande recente"}
            </p>
          </div>
        </SectionCard>

        <SectionCard className="rounded-3xl border-emerald-100 bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
              <Clock3 className="size-5" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <h2 className="text-lg font-black leading-tight text-slate-950">Rituel de service</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Une routine courte pour garder le service fluide, meme quand la salle bouge.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {serviceSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-950">{step.title}</p>
                    <ul className="mt-2 grid gap-1 text-sm leading-relaxed text-slate-600">
                      {step.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-700" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={step.href}
                    className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition active:scale-[0.99]"
                  >
                    {step.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

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
