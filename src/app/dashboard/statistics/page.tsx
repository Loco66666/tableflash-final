import StatisticsClient from "@/app/dashboard/statistics/statistics-client";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";

export default async function StatisticsPage() {
  const { restaurant } = await getCurrentRestaurantContext();
  return <StatisticsClient restaurantName={restaurant.name} />;
}
