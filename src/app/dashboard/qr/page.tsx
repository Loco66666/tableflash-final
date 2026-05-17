import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableQrManager } from "@/components/ui-custom/TableQrManager";

export default function QrPage() {
  return (
    <AppShell>
      <PageHeader title="Le Bistrot des Halles" subtitle="Service midi en cours" />
      <Suspense fallback={null}>
        <TableQrManager />
      </Suspense>
    </AppShell>
  );
}
