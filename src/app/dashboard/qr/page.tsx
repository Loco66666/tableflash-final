"use client";

import { Suspense, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableQrManager } from "@/components/ui-custom/TableQrManager";
import { normalizeSettings, useSettingsStore } from "@/lib/local-store/settingsStore";

export default function QrPage() {
  const { value: storedSettings } = useSettingsStore();
  const settings = useMemo(() => normalizeSettings(storedSettings), [storedSettings]);

  return (
    <AppShell>
      <PageHeader title={settings.restaurantName} subtitle="QR de table" />
      <Suspense fallback={null}>
        <TableQrManager />
      </Suspense>
    </AppShell>
  );
}
