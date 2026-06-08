import type { RestaurantSettings } from "@/lib/types";
import { getCurrentRestaurantContext } from "@/lib/restaurant/get-current-restaurant";
import SettingsClient from "@/app/dashboard/settings/settings-client";

function formatTime(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;

  return value.slice(0, 5);
}

function toUiSettings(input: Awaited<ReturnType<typeof getCurrentRestaurantContext>>): RestaurantSettings {
  const { restaurant, settings } = input;
  const ordersEnabled = settings?.orders_enabled ?? true;
  const reviewsEnabled = settings?.reviews_enabled ?? true;
  const qrEnabled = settings?.qr_enabled ?? true;
  const onSitePaymentEnabled = !(settings?.require_payment_before_preparation ?? false);

  return {
    restaurantName: restaurant.name,
    serviceLabel: "Service en cours",
    serviceOpen: ordersEnabled,
    qrEnabled,
    qrOrdersEnabled: ordersEnabled && qrEnabled,
    onSitePaymentEnabled,
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
      lunchStart: formatTime(settings?.lunch_start, "12:00"),
      lunchEnd: formatTime(settings?.lunch_end, "14:30"),
      dinnerStart: formatTime(settings?.dinner_start, "19:00"),
      dinnerEnd: formatTime(settings?.dinner_end, "22:30"),
      openDays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    },
    ordersSettings: {
      acceptanceMode: "manual",
      onSitePaymentEnabled,
      customerMessage: "",
      customerTrackingEnabled: true,
    },
    qr: {
      instruction: "Scannez pour commander",
      showTableName: true,
      publicRestaurantLink: `/r/${restaurant.slug}`,
    },
    reviewsSettings: {
      enabledAfterMeal: reviewsEnabled,
      googleReviewUrl: restaurant.google_review_url ?? "",
      suggestGoogleOnPositive: true,
    },
    appearance: {
      style: "Classique",
      primaryColor: "#047857",
    },
  };
}

export default async function SettingsPage() {
  const context = await getCurrentRestaurantContext();

  return <SettingsClient initialSettings={toUiSettings(context)} />;
}
