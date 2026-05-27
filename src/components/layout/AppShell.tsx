"use client";

import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useSettingsStore } from "@/lib/local-store/settingsStore";
import { getAppearanceCssVars, getAppearanceTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function AppShell({ children, showNav = true, className }: { children: ReactNode; showNav?: boolean; className?: string }) {
  const { value: settings } = useSettingsStore();
  const appearanceStyles = getAppearanceCssVars(settings?.appearance);
  const appearanceTheme = getAppearanceTheme(settings?.appearance);

  return (
    <div className={cn("tf-shell min-h-dvh bg-white text-slate-950", `tf-style-${appearanceTheme.style.toLowerCase()}`)} style={appearanceStyles}>
      <main
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-190 flex-col px-5 pb-28 pt-7 sm:px-8 md:border-x md:border-(--tf-primary-900)/5 md:shadow-[0_0_60px_rgba(15,23,42,0.06)]",
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
