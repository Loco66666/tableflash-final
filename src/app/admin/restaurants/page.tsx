import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { RestaurantsClient, type AdminRestaurantRow } from "./restaurants-client";

export default async function AdminRestaurantsPage() {
  await requireRole(["super_admin"]);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("id,name,slug,status,owner_id,city,phone,email,cuisine_type,plan,trial_ends_at,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/restaurants] restaurants query failed", {
      errorCode: error.code,
      errorMessage: error.message,
    });

    throw new Error("Chargement des restaurants impossible");
  }

  const rows = (data ?? []) as AdminRestaurantRow[];

  return <RestaurantsClient initialRows={rows} />;
}