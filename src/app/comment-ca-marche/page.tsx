/* eslint-disable react/no-unescaped-entities */

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  HelpCircle,
  QrCode,
  Rocket,
  ShieldCheck,
  Smartphone,
  Store,
  Utensils,
  Zap,
} from "lucide-react";

const appUrl = "https://app.tableflash.fr";

const quickBenefits = [
  "Aucune application à installer",
  "Mise en route rapide",
  "Sans engagement",
];

const journeySteps = [
  {
    number: "1",
    title: "Restaurant",
    description: "Vous créez votre menu digitalisé et vos tables sont prêtes.",
    icon: Store,
  },
  {
    number: "2",
    title: "QR sur table",
    description: "Un QR code unique est placé sur chaque table.",
    icon: QrCode,
  },
  {
    number: "3",
    title: "Client scanne",
    description: "Le client scanne le QR code avec son téléphone et consulte le menu.",
    icon: Smartphone,
  },
  {
    number: "4",
    title: "Commande en direct",
    description: "Le client passe sa commande en direct depuis son téléphone.",
    icon: Utensils,
  },
  {
    number: "5",
    title: "Validation restaurant",
    description: "Vous recevez la commande et la validez depuis votre interface.",
    icon: ClipboardCheck,
  },
  {
    number: "6",
    title: "Paiement sur place",
    description: "Le client règle uniquement au comptoir ou auprès du serveur.",
    icon: CreditCard,
  },
  {
    number: "7",
    title: "Préparation & suivi",
    description: "La préparation démarre après validation. Le client suit sa commande.",
    icon: Bell,
  },
];

const detailCards = [
  {
    title: "Restaurant",
    icon: Store,
    items: [
      "Créez votre menu en quelques minutes.",
      "Ajoutez vos tables et personnalisez votre offre.",
      "Vos tables sont prêtes à être servies.",
    ],
  },
  {
    title: "QR sur table",
    icon: QrCode,
    items: [
      "Chaque table a son QR code unique.",
      "Impression simple et durable.",
      "Aucun contact nécessaire.",
    ],
  },
  {
    title: "Client scanne",
    icon: Smartphone,
    items: [
      "Le client scanne avec son smartphone.",
      "Pas d'application à installer.",
      "Accès instantané au menu.",
    ],
  },
  {
    title: "Commande en direct",
    icon: Utensils,
    items: [
      "Le client sélectionne ses produits.",
      "Les commandes arrivent en direct.",
      "Options et demandes spéciales possibles.",
    ],
  },
  {
    title: "Validation restaurant",
    icon: ClipboardCheck,
    items: [
      "Vous gardez le contrôle.",
      "Vérifiez, ajustez puis validez.",
      "Commande prête à être traitée.",
    ],
  },
  {
    title: "Paiement sur place",
    icon: CreditCard,
    items: [
      "Règlement au comptoir ou auprès du serveur.",
      "Aucun paiement traité par Table Flash.",
      "Simple, sûr et sans frais cachés.",
    ],
  },
  {
    title: "Préparation & suivi",
    icon: Bell,
    items: [
      "La préparation est lancée après validation.",
      "Le client suit sa commande en temps réel.",
      "Moins d'attente, plus de satisfaction.",
    ],
  },
];

const dashboardPoints = [
  "Commandes en temps réel",
  "Suivi des ventes et du chiffre d'affaires",
  "Menus, tables et options centralisés",
  "Statistiques et avis clients",
  "Export de rapports détaillés",
];

const finalBenefits = [
  {
    title: "Simple",
    description: "Une prise en main facile et un outil pensé pour tous les restaurateurs.",
    icon: HelpCircle,
  },
  {
    title: "Rapide",
    description: "Mise en place en quelques minutes, résultats visibles dès le premier service.",
    icon: Rocket,
  },
  {
    title: "Fiable",
    description: "Hébergement sécurisé, sauvegardes et données protégées.",
    icon: ShieldCheck,
  },
  {
    title: "Sans commission",
    description: "Contrairement à d'autres plateformes, nous ne prenons aucune commission.",
    icon: Zap,
  },
];

