"use client";

import Link from "next/link";
import { MoreVertical, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminShell, InlineToast, SimpleModal } from "@/components/admin/AdminUI";
import { adminRestaurants } from "@/lib/admin-data";

export default function AdminRestaurantsPage() {
  const [rows, setRows] = useState(adminRestaurants);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous les statuts");
  const [city, setCity] = useState("Toutes les villes");
  const [plan, setPlan] = useState("Tous les abonnements");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "Suspendre" | "Réactiver" } | null>(null);
  const [toast, setToast] = useState("");
  const filtered = useMemo(() => rows.filter((r) => (status === "Tous les statuts" || r.status === status) && (city === "Toutes les villes" || r.city === city) && (plan === "Tous les abonnements" || r.plan === plan) && `${r.name} ${r.owner} ${r.city}`.toLowerCase().includes(query.toLowerCase())), [rows, query, status, city, plan]);
  const cities = Array.from(new Set(rows.map((r) => r.city)));
  const plans = Array.from(new Set(rows.map((r) => r.plan)));

  return <AdminShell>
    {toast && <InlineToast message={toast} />}
    <h1 className="text-3xl font-semibold">Restaurants</h1><p className="text-sm text-slate-600">Gérez votre réseau de restaurants.</p>
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3"><div className="grid grid-cols-1 gap-2 lg:grid-cols-5"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" placeholder="Rechercher..."/></div><select className="rounded-lg border border-slate-200 px-3 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}><option>Tous les statuts</option><option>Actif</option><option>Essai gratuit</option><option>Suspendu</option></select><select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-slate-200 px-3 text-sm"><option>Toutes les villes</option>{cities.map((c) => <option key={c}>{c}</option>)}</select><select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-lg border border-slate-200 px-3 text-sm"><option>Tous les abonnements</option>{plans.map((p) => <option key={p}>{p}</option>)}</select><button onClick={() => {setQuery(""); setStatus("Tous les statuts"); setCity("Toutes les villes"); setPlan("Tous les abonnements");}} className="rounded-lg border border-slate-200 px-3 text-sm">Réinitialiser</button></div></div>
    <div className="mt-3 space-y-3">{filtered.map((r)=><div key={r.id} className="relative rounded-2xl border border-slate-200 bg-white p-3"><div className="grid grid-cols-[1.3fr_1fr_1.3fr_1.2fr_1fr_0.9fr_0.9fr_auto_auto_auto] items-center gap-2 text-sm"><div className="flex items-center gap-3 border-r border-slate-100 pr-2"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">{r.name.slice(0,2).toUpperCase()}</span><div><p className="text-lg font-semibold">{r.name}</p><span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium">{r.status}</span></div></div><div>{r.owner}<p className="text-slate-500">{r.city}</p></div><div>{r.phone}<p className="text-slate-500">{r.email}</p></div><div>{r.plan}<p className="text-slate-500">{r.priceOrTrial}</p></div><p>{r.lastActivity}</p><div><p className="text-lg font-semibold">{r.ordersToday}</p></div><div><p className="text-lg font-semibold">{r.scansToday}</p></div><Link href={`/admin/restaurants/${r.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Voir la fiche</Link><button onClick={() => setConfirmAction({ id: r.id, action: r.status === "Suspendu" ? "Réactiver" : "Suspendre" })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{r.status === "Suspendu" ? "Réactiver" : "Suspendre"}</button><button onClick={() => setOpenMenu((v) => v === r.id ? null : r.id)} className="rounded-lg border border-slate-200 p-2"><MoreVertical className="h-4 w-4"/></button></div>
      {openMenu === r.id && <div className="absolute right-3 top-14 z-20 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow"><Link className="block rounded px-2 py-1.5 text-sm hover:bg-slate-50" href={`/admin/restaurants/${r.id}`}>Voir la fiche</Link><button onClick={() => {setToast(`Contact envoyé à ${r.owner}`); setOpenMenu(null); setTimeout(() => setToast(""), 2000);}} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50">Contacter</button><button onClick={() => {setToast(`Accès réinitialisé pour ${r.name}`); setOpenMenu(null); setTimeout(() => setToast(""), 2000);}} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50">Réinitialiser l’accès</button><button onClick={() => {setConfirmAction({ id: r.id, action: r.status === "Suspendu" ? "Réactiver" : "Suspendre" }); setOpenMenu(null);}} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50">{r.status === "Suspendu" ? "Réactiver" : "Suspendre"}</button></div>}
      </div>)}</div>

    {confirmAction && <SimpleModal title={confirmAction.action} onClose={() => setConfirmAction(null)}><p className="text-sm">Confirmer: {confirmAction.action.toLowerCase()} ce restaurant ?</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => setConfirmAction(null)} className="rounded-lg border px-4 py-2 text-sm">Annuler</button><button onClick={() => {setRows((prev) => prev.map((row) => row.id !== confirmAction.id ? row : { ...row, status: confirmAction.action === "Suspendre" ? "Suspendu" : "Actif" })); setToast(`Statut mis à jour`); setConfirmAction(null); setTimeout(() => setToast(""), 2000);}} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Confirmer</button></div></SimpleModal>}
  </AdminShell>;
}
