import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableQrManager } from "@/components/ui-custom/TableQrManager";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import { createClient } from "@/lib/supabase/server";
import type { TableInfo } from "@/lib/types";

export default async function QrPage() {
  const { restaurant } = await getCurrentRestaurantContext();
  const supabase = await createClient();

  const { data: tablesData, error: tablesError } = await supabase
    .from("restaurant_tables")
    .select("id, name, slug, zone, is_active, scans_count, created_at")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: true });

  if (tablesError) {
    console.error("[dashboard/qr] tables query failed", {
      restaurantId: restaurant.id,
      errorCode: tablesError.code,
      errorMessage: tablesError.message,
    });

    throw new Error("Chargement des QR impossible.");
  }

  const { count: qrOrdersCount, error: ordersCountError } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);

  if (ordersCountError) {
    console.error("[dashboard/qr] orders count failed", {
      restaurantId: restaurant.id,
      errorCode: ordersCountError.code,
      errorMessage: ordersCountError.message,
    });
  }

  const tables: TableInfo[] = (tablesData ?? []).map((table) => ({
    id: table.id,
    slug: table.slug,
    name: table.name,
    area: table.zone ?? "Salle",
    isActive: table.is_active,
    scans: table.scans_count,
  }));

  return (
    <AppShell>
      <PageHeader title={restaurant.name} subtitle="QR de table" />
      <Suspense fallback={null}>
        <TableQrManager
          restaurantName={restaurant.name}
          restaurantSlug={restaurant.slug}
          initialTables={tables}
          qrOrdersCount={qrOrdersCount ?? 0}
        />
      </Suspense>
    </AppShell>
  );
}