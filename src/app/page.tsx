import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  QrCode,
  ReceiptText,
  Smartphone,
  Star,
  Utensils,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR par table",
    text: "Générez des QR propres pour chaque table, prêts à imprimer en format A6.",
  },
  {
    icon: Utensils,
    title: "Menu digital",
    text: "Ajoutez catégories, produits, prix, descriptions et photos depuis un dashboard simple.",
  },
  {
    icon: ReceiptText,
    title: "Commandes à table",
    text: "Les clients commandent depuis leur téléphone, sans application à installer.",
  },
  {
    icon: Clock,
    title: "Suivi en direct",
    text: "Le restaurateur change les statuts et le client suit l’avancement de sa commande.",
  },
  {
    icon: Star,
    title: "Avis clients",
    text: "Collectez les avis après le service et répondez depuis votre espace restaurateur.",
  },
  {
    icon: BarChart3,
    title: "Statistiques utiles",
    text: "Gardez une vision claire sur les commandes, les scans QR et l’activité du restaurant.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "29 €",
    description: "Pour lancer un menu QR simple avec commandes.",
    items: ["Menu digital", "QR par table", "Commandes à table", "Support standard"],
  },
  {
    name: "Pro",
    price: "59 €",
    description: "Pour les restaurants qui veulent suivre commandes, avis et activité.",
    items: ["Tout Starter", "Avis clients", "Statistiques", "QR imprimables A6"],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "89 €",
    description: "Pour aller plus loin avec accompagnement et mise en place prioritaire.",
    items: ["Tout Pro", "Aide à l’installation", "Priorité support", "Accompagnement menu"],
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#f8faf9] text-slate-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-2xl font-black tracking-tight text-emerald-900">
          TableFlash
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 sm:flex">
          <a href="#fonctionnalites" className="transition hover:text-emerald-800">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="transition hover:text-emerald-800">
            Tarifs
          </a>
          <a href="#essai" className="transition hover:text-emerald-800">
            Essai gratuit
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
        >
          Se connecter
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-14">
        <div className="grid gap-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm">
            <Smartphone className="size-4" />
            Menu QR, commandes et avis pour restaurants
          </div>

          <div className="grid gap-5">
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-6xl">
              Le QR code qui simplifie le service en salle.
            </h1>

            <p className="max-w-2xl text-xl font-semibold leading-relaxed text-slate-600">
              TableFlash aide les restaurants à afficher leur menu, recevoir les commandes à table,
              imprimer leurs QR et collecter les avis clients depuis une interface simple.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#essai"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-800 px-6 text-lg font-black text-white shadow-[0_16px_35px_rgba(6,95,70,0.22)] transition hover:bg-emerald-900"
            >
              Demander un essai gratuit
            </a>

            <a
              href="#fonctionnalites"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-emerald-900/15 bg-white px-6 text-lg font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
            >
              Voir les fonctionnalités
            </a>
          </div>

          <div className="grid gap-3 text-base font-bold text-slate-700 sm:grid-cols-3">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-700" />
              Sans application client
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-700" />
              Paiement sur place
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-700" />
              QR imprimables
            </p>
          </div>
        </div>

        <div className="rounded-4xl border border-emerald-100 bg-white p-4 shadow-[0_22px_80px_rgba(15,23,42,0.12)]">
          <div className="rounded-3xl bg-linear-to-br from-emerald-50 to-white p-5">
            <div className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
                    Table 4
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Commande client</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                  En direct
                </span>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">Client</p>
                  <p className="mt-1 text-lg font-black">Table 4 — Terrasse</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-500">Commande</p>
                  <p className="mt-1 text-lg font-black">2 produits · 24,50 €</p>
                </div>

                <div className="rounded-2xl bg-emerald-800 p-4 text-white">
                  <p className="text-sm font-bold text-emerald-100">Statut</p>
                  <p className="mt-1 text-xl font-black">En préparation</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-emerald-800">QR</p>
                <p className="text-xs font-bold text-slate-500">par table</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-emerald-800">Avis</p>
                <p className="text-xs font-bold text-slate-500">clients</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-emerald-800">Stats</p>
                <p className="text-xs font-bold text-slate-500">simples</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="mx-auto w-full max-w-6xl px-5 py-14">
        <div className="mb-8 grid gap-3">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">
            Fonctionnalités
          </p>
          <h2 className="text-4xl font-black tracking-tight">Tout ce qu’il faut pour démarrer simplement.</h2>
          <p className="max-w-2xl text-lg font-semibold leading-relaxed text-slate-600">
            TableFlash se concentre sur l’essentiel : menu, QR, commandes, avis et suivi clair.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-xl font-black">{feature.title}</h3>
                <p className="mt-3 text-base font-semibold leading-relaxed text-slate-600">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-emerald-950 py-16 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="grid gap-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">
              Pour les restaurants indépendants
            </p>
            <h2 className="text-4xl font-black tracking-tight">Moins d’attente, plus de clarté au service.</h2>
            <p className="text-lg font-semibold leading-relaxed text-emerald-50">
              Le client scanne, consulte, commande et suit sa commande. Le restaurant garde le contrôle,
              avec paiement uniquement sur place ou auprès du serveur.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Aucun téléchargement d’application pour le client",
              "QR imprimables pour chaque table ou zone",
              "Commandes centralisées côté restaurateur",
              "Avis collectés après le service",
            ].map((item) => (
              <p key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-base font-black">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-200" />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="tarifs" className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="mb-8 grid gap-3 text-center">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Tarifs</p>
          <h2 className="text-4xl font-black tracking-tight">Des offres simples pour démarrer.</h2>
          <p className="mx-auto max-w-2xl text-lg font-semibold leading-relaxed text-slate-600">
            Les tarifs pourront être ajustés selon l’accompagnement, l’installation et les besoins du restaurant.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={[
                "rounded-3xl border bg-white p-6 shadow-sm",
                plan.highlighted ? "border-emerald-700 ring-4 ring-emerald-100" : "border-emerald-100",
              ].join(" ")}
            >
              {plan.highlighted ? (
                <p className="mb-4 w-fit rounded-full bg-emerald-800 px-3 py-1 text-sm font-black text-white">
                  Recommandé
                </p>
              ) : null}

              <h3 className="text-2xl font-black">{plan.name}</h3>
              <p className="mt-2 text-base font-semibold leading-relaxed text-slate-600">{plan.description}</p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-5xl font-black">{plan.price}</span>
                <span className="pb-2 text-base font-bold text-slate-500">/mois</span>
              </div>

              <ul className="mt-6 grid gap-3">
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-3 text-base font-bold text-slate-700">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-center text-base font-bold text-emerald-900">
          Frais d’installation possibles selon la mise en place : menu, QR imprimés, chevalets et accompagnement.
        </p>
      </section>

      <section id="essai" className="mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="rounded-4xl bg-linear-to-br from-emerald-800 to-emerald-950 p-8 text-white shadow-[0_24px_80px_rgba(6,95,70,0.28)] md:p-10">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-3">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">
                Essai gratuit
              </p>
              <h2 className="text-4xl font-black tracking-tight">Envie de tester TableFlash dans votre restaurant ?</h2>
              <p className="max-w-2xl text-lg font-semibold leading-relaxed text-emerald-50">
                La prochaine étape permettra aux restaurants de demander leur essai directement en ligne.
                Pour le moment, l’accès est activé après validation.
              </p>
            </div>

            <div className="grid gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-6 text-lg font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
              >
                Accès restaurateur
              </Link>
              <p className="text-center text-sm font-bold text-emerald-100">
                Formulaire d’essai en ligne à l’étape suivante.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TableFlash. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="hover:text-emerald-800">
              Connexion
            </Link>
            <a href="#tarifs" className="hover:text-emerald-800">
              Tarifs
            </a>
            <a href="#essai" className="hover:text-emerald-800">
              Essai gratuit
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}