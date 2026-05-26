import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { RestaurantsClient, type AdminRestaurantRow } from "./restaurants-client";

export default async function AdminRestaurantsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("restaurants")
    .select("id,name,slug,status,owner_id,city,phone,email,cuisine_type,plan,trial_ends_at,created_at,updated_at")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as AdminRestaurantRow[];
  return <RestaurantsClient initialRows={rows} />;
}
