"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { MoreVertical, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminShell, InlineToast, SimpleModal } from "@/components/admin/AdminUI";
import { reactivateRestaurant, suspendRestaurant } from "./actions";
import type { RestaurantStatus, SubscriptionPlan } from "@/lib/supabase/types";

export type AdminRestaurantRow = {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  owner_id: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  cuisine_type: string | null;
  plan: SubscriptionPlan;
  trial_ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const statusLabel: Record<RestaurantStatus, string> = {
  active: "Actif",
  trial: "Essai gratuit",
  suspended: "Suspendu",
  archived: "Archivé",
};

const planLabel: Record<SubscriptionPlan, string> = {
  trial: "Essai",
  standard: "Standard",
  premium: "Premium",
};

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("fr-FR");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStatusTone(status: RestaurantStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "trial":
      return "bg-blue-50 text-blue-700";
    case "suspended":
      return "bg-rose-50 text-rose-700";
    case "archived":
      return "bg-slate-100 text-slate-600";
  }
}

export function RestaurantsClient({ initialRows }: { initialRows: AdminRestaurantRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RestaurantStatus | "all">("all");
  const [city, setCity] = useState("all");
  const [plan, setPlan] = useState<SubscriptionPlan | "all">("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "Suspendre" | "Réactiver" } | null>(null);
  const [toast, setToast] = useState("");
  const [isPending, startTransition] = useTransition();

  const cities = useMemo(
    () => Array.from(new Set(rows.map((row) => row.city).filter((value): value is string => Boolean(value)))).sort(),
    [rows],
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((row) => row.status === "active").length;
    const trial = rows.filter((row) => row.status === "trial").length;
    const suspended = rows.filter((row) => row.status === "suspended").length;

    return { total, active, trial, suspended };
  }, [rows]);

  const filtered = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return rows.filter((restaurant) => {
      const statusMatch = status === "all" || restaurant.status === status;
      const cityMatch = city === "all" || (restaurant.city ?? "") === city;
      const planMatch = plan === "all" || restaurant.plan === plan;
      const searchBase = `${restaurant.name} ${restaurant.city ?? ""} ${restaurant.email ?? ""} ${restaurant.phone ?? ""} ${
        restaurant.cuisine_type ?? ""
      }`.toLowerCase();
      const queryMatch = !loweredQuery || searchBase.includes(loweredQuery);

      return statusMatch && cityMatch && planMatch && queryMatch;
    });
  }, [rows, query, status, city, plan]);

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setCity("all");
    setPlan("all");
  }

  function runStatusAction(restaurantId: string, action: "Suspendre" | "Réactiver") {
    startTransition(async () => {
      try {
        if (action === "Suspendre") {
          await suspendRestaurant({ restaurantId });
          setRows((previousRows) =>
            previousRows.map((row) => (row.id === restaurantId ? { ...row, status: "suspended" } : row)),
          );
        } else {
          await reactivateRestaurant({ restaurantId });
          setRows((previousRows) =>
            previousRows.map((row) => (row.id === restaurantId ? { ...row, status: "active" } : row)),
          );
        }

        setToast("Statut mis à jour");
        router.refresh();
      } finally {
        setConfirmAction(null);
        setOpenMenu(null);
        setTimeout(() => setToast(""), 2000);
      }
    });
  }

  return (
    <AdminShell>
      {toast ? <InlineToast message={toast} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Restaurants</h1>
          <p className="mt-1 text-sm text-slate-600">Gérez votre réseau de restaurants et leurs accès.</p>
        </div>

        <Link
          href="/admin/restaurants/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <Plus className="size-4" />
          Ajouter un restaurant
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="Total restaurants" value={stats.total} />
        <StatCard label="Actifs" value={stats.active} />
        <StatCard label="Essais" value={stats.trial} />
        <StatCard label="Suspendus" value={stats.suspended} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-10 w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              placeholder="Rechercher..."
            />
          </div>

          <select
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            value={status}
            onChange={(event) => setStatus(event.target.value as RestaurantStatus | "all")}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="trial">Essai gratuit</option>
            <option value="suspended">Suspendu</option>
            <option value="archived">Archivé</option>
          </select>

          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="all">Toutes les villes</option>
            {cities.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>

          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value as SubscriptionPlan | "all")}
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="all">Toutes les offres</option>
            <option value="trial">Essai</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {filtered.map((restaurant) => {
          const statusAction = restaurant.status === "suspended" ? "Réactiver" : "Suspendre";

          return (
            <article key={restaurant.id} className="relative rounded-2xl border border-slate-200 bg-white p-3">
              <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr_1.3fr_1.2fr_1fr_auto_auto_auto] xl:items-center">
                <div className="flex min-w-0 items-center gap-3 xl:border-r xl:border-slate-100 xl:pr-2">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                    {getInitials(restaurant.name)}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-950">{restaurant.name}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusTone(restaurant.status)}`}>
                      {statusLabel[restaurant.status]}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-slate-900">
                  {restaurant.city ?? "-"}
                  <p className="text-slate-500">{restaurant.cuisine_type ?? "-"}</p>
                </div>

                <div className="text-sm text-slate-900">
                  {restaurant.phone ?? "-"}
                  <p className="break-all text-slate-500">{restaurant.email ?? "-"}</p>
                </div>

                <div className="text-sm text-slate-900">
                  {planLabel[restaurant.plan]}
                  <p className="text-slate-500">Fin essai : {formatDate(restaurant.trial_ends_at)}</p>
                </div>

                <p className="text-sm text-slate-700">{formatDate(restaurant.updated_at)}</p>

                <Link
                  href={`/admin/restaurants/${restaurant.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voir la fiche
                </Link>

                <button
                  type="button"
                  onClick={() => setConfirmAction({ id: restaurant.id, action: statusAction })}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {statusAction}
                </button>

                <button
                  type="button"
                  onClick={() => setOpenMenu((currentValue) => (currentValue === restaurant.id ? null : restaurant.id))}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50"
                  aria-label={`Actions ${restaurant.name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {openMenu === restaurant.id ? (
                <div className="absolute right-3 top-14 z-20 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <Link
                    className="block rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                    href={`/admin/restaurants/${restaurant.id}`}
                  >
                    Voir la fiche
                  </Link>

                  {restaurant.email ? (
                    <a className="block rounded px-2 py-1.5 text-sm hover:bg-slate-50" href={`mailto:${restaurant.email}`}>
                      Contacter
                    </a>
                  ) : (
                    <span className="block rounded px-2 py-1.5 text-sm text-slate-400">Contacter</span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmAction({ id: restaurant.id, action: statusAction });
                      setOpenMenu(null);
                    }}
                    className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                  >
                    {statusAction}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-lg font-semibold">Aucun restaurant</p>
          <p className="text-sm text-slate-600">Aucun restaurant ne correspond aux filtres sélectionnés.</p>
          <Link
            href="/admin/restaurants/new"
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white"
          >
            <Plus className="size-4" />
            Ajouter un restaurant
          </Link>
        </div>
      ) : null}

      {confirmAction ? (
        <SimpleModal title={confirmAction.action} onClose={() => setConfirmAction(null)}>
          <p className="text-sm text-slate-700">Confirmer : {confirmAction.action.toLowerCase()} ce restaurant ?</p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => runStatusAction(confirmAction.id, confirmAction.action)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Confirmer
            </button>
          </div>
        </SimpleModal>
      ) : null}
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}