const footerColumns = [
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
    links: ["contact@tableflash.fr", "Facebook", "Instagram", "LinkedIn"],
  },
];

function LogoMark() {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-700 text-white shadow-sm">
      <Store className="size-5" />
    </span>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-18 w-full max-w-295 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="text-3xl font-black tracking-tight text-slate-950">Table Flash</span>
        </Link>

        <nav className="hidden items-center gap-10 text-sm font-black text-slate-950 lg:flex">
          <Link href="/fonctionnalites" className="transition hover:text-emerald-700">
            Fonctionnalités
          </Link>
          <Link href="/tarifs" className="transition hover:text-emerald-700">
            Tarifs
          </Link>
          <Link href="/comment-ca-marche" className="border-b-2 border-emerald-700 py-6 text-emerald-700">
            Comment ça marche ?
          </Link>
          <Link href="/ressources" className="transition hover:text-emerald-700">
            Ressources
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href={`${appUrl}/login`} className="hidden text-sm font-black text-emerald-700 md:block">
            Se connecter
          </Link>

          <a
            href="mailto:contact@tableflash.fr?subject=Demande%20d%27essai%20TableFlash"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
          >
            Essayer gratuitement
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-295 gap-8 px-5 pb-7 pt-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div>
        <p className="mb-4 inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-black text-emerald-700">
          Comment ça marche ?
        </p>

        <h1 className="max-w-2xl text-[40px] font-black leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-[54px]">
          Une expérience simple pour vous et vos clients
        </h1>

        <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-slate-600">
          Table Flash simplifie chaque étape, du scan à la table jusqu'au service. Vos clients commandent en toute autonomie,
          vous gardez le contrôle.
        </p>

        <div className="mt-7 flex flex-col gap-4 sm:flex-row">
          <a
            href="mailto:contact@tableflash.fr?subject=Demande%20d%27essai%20TableFlash"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-7 text-base font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800"
          >
            Essayer gratuitement
          </a>

          <Link
            href="#parcours"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-700 px-7 text-base font-black text-emerald-700 transition hover:bg-emerald-50"
          >
            Voir la démo
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {quickBenefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 text-sm font-black text-slate-700">
              <CheckCircle2 className="size-5 shrink-0 fill-emerald-700 text-white" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center justify-center lg:justify-end">
        <Image
          src="/images/tableflash-hero-mockup.png"
          alt="Table Flash sur ordinateur, mobile et chevalet QR"
          width={760}
          height={482}
          priority
          className="h-auto w-full max-w-165 object-contain"
        />
      </div>
    </section>
  );
}

