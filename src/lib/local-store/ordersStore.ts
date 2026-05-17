"use client";

import { orders } from "@/lib/data/seed";
import { createLocalStore } from "@/lib/local-store/createLocalStore";

export const useOrdersStore = createLocalStore("tableflash.orders", orders);
