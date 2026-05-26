import DashboardClient from "@/app/dashboard/dashboard-client";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";

export default async function DashboardPage() {
  const { restaurant } = await getCurrentRestaurantContext();

  return (
    <DashboardClient
      restaurantName={restaurant.name}
      restaurantCity={restaurant.city}
      restaurantStatus={restaurant.status}
      restaurantPlan={restaurant.plan}
      restaurantEmail={restaurant.email}
      restaurantPhone={restaurant.phone}
    />
  );
}
