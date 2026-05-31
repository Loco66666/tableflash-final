/* eslint-disable react/no-unescaped-entities */

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  ChefHat,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  CreditCard,
  Euro,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Star,
  Store,
  TrendingUp,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

const appUrl = "https://app.tableflash.fr";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type BenefitCard = {
  icon: IconType;
  title: string;
  text: string;
};

type JourneyStep = {
  icon: IconType;
  title: string;
  text: string;
};

type FeatureCard = {
  icon: IconType;
  title: string;
  items: string[];
};

type FooterColumn = {
  title: string;
  links: string[];
};

const benefitCards: BenefitCard[] = [
  {
    icon: Smile,
    title: "Moins d'attente, plus de satisfaction",
    text: "Vos clients commandent en autonomie et à leur rythme. Le service est plus fluide, l'expérience est meilleure.",
  },
  {
    icon: TrendingUp,
    title: "Plus de productivité, moins de stress",
    text: "Moins d'allers-retours, moins d'erreurs, plus de temps pour vos clients et pour ce qui compte vraiment.",
  },
  {
    icon: ShieldCheck,
    title: "Moins d'erreurs, plus de qualité",
    text: "Commandes claires, validées par le restaurant. Résultat : moins d'oublis et plus de satisfaction.",
  },
  {
    icon: Euro,
    title: "Plus de ventes, plus de fidélité",
    text: "Suggestions visuelles, menus attractifs et suivi en temps réel : un impact direct sur votre panier moyen et vos avis.",
  },
];

const journeySteps: JourneyStep[] = [
  {
    icon: QrCode,
    title: "Scan du QR code",
    text: "Le client accède au menu de la table en 1 seconde.",
  },
  {
    icon: SmartphoneIcon,
    title: "Commande",
    text: "Il choisit ses produits et valide sa commande.",
  },
  {
    icon: ClipboardCheck,
    title: "Validation restaurant",
    text: "Vous validez ou ajustez la commande en temps réel.",
  },
  {
    icon: CreditCard,
    title: "Paiement sur place",
    text: "Le client règle au comptoir ou auprès du serveur.",
  },
  {
    icon: ChefHat,
    title: "Préparation",
    text: "La préparation commence après validation et règlement.",
  },
  {
    icon: Bell,
    title: "Suivi en temps réel",
    text: "Le client suit l'avancement de sa commande.",
  },
];

const featureCards: FeatureCard[] = [
  {
    icon: QrCode,
    title: "QR de table",
    items: ["QR code unique par table", "Impression facile et durable", "Aucun contact nécessaire"],
  },
  {
    icon: SmartphoneIcon,
    title: "Menu digital",
    items: ["Photos et descriptions illimitées", "Catégories et options personnalisées", "Mises à jour en temps réel"],
  },
  {
    icon: ShoppingBag,
    title: "Commandes",
    items: ["Commandes en direct", "Notifications instantanées", "Gestion simple et centralisée"],
  },
  {
    icon: CreditCard,
    title: "Paiement",
    items: ["Paiement sur place ou au comptoir", "Sécurisé, simple et rapide", "Aucun frais caché"],
  },
  {
    icon: Star,
    title: "Avis clients",
    items: ["Collecte d'avis authentiques", "Avis vérifiés et modérés", "Répondez depuis votre espace"],
  },
  {
    icon: BarChart3,
    title: "Statistiques",
    items: ["Tableau de bord intuitif", "Indicateurs clés en temps réel", "Export de rapports détaillés"],
  },
];

const beforeItems = [
  "Prises de commande au comptoir",
  "Erreurs et oublis fréquents",
  "Fausses commandes ou no-shows",
  "Temps d'attente plus longs",
  "Moins d'avis et de fidélité",
];

const afterItems = [
  "Commandes fluides et validées",
  "Paiement après validation, avant la préparation",
  "Moins de pertes et de gaspillage",
  "Service plus rapide et plus serein",
  "Plus d'avis positifs et de clients fidèles",
];

