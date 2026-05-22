"use client";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminRequests } from "@/lib/admin-data";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState(adminRequests);
  const [selected, setSelected] = useState<(typeof adminRequests)[number] | null>(null);
  return <AdminShell><h1 className="text-3xl font-semibold">Demandes d’inscription</h1><p className="text-slate-600">Examinez et validez les nouvelles demandes d’inscription des restaurants.</p>
  <h2 className="text-lg font-semibold">Demandes en attente</h2>
  <div className="space-y-3">{requests.map((r)=><div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="font-semibold">{r.restaurant}</p><p className="text-sm text-slate-600">{r.owner} • {r.city} • {r.phone} • {r.email}</p><p className="text-sm text-slate-500">{r.type} • {r.source} • {r.date}</p><div className="mt-3 flex gap-2"><button onClick={()=>setSelected(r)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Examiner</button><button onClick={()=>setRequests((p)=>p.filter((x)=>x.id!==r.id))} className="rounded-lg border px-3 py-2 text-sm">Refuser</button></div></div>)}</div>
  {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6"><h3 className="text-xl font-semibold">Valider la demande</h3><p className="mt-2 rounded-xl bg-emerald-50 p-3 text-sm">Vous êtes en train de créer le compte de “{selected.restaurant}”. Un email contenant les identifiants sera envoyé au propriétaire.</p><div className="mt-4 grid gap-3"><select className="rounded-xl border px-3 py-2"><option>Essai gratuit</option><option>Standard</option><option>Premium</option></select><select className="rounded-xl border px-3 py-2"><option>7 jours</option><option>14 jours</option><option>30 jours</option></select><textarea className="rounded-xl border px-3 py-2" placeholder="Ajoutez une note interne visible uniquement par l’équipe..."/></div><div className="mt-4 flex justify-end gap-2"><button className="rounded-xl border px-4 py-2" onClick={()=>setSelected(null)}>Annuler</button><button className="rounded-xl bg-emerald-600 px-4 py-2 text-white" onClick={()=>{setRequests((p)=>p.filter((x)=>x.id!==selected.id));setSelected(null);}}>Créer le compte</button></div></div></div>}
  </AdminShell>;
}
