import type { RestaurantSettings } from "@/lib/types";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import SettingsClient from "@/app/dashboard/settings/settings-client";

function toUiSettings(input: Awaited<ReturnType<typeof getCurrentRestaurantContext>>): RestaurantSettings {
  const { restaurant, settings } = input;
  return {
    restaurantName: restaurant.name,
    serviceLabel: "Service en cours",
    serviceOpen: true,
    qrOrdersEnabled: settings?.orders_enabled ?? true,
    onSitePaymentEnabled: !(settings?.require_payment_before_preparation ?? false),
    serviceDate: new Date().toISOString().slice(0, 10),
    address: restaurant.address ?? "",
    phone: restaurant.phone ?? "",
    googleReviewLabel: "Laisser un avis",
    googleReviewUrl: restaurant.google_review_url ?? "",
    publicSlug: restaurant.slug,
    city: restaurant.city ?? "",
    email: restaurant.email ?? "",
    website: restaurant.public_base_url ?? "",
    hours: {
      automaticMode: true,
      lunchStart: settings?.lunch_start ?? "",
      lunchEnd: settings?.lunch_end ?? "",
      dinnerStart: settings?.dinner_start ?? "",
      dinnerEnd: settings?.dinner_end ?? "",
      openDays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    },
    ordersSettings: { acceptanceMode: "manual", onSitePaymentEnabled: !(settings?.require_payment_before_preparation ?? false), customerMessage: "", customerTrackingEnabled: true },
    qr: { instruction: "Scannez pour commander", showTableName: true, publicRestaurantLink: `/r/${restaurant.slug}` },
    reviewsSettings: { enabledAfterMeal: settings?.reviews_enabled ?? true, googleReviewUrl: restaurant.google_review_url ?? "", suggestGoogleOnPositive: true },
    appearance: { style: "Classique", primaryColor: "#047857" },
  };
}

export default async function SettingsPage() {
  const context = await getCurrentRestaurantContext();
  return <SettingsClient initialSettings={toUiSettings(context)} />;
}
