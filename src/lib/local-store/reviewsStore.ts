"use client";

import { reviews } from "@/lib/data/seed";
import { createLocalStore } from "@/lib/local-store/createLocalStore";

export const useReviewsStore = createLocalStore("tableflash.reviews", reviews);
