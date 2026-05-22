import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ArrowRight, Clock3, Euro, FileText, Store } from "lucide-react";

export default function AdminDashboardPage() {
  return <AdminShell><h1 className="text-3xl font-semibold">Tableau de bord</h1><p className="text-slate-600">Surveillez la performance de la plateforme et gérez votre réseau de restaurants.</p>
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{[
      ["Restaurants actifs", "48", "+6 ce mois-ci", Store, "bg-emerald-100 text-emerald-700"],
      ["Demandes en attente", "5", "+2 depuis hier", FileText, "bg-amber-100 text-amber-700"],
      ["Essais en cours", "12", "+3 ce mois-ci", Clock3, "bg-emerald-100 text-emerald-700"],
      ["CA mensuel", "18 650 €", "+12,4% vs mois dernier", Euro, "bg-emerald-100 text-emerald-700"],
    ].map(([t,v,s,I,c])=><div key={String(t)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-3 inline-flex rounded-xl p-2 ${c}`}><I size={18}/></div><p className="text-sm text-slate-500">{String(t)}</p><p className="text-2xl font-semibold">{String(v)}</p><p className="text-sm text-emerald-600">{String(s)}</p></div>)}</section>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-4 text-lg font-semibold">Actions rapides</h2><div className="grid gap-4 md:grid-cols-3">{[["Examiner les demandes","Voir et approuver les nouvelles demandes d’inscription.","/admin/requests"],["Gérer les restaurants","Consulter, modifier ou bloquer les restaurants inscrits.","/admin/restaurants"],["Voir les analytics","Consulter les performances et les indicateurs clés de la plateforme.","/admin"]].map(([t,d,h])=><Link href={String(h)} key={String(t)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"><div><p className="font-medium">{String(t)}</p><p className="text-sm text-slate-500">{String(d)}</p></div><ArrowRight size={16} className="text-slate-400"/></Link>)}</div></section>
  </AdminShell>;
}