const footerColumns: FooterColumn[] = [
  {
    title: "Produit",
    links: ["Fonctionnalités", "Tarifs", "Intégrations", "Mises à jour"],
  },
  {
    title: "Ressources",
    links: ["Guides", "Blog", "FAQ", "Contact"],
  },
  {
    title: "Légal",
    links: ["Mentions légales", "Conditions générales", "Politique de confidentialité", "Cookies"],
  },
  {
    title: "Contact",
    links: ["contact@tableflash.fr", "Facebook  Instagram  LinkedIn"],
  },
];

function SmartphoneIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LogoMark() {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-700 text-white shadow-sm">
      <Store className="size-6" />
    </span>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-295 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="text-3xl font-black tracking-tight text-slate-950">Table Flash</span>
        </Link>

        <nav className="hidden items-center gap-10 text-sm font-black text-slate-950 lg:flex">
          <a href="#fonctionnalites" className="transition hover:text-emerald-700">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="transition hover:text-emerald-700">
            Tarifs
          </a>
          <a href="#fonctionnement" className="transition hover:text-emerald-700">
            Comment ça marche ?
          </a>
          <a href="#ressources" className="transition hover:text-emerald-700">
            Ressources
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href={`${appUrl}/login`} className="hidden text-sm font-black text-emerald-700 md:block">
            Se connecter
          </Link>

          <a
            href="#essai"
            className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-800"
          >
            Essayer gratuitement
          </a>
        </div>
      </div>
    </header>
  );
}

