import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  HelpCircle,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";

const appUrl = "https://app.tableflash.fr";

const pains = [
  "Le client attend la carte alors que l'?quipe est d?j? prise.",
  "Le serveur fait plusieurs allers-retours pour une m?me table.",
  "Une commande peut ?tre mal comprise ou not?e trop vite.",
  "Un produit en rupture reste parfois visible trop longtemps.",
  "Les avis clients ne sont pas toujours r?cup?r?s apr?s le repas.",
];

const benefits = [
  "Sans application ? installer pour le client",
  "Paiement sur place, aupr?s de votre ?quipe",
  "QR imprimables par table ou par zone",
  "Menu modifiable ? tout moment",
];

const features = [
  {
    icon: QrCode,
    title: "QR par table",
    text: "Cr?ez des QR propres pour chaque table, terrasse, comptoir ou zone ? emporter. Les fiches sont pens?es pour l?impression A6 et les chevalets.",
  },
  {
    icon: Utensils,
    title: "Menu digital clair",
    text: "Ajoutez vos cat?gories, produits, prix, photos et disponibilit?s. Votre menu reste ? jour m?me pendant le service.",
  },
  {
    icon: ReceiptText,
    title: "Commandes ? table",
    text: "Le client scanne, consulte le menu et passe commande depuis son t?l?phone. Votre ?quipe re?oit une commande claire dans le dashboard.",
  },
  {
    icon: Clock3,
    title: "Suivi de commande",
    text: "Passez une commande en accept?e, en pr?paration, pr?te ou servie. Le client comprend o? en est sa demande.",
  },
  {
    icon: Star,
    title: "Avis clients",
    text: "Collectez les retours apr?s le service, r?pondez aux avis et gardez une trace des exp?riences clients.",
  },
  {
    icon: BarChart3,
    title: "Statistiques simples",
    text: "Suivez les scans QR, les commandes et les indicateurs utiles sans tableau compliqu? ni outil difficile ? prendre en main.",
  },
];

const steps = [
  {
    title: "On configure votre ?tablissement",
    text: "Nom, menu, tables, horaires, QR et r?glages essentiels.",
  },
  {
    title: "Vous imprimez vos QR",
    text: "Chaque table re?oit son QR clair, lisible et pret a scanner.",
  },
  {
    title: "Le client commande",
    text: "Il scanne, consulte le menu et passe commande depuis son t?l?phone.",
  },
  {
    title: "Vous gardez le contr?le",
    text: "Vous recevez la commande, changez le statut, servez et collectez l?avis.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "29 EUR",
    description: "Pour d?marrer avec un menu QR et des commandes simples.",
    items: ["Menu digital", "QR par table", "Commandes ? table", "Paiement sur place", "Support standard"],
  },
  {
    name: "Pro",
    price: "59 EUR",
    description: "Pour suivre commandes, avis clients et activit? du restaurant.",
    items: ["Tout Starter", "Avis clients", "Statistiques", "QR imprimables A6", "Reglages avanc?s"],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "89 EUR",
    description: "Pour un accompagnement plus complet lors de la mise en place.",
    items: ["Tout Pro", "Aide a l?installation", "Accompagnement menu", "Support prioritaire", "Pr?paration QR / chevalets"],
  },
];

const faqs = [
  {
    question: "Est-ce que TableFlash remplace les serveurs ?",
    answer:
      "Non. TableFlash ne remplace pas le contact humain. Il r?duit les allers-retours inutiles et aide l'?quipe ? recevoir des commandes plus claires.",
  },
  {
    question: "Les clients doivent-ils installer une application ?",
    answer: "Non. Le client scanne simplement le QR avec son t?l?phone et acc?de au menu depuis son navigateur.",
  },
  {
    question: "Le paiement se fait-il en ligne ?",
    answer:
      "Pour le moment, le paiement se fait sur place, aupr?s du serveur ou au comptoir. C?est plus simple pour d?marrer et cela garde le contact client.",
  },
  {
    question: "Peut-on modifi?r le menu facilement ?",
    answer:
      "Oui. Vous pouvez modifi?r les produits, prix, photos, disponibilit?s et cat?gories depuis votre espace restaurateur.",
  },
  {
    question: "Est-ce adapt? aux petits restaurants ?",
    answer:
      "Oui. TableFlash est pens? pour les restaurants ind?pendants qui veulent un outil simple, pas une usine ? gaz.",
  },
  {
    question: "Peut-on imprimer les QR ?",
    answer:
      "Oui. TableFlash g?n?re des fiches QR par table, pens?es pour ?tre imprim?es et plac?es sur chevalet.",
  },
];

