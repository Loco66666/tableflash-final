import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { AdminRequestsClient } from "./requests-client";

export type AdminApplication = {
  id: string;
  restaurant_name: string;
  owner_name: string;
  city: string | null;
  phone: string | null;
  email: string;
  restaurant_type: string | null;
  source: string | null;
  status: "pending" | "needs_followup";
  internal_note: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export default async function AdminRequestsPage() {
  await requireRole(["super_admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_applications")
    .select("id,restaurant_name,owner_name,city,phone,email,restaurant_type,source,status,internal_note,created_at,reviewed_at,reviewed_by")
    .in("status", ["pending", "needs_followup"])
    .order("created_at", { ascending: false });

  const apps = (data ?? []) as AdminApplication[];
  return <AdminRequestsClient initialRequests={apps} />;
}