function DashboardMockup() {
  return (
    <div className="relative min-h-[360px] lg:min-h-[390px]">
      <div className="absolute right-[-20px] top-2 hidden size-[410px] rounded-full bg-emerald-50 lg:block" />

      <div className="absolute left-0 top-0 w-[560px] max-w-[86%] rounded-[22px] border-[9px] border-black bg-white shadow-[0_26px_55px_rgba(15,23,42,0.18)]">
        <div className="flex min-h-[315px] overflow-hidden rounded-xl bg-white">
          <aside className="w-28 border-r border-slate-100 bg-slate-50 p-4">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-emerald-700 text-white">
                <Store className="size-3" />
              </span>
              <span className="text-[11px] font-black text-slate-950">Table Flash</span>
            </div>

            {["Accueil", "Commandes", "Menu", "Avis clients", "Statistiques", "Réglages"].map((item, index) => (
              <div
                key={item}
                className={[
                  "mb-2 rounded-md px-2 py-2 text-[10px] font-bold",
                  index === 0 ? "bg-emerald-50 text-emerald-700" : "text-slate-500",
                ].join(" ")}
              >
                {item}
              </div>
            ))}
          </aside>

          <section className="flex-1 p-5">
            <h3 className="mb-4 text-sm font-black text-slate-950">Tableau de bord</h3>

            <div className="rounded-xl border border-slate-100 p-4">
              <p className="mb-3 text-xs font-black text-slate-950">Performances aujourd'hui</p>

              <div className="grid grid-cols-4 gap-2">
                {[
                  ["Commandes", "92", "aujourd'hui"],
                  ["Chiffre d'affaires", "1 240 €", "aujourd'hui"],
                  ["Panier moyen", "16,80 €", "aujourd'hui"],
                  ["Avis moyens", "4,6/5", "sur 100 avis"],
                ].map(([label, value, sub]) => (
                  <div key={label} className="rounded-lg border border-slate-100 bg-white p-3">
                    <p className="text-[8px] font-bold text-slate-500">{label}</p>
                    <p className="mt-1 text-lg font-black text-emerald-700">{value}</p>
                    <p className="text-[8px] font-bold text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-slate-100 p-3">
                <p className="mb-3 text-xs font-black text-slate-950">Ventes</p>
                <div className="h-24 rounded-lg bg-emerald-50">
                  <svg viewBox="0 0 360 100" className="h-full w-full">
                    <path
                      d="M8 82 C35 62 55 76 78 58 C99 43 120 53 142 37 C166 20 195 50 219 34 C246 17 262 58 288 40 C314 20 331 31 352 16"
                      fill="none"
                      stroke="#69b99a"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8 82 C35 62 55 76 78 58 C99 43 120 53 142 37 C166 20 195 50 219 34 C246 17 262 58 288 40 C314 20 331 31 352 16 L352 100 L8 100 Z"
                      fill="rgba(0,107,70,0.10)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="absolute -bottom-7 left-1/2 h-4 w-3/4 -translate-x-1/2 rounded-b-full bg-black/20 blur-sm" />
        <div className="absolute -bottom-5 left-1/2 h-5 w-3/5 -translate-x-1/2 rounded-b-full bg-slate-300" />
      </div>

      <div className="absolute bottom-0 left-[56%] z-10 w-[122px] rounded-3xl border-[7px] border-black bg-white shadow-[0_22px_45px_rgba(15,23,42,0.20)]">
        <div className="rounded-2xl bg-white p-3">
          <p className="mb-2 text-center text-[9px] font-black text-emerald-700">Carte</p>
          {["Burger", "Salade", "Pasta", "Dessert"].map((item) => (
            <div key={item} className="mb-2 flex gap-2 rounded-lg border border-slate-100 p-1.5">
              <div className="size-7 rounded-md bg-linear-to-br from-orange-200 to-orange-500" />
              <div>
                <p className="text-[8px] font-black text-slate-950">{item}</p>
                <p className="text-[7px] font-bold text-slate-400">12,90 €</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-9 right-[-10px] z-20 w-[138px] -rotate-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-[0_26px_55px_rgba(15,23,42,0.18)]">
        <p className="text-[8px] font-black uppercase text-emerald-700">Restaurant</p>
        <p className="mt-1 text-lg font-black text-slate-950">Le Bistrot</p>
        <p className="mt-2 text-[8px] font-bold leading-tight text-slate-600">
          Scanne le QR code pour consulter le menu et passer commande
        </p>

        <div className="mx-auto my-3 grid size-18 grid-cols-5 gap-1 rounded-md border border-emerald-700/20 bg-emerald-50 p-1">
          {Array.from({ length: 25 }).map((_, index) => (
            <span
              key={index}
              className={index % 3 === 0 || index % 7 === 0 ? "rounded-sm bg-emerald-700" : "rounded-sm bg-white"}
            />
          ))}
        </div>

        <p className="text-[8px] font-bold text-slate-600">Paiement sur place</p>
        <p className="text-[7px] font-bold text-slate-400">Merci et à bientôt !</p>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm font-bold leading-relaxed text-slate-950">
      <CircleCheck className="mt-0.5 size-5 shrink-0 fill-emerald-700 text-white" />
      {children}
    </p>
  );
}

function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />

      <section className="mx-auto grid w-full max-w-295 gap-8 px-5 pb-2 pt-9 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
        <div>
          <h1 className="max-w-155 text-[42px] font-black leading-[1.05] tracking-[-0.055em] text-slate-950 sm:text-[54px] lg:text-[58px]">
            Le service devient plus simple, vos clients le ressentent immédiatement.
          </h1>

          <p className="mt-5 max-w-130 text-[19px] font-medium leading-[1.45] text-slate-600">
            Commandes plus rapides, moins d'erreurs, plus de calme, et une satisfaction qui se voit.
          </p>

          <div className="mt-5 grid gap-1.5">
            <Bullet>Le restaurant valide la commande</Bullet>
            <Bullet>Le client paie sur place</Bullet>
            <Bullet>La préparation commence</Bullet>
            <Bullet>Le client suit sa commande en temps réel</Bullet>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <a
              href="#essai"
              className="inline-flex min-h-14 min-w-48 items-center justify-center rounded-lg bg-emerald-700 px-7 text-base font-black text-white shadow-lg transition hover:bg-emerald-800"
            >
              Essayer gratuitement
            </a>

            <a
              href="#fonctionnement"
              className="inline-flex min-h-14 min-w-40 items-center justify-center rounded-lg border border-emerald-700 bg-white px-7 text-base font-black text-emerald-700 transition hover:bg-emerald-50"
            >
              Voir la démo
            </a>
          </div>
        </div>

        <DashboardMockup />
      </section>

      <section className="mx-auto grid w-full max-w-265 gap-5 px-5 py-5 md:grid-cols-3">
        {[
          ["0 commission", "Aucun frais sur vos ventes."],
          ["Paiement au comptoir ou auprès du serveur", "Le client règle sur place."],
          ["Préparation après validation et règlement", "Vous gardez le contrôle."],
        ].map(([title, text]) => (
          <div key={title} className="flex items-center gap-4 border-slate-200 md:border-r md:last:border-r-0">
            <span className="grid size-10 place-items-center rounded-full border border-emerald-700 text-emerald-700">
              <CircleCheck className="size-6" />
            </span>
            <div>
              <p className="text-base font-black text-slate-950">{title}</p>
              <p className="text-sm font-bold text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-5">
        <h2 className="mb-6 text-center text-[28px] font-black tracking-[-0.03em] text-slate-950">
          Pourquoi ça change vraiment le quotidien
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefitCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.03)]">
                <div className="mb-4 grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <Icon className="size-9" />
                </div>
                <h3 className="text-xl font-black leading-tight text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{card.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="fonctionnement" className="mx-auto w-full max-w-265 px-5 py-5">
        <h2 className="mb-8 text-center text-[30px] font-black tracking-[-0.035em] text-slate-950">
          Un parcours clair du scan à la préparation
        </h2>

        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-6">
          {journeySteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="relative text-center">
                {index < journeySteps.length - 1 ? (
                  <div className="absolute left-2/3 top-8 hidden w-4/5 border-t-2 border-dotted border-emerald-700/45 lg:block" />
                ) : null}

                <div className="relative mx-auto grid size-18 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <Icon className="size-9" />
                </div>

                <div className="mx-auto mt-3 grid size-6 place-items-center rounded-full bg-emerald-700 text-xs font-black text-white">
                  {index + 1}
                </div>

                <h3 className="mt-3 text-sm font-black text-slate-950">{step.title}</h3>
                <p className="mx-auto mt-1 max-w-36 text-xs font-semibold leading-relaxed text-slate-600">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="fonctionnalites" className="mx-auto w-full max-w-265 px-5 py-6">
        <h2 className="mb-6 text-center text-[28px] font-black tracking-[-0.03em] text-slate-950">
          Tout ce qu'il vous faut, réuni en un seul outil
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="flex gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.03)]">
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <Icon className="size-9" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">{card.title}</h3>
                  <ul className="mt-2 grid gap-1">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                        <CircleCheck className="mt-0.5 size-3.5 shrink-0 fill-emerald-700 text-white" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-3">
        <div className="grid gap-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 md:grid-cols-[0.9fr_1.4fr_0.8fr] md:items-center">
          <div className="flex items-center gap-5">
            <ShieldCheck className="size-20 text-emerald-700" />
            <h2 className="text-3xl font-black leading-tight tracking-tight text-emerald-700">
              Moins de pertes, plus de sérénité
            </h2>
          </div>

          <div>
            <p className="text-lg font-black leading-snug text-emerald-700">
              Le paiement n'est encaissé qu'après validation de votre part et avant le début de la préparation.
            </p>
            <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600 sm:grid-cols-3">
              <p className="flex items-center gap-2">
                <CircleCheck className="size-4 fill-emerald-700 text-white" />
                Moins de fausses commandes
              </p>
              <p className="flex items-center gap-2">
                <CircleCheck className="size-4 fill-emerald-700 text-white" />
                Moins d'annulations
              </p>
              <p className="flex items-center gap-2">
                <CircleCheck className="size-4 fill-emerald-700 text-white" />
                Moins de gaspillage
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-emerald-700">
            <QrCode className="size-12" />
            <ArrowRight className="size-6" />
            <CreditCard className="size-12" />
            <ArrowRight className="size-6" />
            <ChefHat className="size-14" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-3">
        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white md:grid-cols-[1fr_auto_1fr]">
          <div className="bg-red-50 p-6">
            <h3 className="text-lg font-black text-red-600">Avant Table Flash</h3>
            <ul className="mt-4 grid gap-2">
              {beforeItems.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-950">
                  <CircleX className="size-4 fill-red-500 text-white" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid place-items-center border-x border-slate-200 px-5">
            <span className="grid size-14 place-items-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-sm">
              <ArrowRight className="size-7" />
            </span>
          </div>

          <div className="bg-emerald-50 p-6">
            <h3 className="text-lg font-black text-emerald-700">Après Table Flash</h3>
            <ul className="mt-4 grid gap-2">
              {afterItems.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-950">
                  <CircleCheck className="size-4 fill-emerald-700 text-white" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-3">
        <div className="grid gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.03)] md:grid-cols-[auto_1fr_auto_auto] md:items-center">
          <div className="size-24 overflow-hidden rounded-full bg-linear-to-br from-emerald-100 to-slate-200">
            <div className="grid h-full place-items-center text-[42px] font-black text-emerald-700">J</div>
          </div>

          <div>
            <p className="text-lg font-black leading-relaxed text-slate-950">
              « Table Flash a tout changé pour nous. Moins d'attente, moins d'erreurs, et surtout des clients plus
              satisfaits. L'équipe est plus sereine et on vend plus. »
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-700">Julien M., Gérant du Bistrot des Halles (Paris 1er)</p>
            <a href="#ressources" className="mt-2 inline-flex items-center gap-2 text-sm font-black text-emerald-700">
              Lire l'histoire complète
              <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="border-slate-200 px-8 text-center md:border-l">
            <p className="text-4xl font-black text-emerald-700">+28%</p>
            <p className="text-sm font-bold text-slate-500">de chiffre d'affaires</p>
          </div>

          <div className="border-slate-200 px-8 text-center md:border-l">
            <p className="text-4xl font-black text-emerald-700">4,8/5</p>
            <p className="text-sm font-bold text-slate-500">note moyenne</p>
          </div>
        </div>
      </section>

      <section id="essai" className="mx-auto w-full max-w-265 px-5 py-3">
        <div className="grid gap-6 rounded-xl bg-emerald-700 p-8 text-white shadow-[0_18px_40px_rgba(0,107,70,0.24)] md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="grid size-20 place-items-center rounded-full bg-white/10">
            <Store className="size-10" />
          </div>

          <div>
            <h2 className="text-3xl font-black leading-tight tracking-tight">
              Prêt à simplifier votre service et à booster votre activité ?
            </h2>
            <p className="mt-2 text-sm font-semibold text-emerald-50">
              Rejoignez des centaines de restaurateurs qui font confiance à Table Flash.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <a
              href="mailto:contact@tableflash.fr?subject=Demande%20d%27essai%20TableFlash"
              className="grid min-h-16 min-w-48 place-items-center rounded-lg bg-white px-6 text-center text-sm font-black text-emerald-700"
            >
              Essayer gratuitement
              <span className="block text-xs font-bold text-slate-500">30 jours d'essai gratuit</span>
            </a>

            <a
              href="#fonctionnement"
              className="grid min-h-16 min-w-48 place-items-center rounded-lg border border-white/50 px-6 text-center text-sm font-black text-white"
            >
              Voir la démo
              <span className="block text-xs font-bold text-emerald-100">Présentation personnalisée</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer id="ressources" className="mx-auto w-full max-w-265 px-5 pb-8 pt-2">
      <div className="grid gap-8 border-t border-slate-100 pt-6 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-2xl font-black tracking-tight text-slate-950">Table Flash</span>
          </div>
          <p className="mt-3 max-w-44 text-sm font-semibold leading-relaxed text-slate-500">
            La commande à table simple, rapide et sans contact.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="mb-3 text-sm font-black text-slate-950">{column.title}</h3>
            <ul className="grid gap-2">
              {column.links.map((link) => (
                <li key={link} className="text-sm font-semibold text-slate-500">
                  {link}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="pt-8 text-center text-sm font-semibold text-slate-500">© 2026 Table Flash - Tous droits réservés</p>
    </footer>
  );
}

export default function SitePage() {
  return <HomePage />;
}


