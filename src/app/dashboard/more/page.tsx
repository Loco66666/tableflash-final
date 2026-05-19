import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, HelpCircle, Settings, Star, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/ui-custom/SectionCard";

const links: Array<{
  href: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    href: "/dashboard/reviews",
    label: "Avis clients",
    subtitle: "Voir les avis à traiter",
    icon: Star,
    tone: "bg-amber-50 text-amber-600",
  },
  {
    href: "/dashboard/statistics",
    label: "Statistiques",
    subtitle: "Voir l’activité du service",
    icon: TrendingUp,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    href: "/dashboard/settings",
    label: "Réglages",
    subtitle: "Configurer le restaurant",
    icon: Settings,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    href: "/dashboard/help",
    label: "Aide",
    subtitle: "Questions fréquentes et support",
    icon: HelpCircle,
    tone: "bg-violet-50 text-violet-700",
  },
];

export default function MorePage() {
  return (
    <AppShell>
      <PageHeader title="Plus" subtitle="Raccourcis du restaurant" />

      <section className="grid min-w-0 grid-cols-1 gap-4" aria-label="Raccourcis Plus">
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="block min-w-0 rounded-[1.4rem] transition active:scale-[0.99]">
              <SectionCard className="flex min-h-24 items-center gap-4 p-5">
                <span className={`grid size-14 shrink-0 place-items-center rounded-full ${item.tone}`}>
                  <Icon className="size-8" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">{item.label}</span>
                  <span className="mt-1 block text-lg leading-snug text-slate-600">{item.subtitle}</span>
                </span>
                <ChevronRight className="size-7 shrink-0 text-slate-500" aria-hidden="true" />
              </SectionCard>
            </Link>
          );
        })}

      </section>
    </AppShell>
  );
}