export default function SitePage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#f7f3ea] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f7f3ea]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight text-emerald-950">
            TableFlash
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-black text-slate-600 lg:flex">
            <a href="#probl?me" className="transition hover:text-emerald-900">
              Probl?me
            </a>
            <a href="#solution" className="transition hover:text-emerald-900">
              Solution
            </a>
            <a href="#fonctionnalit?s" className="transition hover:text-emerald-900">
              Fonctionnalit?s
            </a>
            <a href="#tarifs" className="transition hover:text-emerald-900">
              Tarifs
            </a>
            <a href="#faq" className="transition hover:text-emerald-900">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`${appUrl}/login`}
              className="hidden rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-emerald-50 sm:inline-flex"
            >
              Connexion
            </Link>

            <a
              href="#essai"
              className="rounded-full bg-emerald-950 px-4 py-2 text-sm font-black text-white shadow-[0_14px_30px_rgba(6,78,59,0.22)] transition hover:bg-emerald-800"
            >
              Essai gratuit
            </a>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-20">
        <div className="absolute -left-40 top-10 -z-10 size-96 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -right-40 bottom-10 -z-10 size-96 rounded-full bg-amber-200/60 blur-3xl" />

        <div className="grid gap-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-900/10 bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm">
            <Sparkles className="size-4" />
            Menu QR Â· Commandes ? table Â· Avis clients
          </div>

          <div className="grid gap-6">
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-6xl xl:text-7xl">
              Moins d&apos;allers-retours. Des commandes plus claires. Un service plus fluide.
            </h1>

            <p className="max-w-2xl text-xl font-semibold leading-relaxed text-slate-600">
              TableFlash aide les restaurants a transformer chaque table en point de commande simple, sans remplacer le
              contact humain. Vos clients scannent, consultent le menu, commandent depuis leur t?l?phone, puis paient sur
              place aupr?s de votre ?quipe.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#essai"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-6 text-lg font-black text-white shadow-[0_18px_45px_rgba(6,78,59,0.28)] transition hover:bg-emerald-800"
            >
              Demander mon essai gratuit
              <ArrowRight className="size-5" />
            </a>

            <a
              href="#fonctionnement"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-emerald-950/10 bg-white px-6 text-lg font-black text-emerald-950 shadow-sm transition hover:bg-emerald-50"
            >
              Voir comment ca marche
            </a>
          </div>

          <div className="grid gap-3 text-base font-black text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((item) => (
              <p key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-700" />
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-4xl border border-white/70 bg-white/70 p-4 shadow-[0_24px_90px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="rounded-3xl bg-emerald-950 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">Dashboard</p>
                <h2 className="mt-1 text-2xl font-black">Commandes en direct</h2>
              </div>
              <span className="rounded-full bg-emerald-300 px-3 py-1 text-sm font-black text-emerald-950">Live</span>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-white p-4 text-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Terrasse</p>
                    <p className="mt-1 text-xl font-black">Table 8</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-800">Nouvelle</span>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-500">2 plats Â· 1 boisson Â· 42,50 EUR</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-emerald-100">Statut</p>
                <p className="mt-1 text-2xl font-black">En pr?paration</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-black">24</p>
                  <p className="text-xs font-bold text-emerald-100">scans</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-black">8</p>
                  <p className="text-xs font-bold text-emerald-100">commandes</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-2xl font-black">4.8</p>
                  <p className="text-xs font-bold text-emerald-100">avis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="probl?me" className="bg-white py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="grid gap-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Le vrai probl?me</p>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Pendant le rush, chaque minute compte.</h2>
            <p className="text-lg font-semibold leading-relaxed text-slate-600">
              Ce ne sont pas de simples details. Ce sont des moments ou le service perd du temps, de la clart? et parfois
              du chiffre d&apos;affaires.
            </p>
            <p className="rounded-3xl bg-emerald-50 p-5 text-xl font-black leading-relaxed text-emerald-950">
              TableFlash ne remplace pas votre ?quipe. Il lui enleve les allers-retours inutiles.
            </p>
          </div>

          <div className="grid gap-3">
            {pains.map((pain) => (
              <div key={pain} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-lg font-bold text-slate-700">
                {pain}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solution" className="bg-emerald-950 py-20 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 lg:grid-cols-2 lg:items-center">
          <div className="grid gap-5">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">La solution</p>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
              Un QR par table. Un menu toujours ? jour. Des commandes centralisees.
            </h2>
            <p className="text-lg font-semibold leading-relaxed text-emerald-50">
              Avec TableFlash, vos clients scannent le QR de leur table, voient votre menu, passent commande, puis suivent
              l&apos;avancement. C?t? restaurant, vous gardez la main.
            </p>
            <p className="rounded-3xl bg-white/10 p-5 text-lg font-black leading-relaxed text-white">
              Le paiement reste sur place, aupr?s de votre serveur ou au comptoir. Vous gardez le contact client,
              TableFlash simplifie seulement le parcours.
            </p>
          </div>

          <div className="grid gap-4 rounded-4xl bg-white p-5 text-slate-950">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-red-600">Avant</p>
              <ul className="mt-4 grid gap-3 text-base font-bold text-slate-700">
                <li>Les clients attendent la carte.</li>
                <li>Le serveur retourne plusieurs fois a l? table.</li>
                <li>Les produits indisponibles restent parfois visibles.</li>
                <li>Les avis clients sont rarement collectes.</li>
              </ul>
            </div>

            <div className="rounded-3xl bg-emerald-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Apres TableFlash</p>
              <ul className="mt-4 grid gap-3 text-base font-bold text-slate-800">
                <li>Le client scanne et voit le menu imm?diatement.</li>
                <li>La commande arrive clairement dans le dashboard.</li>
                <li>Le menu peut ?tre modifi? ? tout moment.</li>
                <li>Les avis sont demand?s apr?s le service.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="fonctionnalit?s" className="mx-auto w-full max-w-7xl px-5 py-20">
        <div className="mb-10 grid gap-3">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Fonctionnalit?s</p>
          <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Pas une usine ? gaz. Un outil simple pour mieux tenir le service.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="rounded-4xl border border-emerald-900/10 bg-white p-6 shadow-sm">
                <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-2xl font-black">{feature.title}</h3>
                <p className="mt-3 text-base font-semibold leading-relaxed text-slate-600">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="fonctionnement" className="bg-white py-20">
        <div className="mx-auto w-full max-w-7xl px-5">
          <div className="mb-10 grid gap-3 text-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Mise en place</p>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Comment ca marche ?</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-4xl border border-slate-100 bg-slate-50 p-6">
                <p className="mb-5 grid size-12 place-items-center rounded-2xl bg-emerald-950 text-xl font-black text-white">
                  {index + 1}
                </p>
                <h3 className="text-xl font-black">{step.title}</h3>
                <p className="mt-3 text-base font-semibold leading-relaxed text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tarifs" className="mx-auto w-full max-w-7xl px-5 py-20">
        <div className="mb-10 grid gap-3 text-center">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Tarifs</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Des prix clairs pour d?marrer.</h2>
          <p className="mx-auto max-w-2xl text-lg font-semibold leading-relaxed text-slate-600">
            Essai gratuit 14 jours. Frais d&apos;installation possibles selon le besoin : menu, QR, chevalets, param?trage
            et formation rapide.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={[
                "rounded-4xl border bg-white p-6 shadow-sm",
                plan.highlighted ? "border-emerald-700 ring-4 ring-emerald-100" : "border-emerald-900/10",
              ].join(" ")}
            >
              {plan.highlighted ? (
                <p className="mb-4 w-fit rounded-full bg-emerald-950 px-3 py-1 text-sm font-black text-white">Recommand?</p>
              ) : null}

              <h3 className="text-2xl font-black">{plan.name}</h3>
              <p className="mt-2 text-base font-semibold leading-relaxed text-slate-600">{plan.description}</p>

              <div className="mt-6 flex items-end gap-1">
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
      </section>

      <section id="essai" className="bg-emerald-950 py-20 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-4">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">Essai gratuit 14 jours</p>
            <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Testez TableFlash dans votre restaurant sans changer toute votre organisation.
            </h2>
            <p className="max-w-2xl text-lg font-semibold leading-relaxed text-emerald-50">
              Vous testez le menu QR, les commandes ? table, les avis et les QR imprimables dans des conditions r?elles.
              L&apos;acc?s est activ? apr?s validation pour garantir une installation propre.
            </p>
          </div>

          <div className="grid gap-3 rounded-4xl bg-white p-5 text-slate-950">
            <a
              href="mailto:contact@tableflash.fr?subject=Demande%20d%27essai%20TableFlash"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-6 text-lg font-black text-white transition hover:bg-emerald-800"
            >
              Demander mon essai gratuit
              <ArrowRight className="size-5" />
            </a>
            <Link
              href={`${appUrl}/login`}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-200 px-6 text-lg font-black text-slate-800 transition hover:bg-slate-50"
            >
              Acces restaurateur
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-7xl px-5 py-20">
        <div className="mb-10 grid gap-3">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Questions fr?quentes</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Les objections normales avant de tester.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-4xl border border-emerald-900/10 bg-white p-6">
              <div className="mb-4 flex items-start gap-3">
                <HelpCircle className="mt-1 size-6 shrink-0 text-emerald-700" />
                <h3 className="text-xl font-black">{faq.question}</h3>
              </div>
              <p className="text-base font-semibold leading-relaxed text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto grid w-full max-w-7xl gap-6 rounded-4xl bg-slate-950 p-8 text-white md:p-10">
          <ShieldCheck className="size-10 text-emerald-300" />
          <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Pr?t a rendre votre service plus fluide ?</h2>
          <p className="max-w-2xl text-lg font-semibold leading-relaxed text-slate-300">
            Essayez TableFlash dans votre restaurant et voyez rapidement si vos clients scannent, commandent et laissent des avis.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:contact@tableflash.fr?subject=Demande%20d%27essai%20TableFlash"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 text-lg font-black text-emerald-950 transition hover:bg-emerald-300"
            >
              Demander mon essai gratuit
              <ArrowRight className="size-5" />
            </a>
            <Link
              href={`${appUrl}/login`}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 px-6 text-lg font-black text-white transition hover:bg-white/10"
            >
              Acces restaurateur
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Â© {new Date().getFullYear()} TableFlash. Tous droits r?serv?s.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#tarifs" className="hover:text-emerald-800">
              Tarifs
            </a>
            <a href="#essai" className="hover:text-emerald-800">
              Essai gratuit
            </a>
            <Link href={`${appUrl}/login`} className="hover:text-emerald-800">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
