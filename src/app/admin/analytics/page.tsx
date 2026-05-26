import { AdminPanel, AdminShell } from "@/components/admin/AdminUI";
import { getAdminStats } from "@/lib/admin/get-admin-stats";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminAnalyticsPage() {
  await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const stats = await getAdminStats(supabase);

  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold">Analytics</h1>
      <p className="text-sm text-slate-600">Vision globale des performances de la plateforme TableFlash.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          ["Restaurants total", stats.restaurants.total.toString()],
          ["Restaurants actifs", stats.restaurants.active.toString()],
          ["Demandes en attente", stats.applications.pending.toString()],
          ["Comptes propriétaires", stats.users.restaurantOwners.toString()],
          ["CA", "À connecter"],
          ["Commandes", "À connecter"],
          ["Satisfaction", "À connecter"],
          ["Conversion", "À connecter"],
        ].map(([k, v]) => <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{k}</p><p className="text-3xl font-semibold">{v}</p></div>)}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminPanel title="Restaurants par statut">
          <ul className="space-y-1 text-sm">
            <li>Actifs: <strong>{stats.restaurants.active}</strong></li>
            <li>Essai: <strong>{stats.restaurants.trial}</strong></li>
            <li>Suspendus: <strong>{stats.restaurants.suspended}</strong></li>
            <li>Archivés: <strong>{stats.restaurants.archived}</strong></li>
          </ul>
        </AdminPanel>
        <AdminPanel title="Demandes par statut">
          <ul className="space-y-1 text-sm">
            <li>En attente: <strong>{stats.applications.pending}</strong></li>
            <li>À relancer: <strong>{stats.applications.needsFollowup}</strong></li>
            <li>Approuvées: <strong>{stats.applications.approved}</strong></li>
            <li>Rejetées: <strong>{stats.applications.rejected}</strong></li>
          </ul>
        </AdminPanel>
        <AdminPanel title="Répartition des plans">
          <ul className="space-y-1 text-sm">
            <li>Trial: <strong>{stats.plans.trial}</strong></li>
            <li>Standard: <strong>{stats.plans.standard}</strong></li>
            <li>Premium: <strong>{stats.plans.premium}</strong></li>
          </ul>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
