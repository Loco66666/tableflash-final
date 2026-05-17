"use client";

import { restaurantSettings } from "@/lib/data/seed";
import { createLocalStore } from "@/lib/local-store/createLocalStore";

export const useSettingsStore = createLocalStore("tableflash.settings", restaurantSettings);
