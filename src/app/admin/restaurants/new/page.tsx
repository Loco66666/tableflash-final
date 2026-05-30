import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2, KeyRound, Store, UserPlus } from "lucide-react";
import { createRestaurantWithOwner } from "@/app/admin/restaurants/actions";
import { AdminShell } from "@/components/admin/AdminUI";
import { requireRole } from "@/lib/auth/require-role";
import type { RestaurantStatus, SubscriptionPlan } from "@/lib/supabase/types";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

async function createRestaurantAction(formData: FormData) {
  "use server";

  const restaurantName = getStringValue(formData, "restaurantName");
  const ownerEmail = getStringValue(formData, "ownerEmail");
  const ownerPassword = getStringValue(formData, "ownerPassword");
  const ownerFullName = getStringValue(formData, "ownerFullName");
  const city = getStringValue(formData, "city");
  const address = getStringValue(formData, "address");
  const phone = getStringValue(formData, "phone");
  const cuisineType = getStringValue(formData, "cuisineType");
  const googleReviewUrl = getStringValue(formData, "googleReviewUrl");
  const plan = getStringValue(formData, "plan") as SubscriptionPlan;
  const status = getStringValue(formData, "status") as RestaurantStatus;
  const trialDaysRaw = Number(getStringValue(formData, "trialDays"));
  const trialDays = Number.isFinite(trialDaysRaw) && trialDaysRaw > 0 ? trialDaysRaw : 14;
  const createDefaultTables = formData.get("createDefaultTables") === "on";

  const result = await createRestaurantWithOwner({
    restaurantName,
    ownerEmail,
    ownerPassword,
    ownerFullName,
    city,
    address,
    phone,
    cuisineType,
    googleReviewUrl,
    plan,
    status,
    trialDays,
    createDefaultTables,
  });

  redirect(`/admin/restaurants/${result.restaurantId}`);
}

export default async function NewRestaurantPage() {
  await requireRole(["super_admin"]);

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/restaurants" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
            <ArrowLeft className="size-4" />
            Retour aux restaurants
          </Link>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Ajouter un restaurant</h1>
          <p className="mt-1 text-sm text-slate-600">
            Créez le compte restaurateur, le restaurant, les réglages et les premières tables en une seule étape.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          Onboarding SaaS complet
        </div>
      </div>

      <form action={createRestaurantAction} className="grid gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <Store className="size-5" />
            </span>

            <div>
              <h2 className="text-xl font-semibold text-slate-950">Restaurant</h2>
              <p className="text-sm text-slate-600">Informations visibles et utiles pour l’exploitation.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Nom du restaurant *
              <input
                name="restaurantName"
                required
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="Ex : Le Bistrot du Port"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Type de cuisine
              <input
                name="cuisineType"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="Ex : Bistrot, Sushi, Burger..."
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Ville
              <input
                name="city"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="Ex : Bayonne, France"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Téléphone
              <input
                name="phone"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="Ex : 06 12 34 56 78"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800 md:col-span-2">
              Adresse
              <input
                name="address"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="Ex : 10 rue de la Gare"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800 md:col-span-2">
              Lien Google Avis
              <input
                name="googleReviewUrl"
                type="url"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="https://..."
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-700">
              <UserPlus className="size-5" />
            </span>

            <div>
              <h2 className="text-xl font-semibold text-slate-950">Compte restaurateur</h2>
              <p className="text-sm text-slate-600">Ce compte pourra gérer uniquement son restaurant.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Nom du responsable
              <input
                name="ownerFullName"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="Ex : Marie Dupont"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Email restaurateur *
              <input
                name="ownerEmail"
                type="email"
                required
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="restaurant@email.com"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800 md:col-span-2">
              Mot de passe temporaire *
              <input
                name="ownerPassword"
                type="text"
                required
                minLength={8}
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="Minimum 8 caractères"
              />
              <span className="text-xs font-medium text-slate-500">
                Notez ce mot de passe et transmettez-le au restaurateur. Il pourra être changé plus tard.
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-amber-50 text-amber-700">
              <KeyRound className="size-5" />
            </span>

            <div>
              <h2 className="text-xl font-semibold text-slate-950">Offre et activation</h2>
              <p className="text-sm text-slate-600">Configuration commerciale initiale du restaurant.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Statut
              <select
                name="status"
                defaultValue="trial"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="trial">Essai gratuit</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Offre
              <select
                name="plan"
                defaultValue="trial"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="trial">Essai</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
              Durée essai
              <input
                name="trialDays"
                type="number"
                min={1}
                defaultValue={14}
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
            <input name="createDefaultTables" type="checkbox" defaultChecked className="mt-1 size-4 accent-emerald-700" />
            <span>
              Créer automatiquement Table 1 et Table 2
              <span className="mt-1 block text-xs font-medium text-emerald-800">
                Recommandé pour installer rapidement le restaurant et tester les QR dès la création.
              </span>
            </span>
          </label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-950">Création complète</h2>
              <p className="mt-1 text-sm text-slate-600">
                Le restaurant sera créé avec ses réglages, son compte propriétaire et ses premières tables. Les données resteront isolées par restaurant.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
                >
                  <Building2 className="size-4" />
                  Créer le restaurant
                </button>

                <Link
                  href="/admin/restaurants"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700"
                >
                  Annuler
                </Link>
              </div>
            </div>
          </div>
        </section>
      </form>
    </AdminShell>
  );
}