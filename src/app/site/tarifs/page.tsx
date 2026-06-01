/* eslint-disable react/no-unescaped-entities */

import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CreditCard,
  Crown,
  Diamond,
  Headphones,
  Percent,
  Store,
} from "lucide-react";

const appUrl = "https://app.tableflash.fr";

const plans = [
  {
    name: "Essentiel",
    icon: Store,
    description: "L'essentiel pour digitaliser vos commandes.",
    price: "29 €",
    yearly: "348 € / an",
    oldYearly: "au lieu de 408 €",
    items: [
      "Jusqu'à  5 tables",
      "Commandes en direct",
      "QR code menu & commande",
      "Avis clients",
      "Statistiques de base",
      "Support par email",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    icon: Crown,
    description: "Plus de puissance pour booster votre activité.",
    price: "59 €",
    yearly: "708 € / an",
    oldYearly: "au lieu de 828 €",
    items: [
      "Jusqu'à  25 tables",
      "Commandes en direct",
      "QR code menu & commande",
      "Avis clients avancés",
      "Statistiques avancées",
      "Paiement sur place",
      "Support prioritaire",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    icon: Diamond,
    description: "Le maximum de personnalisation et d'accompagnement.",
    price: "89 €",
    yearly: "1 068 € / an",
    oldYearly: "au lieu de 1 248 €",
    items: [
      "Tables illimitées",
      "Commandes en direct",
      "QR code menu & commande",
      "Avis clients avancés",
      "Statistiques avancées",
      "Paiement sur place",
      "Personnalisation avancée",
      "Support dédié",
    ],
    highlighted: false,
  },
];

const advantages = [
  {
    icon: CalendarDays,
    title: "Annulation à  tout moment",
    text: "Sans engagement. Aucun frais caché.",
  },
  {
    icon: Cloud,
    title: "Déploiement rapide",
    text: "Votre espace prêt en quelques minutes.",
  },
  {
    icon: Headphones,
    title: "Support dédié",
    text: "Une équipe réactive 7j/7 pour vous accompagner.",
  },
  {
    icon: CreditCard,
    title: "Paiement sur place",
    text: "Règlement au comptoir ou auprès du serveur.",
  },
];

const comparisonRows = [
  ["Nombre de tables", "Jusqu'à  5", "Jusqu'à  25", "Illimitées"],
  ["Commandes en direct", "✓", "✓", "✓"],
  ["QR code menu & commande", "✓", "✓", "✓"],
  ["Avis clients", "De base", "Avancés", "Avancés"],
  ["Statistiques", "De base", "Avancées", "Avancées"],
  ["Paiement sur place", "—", "✓", "✓"],
  ["Personnalisation avancée", "—", "—", "✓"],
  ["Support", "Email", "Prioritaire", "Dédié"],
];

const faqs = [
  {
    question: "Y a-t-il un engagement ?",
    answer: "Non, nos offres sont sans engagement. Vous pouvez annuler à  tout moment.",
  },
  {
    question: "L'installation est-elle rapide ?",
    answer: "Oui, votre espace est prêt en quelques minutes. Nous vous guidons pas à  pas.",
  },
  {
    question: "Le support est-il inclus ?",
    answer: "Oui, un support réactif est inclus dans tous nos plans.",
  },
  {
    question: "Le paiement sur place est-il inclus ?",
    answer: "Oui, le client paie au comptoir ou directement auprès du serveur. Table Flash ne traite aucun paiement.",
  },
];

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
      <div className="mx-auto flex h-18 w-full max-w-295 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="text-2xl font-black tracking-tight text-slate-950">Table Flash</span>
        </Link>

        <nav className="hidden items-center gap-10 text-sm font-black text-slate-950 lg:flex">
          <Link href="/#fonctionnalites" className="transition hover:text-emerald-700">
            Fonctionnalités
          </Link>
          <Link href="/tarifs" className="border-b-2 border-emerald-700 py-7 text-emerald-700">
            Tarifs
          </Link>
          <Link href="/#fonctionnement" className="transition hover:text-emerald-700">
            Comment ça marche ?
          </Link>
          <Link href="/#ressources" className="transition hover:text-emerald-700">
            Ressources
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href={`${appUrl}/login`} className="hidden text-sm font-black text-emerald-700 md:block">
            Se connecter
          </Link>

          <a
            href="mailto:contact@tableflash.fr?subject=Demande%20d%27essai%20TableFlash"
            className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-800"
          >
            Essayer gratuitement
          </a>
        </div>
      </div>
    </header>
  );
}

