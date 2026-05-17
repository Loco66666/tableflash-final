import { CustomerMenuContent } from "@/components/ui-custom/CustomerMenuContent";
import { findTableBySlug } from "@/lib/tables";

type CustomerMenuPageProps = {
  params: Promise<{ restaurant: string; table: string }>;
};

export default async function CustomerMenuPage({ params }: CustomerMenuPageProps) {
  const { table } = await params;
  const initialTable = findTableBySlug(table);

  return <CustomerMenuContent tableSlug={table} initialTable={initialTable} />;
}
