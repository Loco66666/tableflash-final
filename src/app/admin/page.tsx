import Link from "next/link";
import { ArrowRight, Clock3, FileText, Store, User } from "lucide-react";
import { AdminPanel, AdminShell } from "@/components/admin/AdminUI";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminStats } from "@/lib/admin/get-admin-stats";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const stats = await getAdminStats(supabase);

  const kpis = [
    ["Restaurants actifs", stats.restaurants.active.toString(), `${stats.restaurants.total} au total`, Store],
    ["Demandes en attente", stats.applications.pending.toString(), `${stats.applications.total} demandes`, FileText],
    ["Essais en cours", stats.restaurants.trial.toString(), `${stats.trialsEndingSoon.length} à surveiller`, Clock3],
    ["Comptes propriétaires", stats.users.restaurantOwners.toString(), `${stats.users.restaurantStaff} membres équipe`, User],
  ] as const;

  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold leading-tight">Tableau de bord</h1>
      <p className="mt-1 text-sm text-slate-700">Surveillez la performance de la plateforme et gérez votre réseau de restaurants.</p>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {kpis.map(([t, v, s, I]) => (
          <div key={t} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
            <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-600"><I className="h-4 w-4" /></div>
            <p className="text-sm text-slate-700">{t}</p><p className="text-3xl font-semibold leading-tight">{v}</p><p className="mt-1 text-sm text-emerald-600">{s}</p>
          </div>
        ))}
      </div>
      <div className="mt-4"><AdminPanel title="Actions rapides"><div className="grid grid-cols-1 gap-3 md:grid-cols-3">{[["Examiner les demandes", "/admin/requests"], ["Gérer les restaurants", "/admin/restaurants"], ["Voir les analytics", "/admin/analytics"]].map(([t, h]) => <Link key={t} href={h} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50">{t}<ArrowRight className="h-4 w-4" /></Link>)}</div></AdminPanel></div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminPanel title="Dernières activités">
          {stats.recentEvents.length === 0 ? (
            <p className="text-sm text-slate-700">Aucune activité récente</p>
          ) : (
            <div className="space-y-2 text-sm text-slate-700">{stats.recentEvents.map((event) => <p key={event.id}>{event.message}</p>)}</div>
          )}
        </AdminPanel>
        <AdminPanel title="Essais à surveiller">
          {stats.trialsEndingSoon.length === 0 ? (
            <p className="text-sm text-slate-700">Aucun essai à surveiller</p>
          ) : (
            <div className="space-y-2 text-sm text-slate-700">
              {stats.trialsEndingSoon.map((restaurant) => (
                <p key={restaurant.id}>{restaurant.name} · fin {new Date(restaurant.trial_ends_at ?? "").toLocaleDateString("fr-FR")}</p>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