function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  const Icon = plan.icon;

  return (
    <article
      className={[
        "relative rounded-2xl border bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.04)]",
        plan.highlighted ? "border-emerald-600 ring-1 ring-emerald-600" : "border-slate-200",
      ].join(" ")}
    >
      {plan.highlighted ? (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-700 px-5 py-1.5 text-sm font-black text-white">
          Le plus populaire
        </div>
      ) : null}

      <div className="mb-4 grid size-13 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="size-7" />
      </div>

      <h2 className="text-2xl font-black tracking-tight text-slate-950">{plan.name}</h2>
      <p className="mt-2 min-h-10 text-sm font-semibold leading-relaxed text-slate-600">{plan.description}</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <span className="text-4xl font-black tracking-tight text-slate-950">{plan.price}</span>
          <span className="ml-1 text-base font-black text-slate-950">/ mois</span>
        </div>

        <div className="text-right text-sm font-bold text-slate-500">
          <p>Sans engagement</p>
          <p>Essai gratuit inclus</p>
        </div>
      </div>

      <ul className="mt-5 grid gap-2.5">
        {plan.items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm font-black text-slate-800">
            <CheckCircle2 className="size-5 shrink-0 fill-emerald-700 text-white" />
            {item}
          </li>
        ))}
      </ul>

      <a
        href="mailto:contact@tableflash.fr?subject=Demande%20d%27essai%20TableFlash"
        className={[
          "mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-lg border text-base font-black transition",
          plan.highlighted
            ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
            : "border-emerald-700 bg-white text-emerald-700 hover:bg-emerald-50",
        ].join(" ")}
      >
        Essayer gratuitement
      </a>

      <p className="mt-4 text-center text-sm font-bold text-slate-500">30 jours d'essai gratuit</p>
    </article>
  );
}

