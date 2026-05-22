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
  return (
    <AdminShell>
      <h1 className="text-[56px] font-semibold leading-tight">Tableau de bord</h1>
      <p className="mt-1 text-[42px] text-slate-700">Surveillez la performance de la plateforme et gérez votre réseau de restaurants.</p>
      <div className="mt-5 grid grid-cols-4 gap-4">
        {kpis.map(([t, v, s, I]) => (
          <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-600"><I className="h-5 w-5" /></div>
            <p className="text-[41px] text-slate-700">{t}</p>
            <p className="text-6xl font-semibold leading-tight">{v}</p>
            <p className="mt-1 text-[36px] text-emerald-600">↗ {s}</p>
          </div>
        ))}
      </div>

      <div className="mt-4"><AdminPanel title="Actions rapides"><div className="grid grid-cols-3 gap-3">{[["Examiner les demandes", "/admin/requests"], ["Gérer les restaurants", "/admin/restaurants"], ["Voir les analytics", "/admin"]].map(([t, h]) => <Link key={t} href={h} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-5xl font-semibold">{t}<ArrowRight className="h-5 w-5" /></Link>)}</div></AdminPanel></div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <AdminPanel title="Dernières activités" right={<button className="text-[34px] text-emerald-600">Voir tout</button>}>
          <div className="space-y-3 text-[36px] text-slate-700">
            <p>Vous avez approuvé la demande de “Le Bistronome”</p>
            <p>Nouvelle demande reçue de “Chez Marius”</p>
            <p>Le restaurant “La Table Verte” a été activé</p>
            <p>125 scans de QR enregistrés aujourd’hui</p>
          </div>
        </AdminPanel>
        <AdminPanel title="État de la plateforme">
          <div className="space-y-3 text-[36px] text-slate-700">
            <p>Restaurants actifs: <span className="font-semibold text-slate-900">48</span></p>
            <p>En attente d’approbation: <span className="font-semibold text-slate-900">5</span></p>
            <p>Activité QR aujourd’hui: <span className="font-semibold text-slate-900">125</span></p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
            <p className="text-[32px] text-slate-600">Taux d’activation<br /><span className="text-5xl font-semibold text-slate-900">96%</span></p>
            <p className="text-[32px] text-slate-600">Temps de réponse moyen<br /><span className="text-5xl font-semibold text-slate-900">2h 18m</span></p>
            <p className="text-[32px] text-slate-600">Profils complets<br /><span className="text-5xl font-semibold text-slate-900">89%</span></p>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
