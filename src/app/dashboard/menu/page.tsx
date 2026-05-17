import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuManager } from "@/components/ui-custom/MenuManager";

export default function MenuPage() {
  return (
    <AppShell>
      <PageHeader title="Menu" subtitle="Gérez vos produits et catégories" />
      <MenuManager />
    </AppShell>
  );
}
