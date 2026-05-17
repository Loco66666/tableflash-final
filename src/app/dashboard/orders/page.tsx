import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrdersBoard } from "@/components/ui-custom/OrdersBoard";
import { normalizeOrderFilterSlug } from "@/lib/orders";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const { filter } = await searchParams;
  const initialFilter = normalizeOrderFilterSlug(filter);

  return (
    <AppShell>
      <PageHeader title="Commandes" subtitle="Service en cours" />
      <OrdersBoard initialFilter={initialFilter} />
    </AppShell>
  );
}
