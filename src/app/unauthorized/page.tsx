import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Accès refusé</h1>
        <p className="mt-3 text-slate-600">Vous n’avez pas les droits nécessaires pour accéder à cet espace.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">Retour à la connexion</Link>
          <Link href="/" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Retour à l’accueil</Link>
        </div>
      </section>
    </main>
  );
}
