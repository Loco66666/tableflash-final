"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Euro, FileText, Store } from "lucide-react";
import { useState } from "react";
import { AdminPanel, AdminShell, SimpleModal } from "@/components/admin/AdminUI";

const kpis = [
  ["Restaurants actifs", "48", "+6 ce mois-ci", Store],
  ["Demandes en attente", "5", "+2 depuis hier", FileText],
  ["Essais en cours", "12", "+3 ce mois-ci", Clock3],
  ["CA mensuel", "18 650 €", "+12,4% vs mois dernier", Euro],
] as const;

const activities = [
  "Vous avez approuvé la demande de “Le Bistronome”.",
  "Nouvelle demande reçue de “Chez Marius”.",
  "Le restaurant “La Table Verte” a été activé.",
  "125 scans de QR enregistrés aujourd’hui.",
  "Un abonnement Premium a été renouvelé.",
  "Relance envoyée à deux restaurants inactifs.",
];

export default function AdminDashboardPage() {
  const [showAllActivities, setShowAllActivities] = useState(false);

  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold leading-tight">Tableau de bord</h1>
      <p className="mt-1 text-sm text-slate-700">Surveillez la performance de la plateforme et gérez votre réseau de restaurants.</p>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {kpis.map(([t, v, s, I]) => (
          <div key={t} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
            <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-600"><I className="h-4 w-4" /></div>
            <p className="text-sm text-slate-700">{t}</p><p className="text-3xl font-semibold leading-tight">{v}</p><p className="mt-1 text-sm text-emerald-600">↗ {s}</p>
          </div>
        ))}
      </div>
      <div className="mt-4"><AdminPanel title="Actions rapides"><div className="grid grid-cols-1 gap-3 md:grid-cols-3">{[["Examiner les demandes", "/admin/requests"], ["Gérer les restaurants", "/admin/restaurants"], ["Voir les analytics", "/admin/analytics"]].map(([t, h]) => <Link key={t} href={h} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50">{t}<ArrowRight className="h-4 w-4" /></Link>)}</div></AdminPanel></div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminPanel title="Dernières activités" right={<button onClick={() => setShowAllActivities(true)} className="text-sm font-medium text-emerald-600">Voir tout</button>}>
          <div className="space-y-2 text-sm text-slate-700">{activities.slice(0, 4).map((item) => <p key={item}>{item}</p>)}</div>
        </AdminPanel>
        <AdminPanel title="État de la plateforme"><div className="space-y-2 text-sm text-slate-700"><p>Restaurants actifs: <span className="font-semibold text-slate-900">48</span></p><p>En attente d’approbation: <span className="font-semibold text-slate-900">5</span></p><p>Activité QR aujourd’hui: <span className="font-semibold text-slate-900">125</span></p></div></AdminPanel>
      </div>
      {showAllActivities && <SimpleModal title="Toutes les activités" onClose={() => setShowAllActivities(false)}><div className="space-y-2 text-sm text-slate-700">{activities.map((item) => <p key={item}>{item}</p>)}</div></SimpleModal>}
    </AdminShell>
  );
}
