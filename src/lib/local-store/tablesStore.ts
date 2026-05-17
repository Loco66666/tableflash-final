"use client";

import { tables } from "@/lib/data/seed";
import { createLocalStore } from "@/lib/local-store/createLocalStore";

export const useTablesStore = createLocalStore("tableflash.tables", tables);
