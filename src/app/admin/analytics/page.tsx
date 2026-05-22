import { AdminPanel, AdminShell } from "@/components/admin/AdminUI";

export default function AdminAnalyticsPage() {
  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold">Analytics</h1>
      <p className="text-sm text-slate-600">Vision globale des performances de la plateforme TableFlash.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[['Taux d’activation', '96%'], ['Restaurants actifs', '48'], ['Demandes converties', '68%'], ['CA mensuel', '18 650 €']].map(([k, v]) => <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{k}</p><p className="text-3xl font-semibold">{v}</p></div>)}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminPanel title="Activité plateforme"><p className="text-sm">Pic d’activité entre 12h et 14h avec 340 scans QR.</p></AdminPanel>
        <AdminPanel title="Top restaurants"><ul className="space-y-1 text-sm"><li>Le Bistronome</li><li>Chez Marius</li><li>La Table Verte</li></ul></AdminPanel>
        <AdminPanel title="Conversion"><p className="text-sm">Demandes → Activation: <strong>68%</strong></p></AdminPanel>
      </div>
    </AdminShell>
  );
}
