"use client";

import { restaurantSettings } from "@/lib/data/seed";
import { createLocalStore } from "@/lib/local-store/createLocalStore";
import { normalizeAppearance } from "@/lib/theme";
import type { RestaurantSettings } from "@/lib/types";

type LegacySettings = Partial<RestaurantSettings> & {
  googleReviewUrl?: string;
  onSitePaymentEnabled?: boolean;
};

export function normalizeSettings(settings?: LegacySettings | null): RestaurantSettings {
  const safeSettings = settings ?? {};
  const publicSlug = safeSettings.publicSlug?.trim() || restaurantSettings.publicSlug;
  const reviewUrl = safeSettings.reviewsSettings?.googleReviewUrl ?? safeSettings.googleReviewUrl ?? restaurantSettings.reviewsSettings.googleReviewUrl;
  const onSitePaymentEnabled = safeSettings.ordersSettings?.onSitePaymentEnabled ?? safeSettings.onSitePaymentEnabled ?? restaurantSettings.ordersSettings.onSitePaymentEnabled;

  return {
    ...restaurantSettings,
    ...safeSettings,
    restaurantName: safeSettings.restaurantName?.trim() || restaurantSettings.restaurantName,
    serviceLabel: safeSettings.serviceLabel ?? restaurantSettings.serviceLabel,
    serviceOpen: safeSettings.serviceOpen ?? restaurantSettings.serviceOpen,
    qrOrdersEnabled: safeSettings.qrOrdersEnabled ?? restaurantSettings.qrOrdersEnabled,
    onSitePaymentEnabled,
    serviceDate: safeSettings.serviceDate ?? restaurantSettings.serviceDate,
    address: safeSettings.address ?? restaurantSettings.address,
    phone: safeSettings.phone ?? restaurantSettings.phone,
    googleReviewLabel: safeSettings.googleReviewLabel ?? restaurantSettings.googleReviewLabel,
    googleReviewUrl: reviewUrl,
    publicSlug,
    city: safeSettings.city ?? restaurantSettings.city,
    email: safeSettings.email ?? restaurantSettings.email,
    website: safeSettings.website ?? restaurantSettings.website,
    hours: {
      ...restaurantSettings.hours,
      ...safeSettings.hours,
      openDays: Array.isArray(safeSettings.hours?.openDays) && safeSettings.hours.openDays.length > 0 ? safeSettings.hours.openDays : restaurantSettings.hours.openDays,
    },
    ordersSettings: {
      ...restaurantSettings.ordersSettings,
      ...safeSettings.ordersSettings,
      onSitePaymentEnabled,
    },
    qr: {
      ...restaurantSettings.qr,
      ...safeSettings.qr,
      publicRestaurantLink: `/r/${publicSlug}`,
    },
    reviewsSettings: {
      ...restaurantSettings.reviewsSettings,
      ...safeSettings.reviewsSettings,
      googleReviewUrl: reviewUrl,
    },
    appearance: normalizeAppearance({ ...restaurantSettings.appearance, ...safeSettings.appearance }),
  };
}

export const useSettingsStore = createLocalStore("tableflash.settings", restaurantSettings);
