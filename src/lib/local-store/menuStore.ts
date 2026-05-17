"use client";

import { categories, products } from "@/lib/data/seed";
import { createLocalStore } from "@/lib/local-store/createLocalStore";

export const useMenuStore = createLocalStore("tableflash.menu", { categories, products });
