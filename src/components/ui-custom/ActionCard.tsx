import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

export function ActionCard({ href, icon: Icon, title, count, tone = "green" }: { href: string; icon: LucideIcon; title: string; count?: string; tone?: "green" | "orange" | "yellow" | "red" }) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-800",
    orange: "bg-orange-50 text-orange-600",
    yellow: "bg-amber-50 text-amber-500",
    red: "bg-rose-50 text-rose-600",
  }[tone];

  return (
    <Link href={href} className="flex min-h-20 items-center gap-4 rounded-[1.15rem] border border-slate-200 bg-white px-4 shadow-card transition active:scale-[0.99]">
      <span className={`grid size-12 shrink-0 place-items-center rounded-full ${toneClass}`}><Icon className="size-7" /></span>
      <span className="min-w-0 flex-1 text-lg font-semibold leading-tight text-slate-950">{count ? <strong className="mr-2 text-emerald-800">{count}</strong> : null}{title}</span>
      <ChevronRight className="size-6 shrink-0 text-slate-500" />
    </Link>
  );
}
