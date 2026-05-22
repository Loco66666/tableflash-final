import type { AppRole } from "@/lib/supabase/types";

export const APP_ROLES: readonly AppRole[] = [
  "super_admin",
  "restaurant_owner",
  "restaurant_staff",
] as const;

export const isElevatedRole = (role: AppRole): boolean => role === "super_admin";

export const canManageRestaurant = (role: AppRole): boolean =>
  role === "super_admin" || role === "restaurant_owner" || role === "restaurant_staff";
