import Link from "next/link";

export default function SitePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-5 text-white">
      <section className="mx-auto grid max-w-3xl gap-6 text-center">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-300">
          TableFlash
        </p>

        <h1 className="text-5xl font-black tracking-tight sm:text-6xl">
          Site public en préparation.
        </h1>

        <p className="text-xl font-semibold leading-relaxed text-slate-300">
          Le site vitrine TableFlash arrive ici. L’application restaurateur reste accessible sur app.tableflash.fr.
        </p>

        <Link
          href="https://app.tableflash.fr/login"
          className="mx-auto inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-400 px-6 text-lg font-black text-emerald-950 transition hover:bg-emerald-300"
        >
          Accès restaurateur
        </Link>
      </section>
    </main>
  );
}