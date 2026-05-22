"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminRestaurants } from "@/lib/admin-data";

export default function AdminRestaurantsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous les statuts");
  const [rows, setRows] = useState(adminRestaurants);
  const filtered = useMemo(() => rows.filter((r) => (status === "Tous les statuts" || r.status === status) && `${r.name} ${r.owner} ${r.city} ${r.phone} ${r.email}`.toLowerCase().includes(query.toLowerCase())), [rows, status, query]);
  return <AdminShell><h1 className="text-3xl font-semibold">Restaurants</h1><p className="text-slate-600">Gérez votre réseau de restaurants.</p>
    <div className="rounded-3xl border border-slate-200 bg-white p-4"><div className="grid gap-3 lg:grid-cols-4"><input className="rounded-xl border px-3 py-2" placeholder="Rechercher un restaurant, propriétaire, téléphone ou email..." value={query} onChange={(e)=>setQuery(e.target.value)}/><select className="rounded-xl border px-3 py-2" value={status} onChange={(e)=>setStatus(e.target.value)}><option>Tous les statuts</option><option>Actif</option><option>Essai gratuit</option><option>Suspendu</option></select><select className="rounded-xl border px-3 py-2"><option>Toutes les villes</option></select><button className="rounded-xl border px-3 py-2" onClick={()=>{setRows(adminRestaurants);setQuery("");setStatus("Tous les statuts");}}>Réinitialiser</button></div></div>
    <div className="space-y-3">{filtered.map((r,i)=><div key={r.id} className={`rounded-2xl border bg-white p-4 ${i===0?"border-emerald-300 bg-emerald-50/30":"border-slate-200"}`}><div className="grid gap-3 xl:grid-cols-10"><div className="font-semibold">{r.name}</div><div>{r.status}</div><div>{r.owner}<div className="text-xs text-slate-500">{r.city}</div></div><div>{r.phone}<div className="text-xs text-slate-500">{r.email}</div></div><div>{r.plan}<div className="text-xs text-slate-500">{r.priceOrTrial}</div></div><div>{r.lastActivity}</div><div>{r.ordersToday}<div className="text-xs text-emerald-600">{r.ordersTrend}</div></div><div>{r.scansToday}<div className="text-xs text-emerald-600">{r.scansTrend}</div></div><div className="flex gap-2"><Link className="rounded-lg border px-2 py-1 text-sm" href={`/admin/restaurants/${r.id}`}>Voir la fiche</Link><button className="rounded-lg border px-2 py-1 text-sm" onClick={()=>setRows((prev)=>prev.map((x)=>x.id===r.id?{...x,status:x.status==="Suspendu"?"Actif":"Suspendu"}:x))}>{r.status==="Suspendu"?"Réactiver":"Suspendre"}</button></div><div>⋮</div></div></div>)}</div>
  </AdminShell>;
}
