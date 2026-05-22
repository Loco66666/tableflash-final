"use client";

import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useSettingsStore } from "@/lib/local-store/settingsStore";
import { getAppearanceCssVars } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function AppShell({ children, showNav = true, className }: { children: ReactNode; showNav?: boolean; className?: string }) {
  const { value: settings } = useSettingsStore();
  const appearanceStyles = getAppearanceCssVars(settings?.appearance);

  return (
    <div className="min-h-dvh bg-white text-slate-950" style={appearanceStyles}>
      <main
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-[760px] flex-col px-5 pb-28 pt-7 sm:px-8 md:border-x md:border-[color:var(--tf-primary-900)]/5 md:shadow-[0_0_60px_rgba(15,23,42,0.06)]",
          !showNav && "pb-8",
          className,
        )}
      >
        {children}
      </main>
      {showNav ? <MobileBottomNav /> : null}
    </div>
  );
}