function Journey() {
  return (
    <section id="parcours" className="mx-auto w-full max-w-295 px-5 py-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_10px_25px_rgba(15,23,42,0.03)]">
        <h2 className="text-center text-2xl font-black tracking-tight text-slate-950">
          Du scan à l'assiette : un parcours clair et maîtrisé
        </h2>

        <div className="mt-7 grid gap-6 lg:grid-cols-7">
          {journeySteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="relative text-center">
                {index < journeySteps.length - 1 ? (
                  <div className="absolute left-[58%] top-9 hidden h-px w-[85%] border-t border-dotted border-emerald-500 lg:block" />
                ) : null}

                <div className="relative z-10 mx-auto grid size-18 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <Icon className="size-8" />
                </div>

                <div className="relative z-10 mx-auto mt-3 grid size-6 place-items-center rounded-full bg-emerald-700 text-xs font-black text-white">
                  {step.number}
                </div>

                <h3 className="mt-3 text-sm font-black text-slate-950">{step.title}</h3>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DetailCards() {
  return (
    <section className="mx-auto w-full max-w-295 px-5 py-4">
      <div className="grid gap-4 lg:grid-cols-7">
        {detailCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <Icon className="size-6 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-950">{card.title}</h3>
              </div>

              <ul className="grid gap-2">
                {card.items.map((item) => (
                  <li key={item} className="flex gap-2 text-xs font-semibold leading-relaxed text-slate-600">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 fill-emerald-700 text-white" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SerenityBanner() {
  return (
    <section className="mx-auto w-full max-w-295 px-5 py-4">
      <div className="grid gap-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
        <ShieldCheck className="size-16 text-emerald-700" />

        <div>
          <h2 className="text-3xl font-black tracking-tight text-emerald-700">Moins de pertes, plus de sérénité</h2>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-relaxed text-slate-700">
            Le paiement n'est encaissé qu'après validation de votre part et avant le début de la préparation.
          </p>
        </div>

        <div className="grid gap-3 text-sm font-black text-slate-700 sm:grid-cols-3">
          {["Moins de fausses commandes", "Moins d'annulations", "Moins de gaspillage"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle2 className="size-5 fill-emerald-700 text-white" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardSection() {
  return (
    <section className="mx-auto w-full max-w-295 px-5 py-4">
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
        <div className="p-7">
          <h2 className="max-w-sm text-3xl font-black leading-tight tracking-tight text-slate-950">
            Ce que voit le restaurateur sur son tableau de bord
          </h2>

          <ul className="mt-5 grid gap-2">
            {dashboardPoints.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <CheckCircle2 className="size-5 fill-emerald-700 text-white" />
                {point}
              </li>
            ))}
          </ul>

          <a
            href="mailto:contact@tableflash.fr?subject=Demande%20de%20d%C3%A9mo%20TableFlash"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-700 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
          >
            Voir la démo
          </a>
        </div>

        <div className="relative flex min-h-75 items-center justify-center bg-linear-to-br from-emerald-50 to-white p-6">
          <Image
            src="/images/tableflash-hero-mockup.png"
            alt="Aperçu du tableau de bord Table Flash"
            width={720}
            height={456}
            className="h-auto w-full max-w-150 object-contain"
          />
        </div>
      </div>
    </section>
  );
}

function FinalBenefits() {
  return (
    <section className="mx-auto w-full max-w-295 px-5 py-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {finalBenefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <article key={benefit.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="size-10 text-emerald-700" />
              <h3 className="mt-3 text-lg font-black text-slate-950">{benefit.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{benefit.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="mx-auto w-full max-w-295 px-5 py-4">
      <div className="grid gap-5 rounded-xl bg-emerald-700 p-6 text-white shadow-[0_18px_40px_rgba(0,107,70,0.24)] md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="grid size-16 place-items-center rounded-full bg-white/10">
          <Store className="size-8" />
        </div>

        <div>
          <h2 className="text-3xl font-black leading-tight tracking-tight">
            Prêt à simplifier votre service et à booster votre activité ?
          </h2>
          <p className="mt-2 text-sm font-semibold text-emerald-50">
            Rejoignez des restaurateurs qui font confiance à Table Flash.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="mailto:contact@tableflash.fr?subject=Demande%20d%27essai%20TableFlash"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
          >
            Essayer gratuitement
          </a>

          <a
            href="mailto:contact@tableflash.fr?subject=Demande%20de%20d%C3%A9mo%20TableFlash"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/50 px-7 text-sm font-black text-white transition hover:bg-white/10"
          >
            Voir la démo
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto w-full max-w-295 px-5 pb-8 pt-4">
      <div className="grid gap-8 border-t border-slate-100 pt-7 md:grid-cols-[1.2fr_4fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-white">
              <Store className="size-5" />
            </span>
            <span className="text-2xl font-black tracking-tight text-slate-950">Table Flash</span>
          </Link>
          <p className="mt-4 max-w-40 text-sm font-semibold leading-relaxed text-slate-600">
            La commande à table simple, rapide et sans contact.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <p className="pt-8 text-center text-sm font-semibold text-slate-500">
        © 2026 Table Flash - Tous droits réservés
      </p>
    </footer>
  );
}

export default function CommentCaMarchePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />
      <Hero />
      <Journey />
      <DetailCards />
      <SerenityBanner />
      <DashboardSection />
      <FinalBenefits />
      <Cta />
      <Footer />
    </main>
  );
}