function Footer() {
  return (
    <footer className="mx-auto w-full max-w-265 px-5 pb-8 pt-2">
      <div className="grid gap-8 border-t border-slate-100 pt-6 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="text-2xl font-black tracking-tight text-slate-950">Table Flash</span>
          </div>
          <p className="mt-3 max-w-44 text-sm font-semibold leading-relaxed text-slate-500">
            La commande à  table simple, rapide et sans contact.
          </p>
        </div>

        {[
          ["Produit", ["Fonctionnalités", "Tarifs", "Intégrations", "Mises à  jour"]],
          ["Ressources", ["Guides", "Blog", "FAQ", "Contact"]],
          ["Légal", ["Mentions légales", "Conditions générales", "Politique de confidentialité", "Cookies"]],
          ["Contact", ["contact@tableflash.fr", "Facebook  Instagram  LinkedIn"]],
        ].map(([title, links]) => (
          <div key={String(title)}>
            <h3 className="mb-3 text-sm font-black text-slate-950">{title}</h3>
            <ul className="grid gap-2">
              {(links as string[]).map((link) => (
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

export default function TarifsPage() {

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Header />

      <section className="mx-auto grid w-full max-w-265 gap-5 px-5 pb-0 pt-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-black text-emerald-700">
            Tarifs transparents
          </p>

          <h1 className="max-w-xl text-[38px] font-black leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-[50px]">
            Des tarifs transparents pour faire grandir votre activité
          </h1>

          <p className="mt-5 max-w-lg text-lg font-medium leading-relaxed text-slate-600">
            Des offres simples, sans frais cachés, conçues pour aider votre restaurant à  gagner du temps et satisfaire
            vos clients.
          </p>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row">
            <p className="flex items-center gap-3 text-lg font-black text-slate-950">
              <CheckCircle2 className="size-6 fill-emerald-700 text-white" />
              30 jours d'essai gratuit
            </p>
            <p className="flex items-center gap-3 text-lg font-black text-slate-950">
              <CheckCircle2 className="size-6 fill-emerald-700 text-white" />
              Sans engagement
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          <Image
            src="/images/tableflash-hero-mockup.png"
            alt="Table Flash sur ordinateur, mobile et chevalet QR"
            width={760}
            height={482}
            priority
            className="h-auto w-full max-w-155 object-contain"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 pb-5 pt-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-3">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.03)] md:grid-cols-4">
          {advantages.map((advantage) => {
            const Icon = advantage.icon;

            return (
              <div key={advantage.title} className="flex items-center gap-4 border-slate-200 md:border-r md:last:border-r-0">
                <Icon className="size-10 shrink-0 text-emerald-700" />
                <div>
                  <h3 className="text-base font-black text-slate-950">{advantage.title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">{advantage.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-3">
        <h2 className="mb-3 text-xl font-black tracking-tight text-slate-950">Comparez nos offres</h2>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.03)]">
          <table className="w-full min-w-190 border-collapse text-left text-sm font-semibold text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="px-5 py-3 text-sm font-black text-slate-950">Fonctionnalités</th>
                <th className="px-5 py-3 text-center text-sm font-black text-slate-950">Essentiel</th>
                <th className="bg-emerald-50 px-5 py-3 text-center text-sm font-black text-slate-950">
                  Pro <span className="rounded-full bg-emerald-700 px-2 py-1 text-xs text-white">Populaire</span>
                </th>
                <th className="px-5 py-3 text-center text-sm font-black text-slate-950">Premium</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([label, essentiel, pro, premium]) => (
                <tr key={label} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-5 py-2.5">{label}</td>
                  <td className="px-5 py-3 text-center">{essentiel}</td>
                  <td className="bg-emerald-50 px-5 py-3 text-center">{pro}</td>
                  <td className="px-5 py-3 text-center">{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-3">
        <div className="grid gap-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <Percent className="size-16 text-emerald-700" />
          <div>
            <h2 className="text-2xl font-black tracking-tight text-emerald-700">
              Zéro commission Table Flash sur vos ventes
            </h2>
            <p className="mt-2 text-base font-semibold leading-relaxed text-slate-600">
              Contrairement à  d'autres plateformes, nous ne prenons aucune commission sur vos ventes. 100 % de vos
              revenus vous appartiennent.
            </p>
          </div>
          <p className="flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 text-lg font-black text-emerald-700">
            <CheckCircle2 className="size-6 fill-emerald-700 text-white" />
            Zéro commission
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-3">
        <h2 className="mb-3 text-xl font-black tracking-tight text-slate-950">Questions fréquentes</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-black text-slate-950">{faq.question}</h3>
                <ChevronDown className="size-5 shrink-0 text-emerald-700" />
              </div>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-265 px-5 py-3">
        <div className="grid gap-5 rounded-xl bg-emerald-700 p-6 text-white shadow-[0_18px_40px_rgba(0,107,70,0.24)] md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="grid size-16 place-items-center rounded-full bg-white/10">
            <Store className="size-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black leading-tight tracking-tight">
              Prêt à  simplifier votre service et à  faire grandir votre restaurant ?
            </h2>
            <p className="mt-2 text-sm font-semibold text-emerald-50">
              Rejoignez des centaines de restaurateurs qui nous font confiance.
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
              href="mailto:contact@tableflash.fr?subject=Demande%20de%20démo%20TableFlash"
              className="grid min-h-16 min-w-48 place-items-center rounded-lg border border-white/50 px-6 text-center text-sm font-black text-white"
            >
              Demander une démo
              <span className="block text-xs font-bold text-emerald-100">Présentation personnalisée</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
