import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPanel, AdminShell } from "@/components/admin/AdminUI";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { reactivateRestaurant, suspendRestaurant } from "../actions";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["super_admin"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id,name,status,plan,city,phone,email,cuisine_type,trial_ends_at,created_at")
    .eq("id", id)
    .maybeSingle();

  if (restaurantError) {
    console.error("[admin/restaurants/detail] restaurant query failed", {
      restaurantId: id,
      errorCode: restaurantError.code,
      errorMessage: restaurantError.message,
    });

    throw new Error("Chargement du restaurant impossible");
  }

  if (!restaurant) notFound();

  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select("lunch_enabled,lunch_start,lunch_end,dinner_enabled,dinner_start,dinner_end,orders_enabled,qr_enabled,reviews_enabled")
    .eq("restaurant_id", id)
    .maybeSingle();

  if (settingsError) {
    console.error("[admin/restaurants/detail] settings query failed", {
      restaurantId: id,
      errorCode: settingsError.code,
      errorMessage: settingsError.message,
    });

    throw new Error("Chargement des paramètres restaurant impossible");
  }

  const nextStatusAction =
    restaurant.status === "suspended" ? reactivateRestaurant : suspendRestaurant;

  const nextStatusLabel =
    restaurant.status === "suspended" ? "Réactiver" : "Suspendre";

  return (
    <AdminShell>
      <p className="text-sm text-slate-500">Restaurants / {restaurant.name}</p>

      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold">{restaurant.name}</p>
            <p className="text-sm text-slate-600">
              {restaurant.status} • {restaurant.plan} • Restaurant
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-lg border px-3 py-2 text-sm">
              Ouvrir le dashboard
            </Link>

            <form
              action={async () => {
                "use server";
                await nextStatusAction({ restaurantId: restaurant.id });
              }}
            >
              <button className="rounded-lg border px-3 py-2 text-sm">
                {nextStatusLabel}
              </button>
            </form>

            {restaurant.email ? (
              <a
                href={`mailto:${restaurant.email}`}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Contacter
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminPanel title="Abonnement & facturation">
          <p className="text-sm">Plan: {restaurant.plan}</p>
          <p className="text-sm">
            Fin essai:{" "}
            {restaurant.trial_ends_at
              ? new Date(restaurant.trial_ends_at).toLocaleDateString("fr-FR")
              : "-"}
          </p>
        </AdminPanel>

        <AdminPanel title="Informations opérationnelles">
          <p className="text-sm">Ville: {restaurant.city ?? "-"}</p>
          <p className="text-sm">Téléphone: {restaurant.phone ?? "-"}</p>
          <p className="text-sm">Email: {restaurant.email ?? "-"}</p>
          <p className="text-sm">Cuisine: {restaurant.cuisine_type ?? "-"}</p>
          <p className="text-sm">
            Créé le:{" "}
            {restaurant.created_at
              ? new Date(restaurant.created_at).toLocaleDateString("fr-FR")
              : "-"}
          </p>
        </AdminPanel>

        <AdminPanel title="Paramètres d'exploitation">
          <p className="text-sm">
            Service midi:{" "}
            {settings?.lunch_enabled
              ? `Oui (${settings.lunch_start ?? "-"} - ${settings.lunch_end ?? "-"})`
              : "Non"}
          </p>
          <p className="text-sm">
            Service soir:{" "}
            {settings?.dinner_enabled
              ? `Oui (${settings.dinner_start ?? "-"} - ${settings.dinner_end ?? "-"})`
              : "Non"}
          </p>
          <p className="text-sm">
            Commandes: {settings?.orders_enabled ? "Activées" : "Désactivées"}
          </p>
          <p className="text-sm">QR: {settings?.qr_enabled ? "Activé" : "Désactivé"}</p>
          <p className="text-sm">
            Avis: {settings?.reviews_enabled ? "Activés" : "Désactivés"}
          </p>
        </AdminPanel>

        <AdminPanel title="Métriques">
          <p className="text-sm text-slate-600">
            Les métriques seront connectées quand les commandes seront branchées à Supabase.
          </p>
          <p className="text-sm">CA: 0 €</p>
          <p className="text-sm">Commandes: 0</p>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}