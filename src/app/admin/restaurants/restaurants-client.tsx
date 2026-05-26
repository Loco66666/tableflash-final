"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { MoreVertical, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminShell, InlineToast, SimpleModal } from "@/components/admin/AdminUI";
import { reactivateRestaurant, suspendRestaurant } from "./actions";
import type { RestaurantStatus, SubscriptionPlan } from "@/lib/supabase/types";

export type AdminRestaurantRow = {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  owner_id: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  cuisine_type: string | null;
  plan: SubscriptionPlan;
  trial_ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const statusLabel: Record<RestaurantStatus, string> = {
  active: "Actif",
  trial: "Essai gratuit",
  suspended: "Suspendu",
  archived: "Archivé",
};

const planLabel: Record<SubscriptionPlan, string> = {
  trial: "trial",
  standard: "standard",
  premium: "premium",
};

export function RestaurantsClient({ initialRows }: { initialRows: AdminRestaurantRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [plan, setPlan] = useState("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "Suspendre" | "Réactiver" } | null>(null);
  const [toast, setToast] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const loweredQuery = query.toLowerCase();
    return rows.filter((r) => {
      const statusMatch = status === "all" || r.status === status;
      const cityMatch = city === "all" || (r.city ?? "") === city;
      const planMatch = plan === "all" || r.plan === plan;
      const searchBase = `${r.name} ${r.city ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase();
      const queryMatch = searchBase.includes(loweredQuery);
      return statusMatch && cityMatch && planMatch && queryMatch;
    });
  }, [rows, query, status, city, plan]);

  const cities = Array.from(new Set(rows.map((r) => r.city).filter((value): value is string => Boolean(value))));

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((row) => row.status === "active").length;
    const trial = rows.filter((row) => row.status === "trial").length;
    const suspended = rows.filter((row) => row.status === "suspended").length;
    return { total, active, trial, suspended };
  }, [rows]);

  const runStatusAction = (restaurantId: string, action: "Suspendre" | "Réactiver") => {
    startTransition(async () => {
      try {
        if (action === "Suspendre") {
          await suspendRestaurant({ restaurantId });
          setRows((prev) => prev.map((row) => (row.id === restaurantId ? { ...row, status: "suspended" } : row)));
        } else {
          await reactivateRestaurant({ restaurantId });
          setRows((prev) => prev.map((row) => (row.id === restaurantId ? { ...row, status: "active" } : row)));
        }
        setToast("Statut mis à jour");
        router.refresh();
      } finally {
        setConfirmAction(null);
        setTimeout(() => setToast(""), 2000);
      }
    });
  };

  return <AdminShell>
    {toast && <InlineToast message={toast} />}
    <h1 className="text-3xl font-semibold">Restaurants</h1><p className="text-sm text-slate-600">Gérez votre réseau de restaurants.</p>

    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Total restaurants</p><p className="text-2xl font-semibold">{stats.total}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Actifs</p><p className="text-2xl font-semibold">{stats.active}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Essais</p><p className="text-2xl font-semibold">{stats.trial}</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Suspendus</p><p className="text-2xl font-semibold">{stats.suspended}</p></div>
    </div>

    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3"><div className="grid grid-cols-1 gap-2 lg:grid-cols-5"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" placeholder="Rechercher..."/></div><select className="rounded-lg border border-slate-200 px-3 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="all">Tous les statuts</option><option value="active">Actif</option><option value="trial">Essai gratuit</option><option value="suspended">Suspendu</option><option value="archived">Archivé</option></select><select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-slate-200 px-3 text-sm"><option value="all">Toutes les villes</option>{cities.map((c) => <option key={c}>{c}</option>)}</select><select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-lg border border-slate-200 px-3 text-sm"><option value="all">Tous les abonnements</option><option value="trial">trial</option><option value="standard">standard</option><option value="premium">premium</option></select><button onClick={() => {setQuery(""); setStatus("all"); setCity("all"); setPlan("all");}} className="rounded-lg border border-slate-200 px-3 text-sm">Réinitialiser</button></div></div>

    <div className="mt-3 space-y-3">{filtered.map((r)=><div key={r.id} className="relative rounded-2xl border border-slate-200 bg-white p-3"><div className="grid grid-cols-[1.3fr_1fr_1.3fr_1.2fr_1fr_auto_auto_auto] items-center gap-2 text-sm"><div className="flex items-center gap-3 border-r border-slate-100 pr-2"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">{r.name.slice(0,2).toUpperCase()}</span><div><p className="text-lg font-semibold">{r.name}</p><span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium">{statusLabel[r.status]}</span></div></div><div>{r.city ?? "-"}<p className="text-slate-500">{r.cuisine_type ?? "-"}</p></div><div>{r.phone ?? "-"}<p className="text-slate-500">{r.email ?? "-"}</p></div><div>{planLabel[r.plan]}<p className="text-slate-500">Fin essai: {r.trial_ends_at ? new Date(r.trial_ends_at).toLocaleDateString("fr-FR") : "-"}</p></div><p>{r.updated_at ? new Date(r.updated_at).toLocaleDateString("fr-FR") : "-"}</p><Link href={`/admin/restaurants/${r.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Voir la fiche</Link><button onClick={() => setConfirmAction({ id: r.id, action: r.status === "suspended" ? "Réactiver" : "Suspendre" })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{r.status === "suspended" ? "Réactiver" : "Suspendre"}</button><button onClick={() => setOpenMenu((v) => v === r.id ? null : r.id)} className="rounded-lg border border-slate-200 p-2"><MoreVertical className="h-4 w-4"/></button></div>
      {openMenu === r.id && <div className="absolute right-3 top-14 z-20 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow"><Link className="block rounded px-2 py-1.5 text-sm hover:bg-slate-50" href={`/admin/restaurants/${r.id}`}>Voir la fiche</Link>{r.email ? <a className="block rounded px-2 py-1.5 text-sm hover:bg-slate-50" href={`mailto:${r.email}`}>Contacter</a> : <span className="block rounded px-2 py-1.5 text-sm text-slate-400">Contacter</span>}<button onClick={() => {setConfirmAction({ id: r.id, action: r.status === "suspended" ? "Réactiver" : "Suspendre" }); setOpenMenu(null);}} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50">{r.status === "suspended" ? "Réactiver" : "Suspendre"}</button></div>}
      </div>)}</div>

    {filtered.length === 0 && <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center"><p className="text-lg font-semibold">Aucun restaurant</p><p className="text-sm text-slate-600">Les restaurants validés depuis les demandes apparaîtront ici.</p></div>}

    {confirmAction && <SimpleModal title={confirmAction.action} onClose={() => setConfirmAction(null)}><p className="text-sm">Confirmer: {confirmAction.action.toLowerCase()} ce restaurant ?</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => setConfirmAction(null)} className="rounded-lg border px-4 py-2 text-sm">Annuler</button><button disabled={isPending} onClick={() => runStatusAction(confirmAction.id, confirmAction.action)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50">Confirmer</button></div></SimpleModal>}
  </AdminShell>;
}
