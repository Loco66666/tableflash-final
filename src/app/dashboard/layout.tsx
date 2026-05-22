import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/require-role";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireRole(["restaurant_owner", "restaurant_staff"]);
  return children;
}
