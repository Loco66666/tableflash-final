import Link from "next/link";
import { ArrowRight, Clock3, Euro, FileText, Store } from "lucide-react";
import { AdminPanel, AdminShell } from "@/components/admin/AdminUI";

const kpis = [
  ["Restaurants actifs", "48", "+6 ce mois-ci", Store],
  ["Demandes en attente", "5", "+2 depuis hier", FileText],
  ["Essais en cours", "12", "+3 ce mois-ci", Clock3],
  ["CA mensuel", "18 650 €", "+12,4% vs mois dernier", Euro],
] as const;

export default function AdminDashboardPage() {
  return <AdminShell><h1 className="text-6xl font-semibold">Tableau de bord</h1><p className="mt-2 text-3xl text-slate-600">Surveillez la performance de la plateforme et gérez votre réseau de restaurants.</p>
    <div className="mt-8 grid grid-cols-4 gap-6">{kpis.map(([t,v,s,I])=><div key={t} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 inline-flex rounded-2xl bg-emerald-100 p-4 text-emerald-600"><I className="h-9 w-9"/></div><p className="text-3xl text-slate-600">{t}</p><p className="text-6xl font-semibold leading-tight">{v}</p><p className="mt-2 text-2xl text-emerald-600">↗ {s}</p></div>)}</div>
    <AdminPanel title="Actions rapides"><div className="grid grid-cols-3 gap-4">{[["Examiner les demandes","/admin/requests"],["Gérer les restaurants","/admin/restaurants"],["Voir les analytics","/admin"]].map(([t,h])=><Link key={t} href={h} className="flex items-center justify-between rounded-2xl border border-slate-200 p-5"><p className="text-4xl font-semibold">{t}</p><ArrowRight className="h-7 w-7"/></Link>)}</div></AdminPanel>
    <div className="mt-6 grid grid-cols-2 gap-6"><AdminPanel title="Dernières activités" right={<button className="text-emerald-600 text-2xl">Voir tout</button>}><div className="space-y-4 text-2xl"><p>Vous avez approuvé la demande de “Le Bistronome”</p><p>Nouvelle demande reçue de “Chez Marius”</p><p>Le restaurant “La Table Verte” a été activé</p><p>125 scans de QR enregistrés aujourd’hui</p><p>Le restaurant “Old Café” a été bloqué</p></div></AdminPanel><AdminPanel title="État de la plateforme"><div className="space-y-3 text-2xl"><p>Restaurants actifs 48</p><p>En attente d’approbation 5</p><p>Activité QR aujourd’hui 125</p></div><div className="mt-6 grid grid-cols-3 gap-2 border-t pt-4 text-2xl"><p>Taux d’activation<br/><span className="text-5xl font-semibold">96%</span></p><p>Temps de réponse moyen<br/><span className="text-5xl font-semibold">2h 18m</span></p><p>Taux de complétion des profils<br/><span className="text-5xl font-semibold">89%</span></p></div></AdminPanel></div>
  </AdminShell>;
}
