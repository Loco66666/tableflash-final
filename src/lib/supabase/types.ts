export type AppRole = "super_admin" | "restaurant_owner" | "restaurant_staff";

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_followup";

export type RestaurantStatus = "trial" | "active" | "suspended" | "archived";

export type SubscriptionPlan = "trial" | "standard" | "premium";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "paid"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";
