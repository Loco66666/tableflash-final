import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShoppingBag,
  Star,
  Store,
  UserRound,
} from "lucide-react";
import { AdminPanel, AdminShell } from "@/components/admin/AdminUI";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { reactivateRestaurant, suspendRestaurant } from "../actions";
import type { RestaurantStatus, SubscriptionPlan } from "@/lib/supabase/types";

type RestaurantDetail = {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  owner_id: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  cuisine_type: string | null;
  plan: SubscriptionPlan;
  trial_ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type OwnerProfile = {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RestaurantSettings = {
  lunch_enabled: boolean | null;
  lunch_start: string | null;
  lunch_end: string | null;
  dinner_enabled: boolean | null;
  dinner_start: string | null;
  dinner_end: string | null;
  orders_enabled: boolean | null;
  qr_enabled: boolean | null;
  reviews_enabled: boolean | null;
};

type RestaurantOrder = {
  id: string;
  status: string | null;
  payment_status: string | null;
  total: number | string | null;
  created_at: string | null;
};

type RestaurantReview = {
  id: string;
  rating: number | null;
  status: string | null;
  created_at: string | null;
};

type RestaurantTable = {
  id: string;
  name: string | null;
  slug: string | null;
  is_active: boolean | null;
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

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "-";

  return value.slice(0, 5);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function toNumber(value: number | string | null) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getStatusTone(status: RestaurantStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "trial":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "suspended":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "archived":
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function getSettingLabel(value: boolean | null) {
  return value ? "Activé" : "Désactivé";
}

function getSettingTone(value: boolean | null) {
  return value ? "text-emerald-700 bg-emerald-50" : "text-slate-500 bg-slate-100";
}

function countOrdersByStatus(orders: RestaurantOrder[], status: string) {
  return orders.filter((order) => order.status === status).length;
}

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
    .select("id,name,slug,status,owner_id,city,address,phone,email,cuisine_type,plan,trial_ends_at,created_at,updated_at")
    .eq("id", id)
    .maybeSingle<RestaurantDetail>();

  if (restaurantError) {
    console.error("[admin/restaurants/detail] restaurant query failed", {
      restaurantId: id,
      errorCode: restaurantError.code,
      errorMessage: restaurantError.message,
    });

    throw new Error("Chargement du restaurant impossible.");
  }

  if (!restaurant) {
    notFound();
  }

  const [
    { data: ownerProfile, error: ownerError },
    { data: settings, error: settingsError },
    { data: orders, error: ordersError },
    { data: reviews, error: reviewsError },
    { data: tables, error: tablesError },
  ] = await Promise.all([
    restaurant.owner_id
      ? supabase
          .from("profiles")
          .select("id,email,role,created_at,updated_at")
          .eq("id", restaurant.owner_id)
          .maybeSingle<OwnerProfile>()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("restaurant_settings")
      .select("lunch_enabled,lunch_start,lunch_end,dinner_enabled,dinner_start,dinner_end,orders_enabled,qr_enabled,reviews_enabled")
      .eq("restaurant_id", id)
      .maybeSingle<RestaurantSettings>(),
    supabase
      .from("orders")
      .select("id,status,payment_status,total,created_at")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<RestaurantOrder[]>(),
    supabase
      .from("restaurant_reviews")
      .select("id,rating,status,created_at")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<RestaurantReview[]>(),
    supabase
      .from("restaurant_tables")
      .select("id,name,slug,is_active")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: true })
      .returns<RestaurantTable[]>(),
  ]);

  if (ownerError) {
    console.error("[admin/restaurants/detail] owner query failed", {
      restaurantId: id,
      ownerId: restaurant.owner_id,
      errorCode: ownerError.code,
      errorMessage: ownerError.message,
    });

    throw new Error("Chargement du propriétaire impossible.");
  }

  if (settingsError) {
    console.error("[admin/restaurants/detail] settings query failed", {
      restaurantId: id,
      errorCode: settingsError.code,
      errorMessage: settingsError.message,
    });

    throw new Error("Chargement des réglages impossible.");
  }

  if (ordersError) {
    console.error("[admin/restaurants/detail] orders query failed", {
      restaurantId: id,
      errorCode: ordersError.code,
      errorMessage: ordersError.message,
    });

    throw new Error("Chargement des commandes impossible.");
  }

  if (reviewsError) {
    console.error("[admin/restaurants/detail] reviews query failed", {
      restaurantId: id,
      errorCode: reviewsError.code,
      errorMessage: reviewsError.message,
    });

    throw new Error("Chargement des avis impossible.");
  }

  if (tablesError) {
    console.error("[admin/restaurants/detail] tables query failed", {
      restaurantId: id,
      errorCode: tablesError.code,
      errorMessage: tablesError.message,
    });

    throw new Error("Chargement des tables impossible.");
  }

  async function suspendAction() {
    "use server";

    await suspendRestaurant({ restaurantId: id });
  }

  async function reactivateAction() {
    "use server";

    await reactivateRestaurant({ restaurantId: id });
  }

  const safeOrders = orders ?? [];
  const safeReviews = reviews ?? [];
  const safeTables = tables ?? [];

  const completedOrders = safeOrders.filter((order) => order.status === "served");
  const refusedOrders = safeOrders.filter((order) => order.status === "rejected" || order.status === "cancelled");
  const revenue = safeOrders
    .filter((order) => order.status !== "rejected" && order.status !== "cancelled")
    .reduce((sum, order) => sum + toNumber(order.total), 0);

  const positiveReviews = safeReviews.filter((review) => (review.rating ?? 0) >= 4).length;
  const averageRating =
    safeReviews.length > 0
      ? safeReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / safeReviews.length
      : 0;

  const activeTables = safeTables.filter((table) => table.is_active).length;
  const firstActiveTable = safeTables.find((table) => table.is_active && table.slug);
  const publicRestaurantUrl = firstActiveTable ? `/r/${restaurant.slug}/table/${firstActiveTable.slug}` : null;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/restaurants"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="size-4" />
            Retour aux restaurants
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-emerald-100 text-lg font-black text-emerald-700">
              {restaurant.name.slice(0, 2).toUpperCase()}
            </span>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{restaurant.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${getStatusTone(restaurant.status)}`}>
                  {statusLabel[restaurant.status]}
                </span>
                <span>{planLabel[restaurant.plan]}</span>
                <span>•</span>
                <span>{restaurant.slug}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {publicRestaurantUrl ? (
            <Link
              href={publicRestaurantUrl}
              target="_blank"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="size-4" />
              Ouvrir le menu client
            </Link>
          ) : (
            <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-400">
              Aucune table active
            </span>
          )}

          {restaurant.email ? (
            <a
              href={`mailto:${restaurant.email}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Mail className="size-4" />
              Contacter
            </a>
          ) : null}

          {restaurant.status === "suspended" ? (
            <form action={reactivateAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Réactiver
              </button>
            </form>
          ) : (
            <form action={suspendAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700"
              >
                Suspendre
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ShoppingBag} label="Commandes" value={safeOrders.length.toString()} detail={`${completedOrders.length} terminées`} />
        <MetricCard icon={CreditCard} label="Chiffre d’affaires estimé" value={formatMoney(revenue)} detail="Hors commandes refusées" />
        <MetricCard icon={QrCode} label="Tables QR" value={safeTables.length.toString()} detail={`${activeTables} actives`} />
        <MetricCard
          icon={Star}
          label="Avis clients"
          value={safeReviews.length > 0 ? `${averageRating.toFixed(1)}/5` : "0/5"}
          detail={`${positiveReviews} avis positifs`}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <AdminPanel title="Informations restaurant">
          <div className="grid gap-3 text-sm">
            <InfoLine icon={Store} label="Nom" value={restaurant.name} />
            <InfoLine icon={MapPin} label="Adresse" value={restaurant.address ?? "-"} />
            <InfoLine icon={MapPin} label="Ville" value={restaurant.city ?? "-"} />
            <InfoLine icon={Phone} label="Téléphone" value={restaurant.phone ?? "-"} />
            <InfoLine icon={Mail} label="Email restaurant" value={restaurant.email ?? "-"} />
            <InfoLine icon={Store} label="Cuisine" value={restaurant.cuisine_type ?? "-"} />
          </div>
        </AdminPanel>

        <AdminPanel title="Compte restaurateur">
          <div className="grid gap-3 text-sm">
            <InfoLine icon={UserRound} label="Owner ID" value={restaurant.owner_id ?? "-"} />
            <InfoLine icon={Mail} label="Email du compte" value={ownerProfile?.email ?? restaurant.email ?? "-"} />
            <InfoLine icon={UserRound} label="Rôle" value={ownerProfile?.role ?? "-"} />
            <InfoLine icon={CalendarDays} label="Compte créé le" value={formatDateTime(ownerProfile?.created_at ?? null)} />
            <InfoLine icon={CalendarDays} label="Profil mis à jour le" value={formatDateTime(ownerProfile?.updated_at ?? null)} />
          </div>

          <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-medium leading-relaxed text-emerald-900">
            Ce compte doit accéder uniquement à son restaurant. Il ne doit jamais voir l’espace admin ni les données d’un autre établissement.
          </p>
        </AdminPanel>

        <AdminPanel title="Offre et statut">
          <div className="grid gap-3 text-sm">
            <InfoLine icon={CreditCard} label="Offre" value={planLabel[restaurant.plan]} />
            <InfoLine icon={CalendarDays} label="Fin d’essai" value={formatDate(restaurant.trial_ends_at)} />
            <InfoLine icon={CalendarDays} label="Créé le" value={formatDateTime(restaurant.created_at)} />
            <InfoLine icon={CalendarDays} label="Mis à jour le" value={formatDateTime(restaurant.updated_at)} />
          </div>
        </AdminPanel>

        <AdminPanel title="Réglages service">
          <div className="grid gap-3 text-sm">
            <SettingLine label="Commandes QR" value={settings?.orders_enabled ?? false} />
            <SettingLine label="QR actifs" value={settings?.qr_enabled ?? false} />
            <SettingLine label="Avis après repas" value={settings?.reviews_enabled ?? false} />

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 font-semibold text-slate-950">
                <Clock3 className="size-4 text-slate-500" />
                Service midi
              </div>
              <p className="mt-1 text-slate-600">
                {settings?.lunch_enabled
                  ? `${formatTime(settings.lunch_start)} - ${formatTime(settings.lunch_end)}`
                  : "Désactivé"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 font-semibold text-slate-950">
                <Clock3 className="size-4 text-slate-500" />
                Service soir
              </div>
              <p className="mt-1 text-slate-600">
                {settings?.dinner_enabled
                  ? `${formatTime(settings.dinner_start)} - ${formatTime(settings.dinner_end)}`
                  : "Désactivé"}
              </p>
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <AdminPanel title="Activité commandes">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniStat label="À traiter" value={countOrdersByStatus(safeOrders, "pending")} />
            <MiniStat label="Acceptées" value={countOrdersByStatus(safeOrders, "accepted")} />
            <MiniStat label="Payées" value={countOrdersByStatus(safeOrders, "paid")} />
            <MiniStat label="En préparation" value={countOrdersByStatus(safeOrders, "preparing")} />
            <MiniStat label="Prêtes" value={countOrdersByStatus(safeOrders, "ready")} />
            <MiniStat label="Refusées / annulées" value={refusedOrders.length} />
          </div>
        </AdminPanel>

        <AdminPanel title="Contrôle avant installation">
          <div className="grid gap-2 text-sm text-slate-700">
            <ChecklistLine checked={Boolean(restaurant.owner_id)} label="Compte restaurateur rattaché" />
            <ChecklistLine checked={Boolean(settings)} label="Réglages restaurant créés" />
            <ChecklistLine checked={safeTables.length > 0} label="Au moins une table QR créée" />
            <ChecklistLine checked={settings?.orders_enabled === true} label="Commandes QR activées" />
            <ChecklistLine checked={settings?.qr_enabled === true} label="QR activés" />
            <ChecklistLine checked={restaurant.status !== "suspended"} label="Restaurant non suspendu" />
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 font-semibold text-slate-950">
        <Icon className="size-4 text-slate-500" />
        {label}
      </div>
      <p className="mt-1 wrap-break-word text-slate-600">{value}</p>
    </div>
  );
}

function SettingLine({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <span className="font-semibold text-slate-950">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getSettingTone(value)}`}>{getSettingLabel(value)}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ChecklistLine({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <span className="font-medium">{label}</span>
      <span
        className={
          checked
            ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
            : "rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"
        }
      >
        {checked ? "OK" : "À vérifier"}
      </span>
    </div>
  );
}