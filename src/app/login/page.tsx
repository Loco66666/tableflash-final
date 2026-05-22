"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <section className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
        <p className="mb-2 text-center text-3xl font-black text-emerald-700">TableFlash</p>
        <h1 className="text-center text-2xl font-bold text-slate-900">Connexion</h1>
        <p className="mb-6 mt-1 text-center text-sm text-slate-600">Accédez à votre espace TableFlash</p>
        {!hasSupabaseEnv && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Supabase n’est pas encore configuré.</p>}
        <form action={formAction} className="space-y-4">
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          <input name="password" type="password" required placeholder="Mot de passe" className="w-full rounded-xl border border-slate-300 px-4 py-3" />
          {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <button disabled={pending} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60">Se connecter</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">Les accès sont créés par l’équipe TableFlash.</p>
      </section>
    </main>
  );
}
