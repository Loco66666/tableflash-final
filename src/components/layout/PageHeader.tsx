import { Store, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, customer = false, compact = false }: { title: string; subtitle?: string; customer?: boolean; compact?: boolean }) {
  return (
    <header className={cn("mb-7 flex items-center gap-4", compact && "mb-5")}>
      <div className="tf-primary-gradient grid size-14 shrink-0 place-items-center rounded-full text-white shadow-[0_14px_28px_rgba(0,111,56,0.22)]">
        <Store className="size-8 stroke-[1.8]" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-balance text-[2rem] font-black leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 flex items-center gap-2 text-[1.05rem] leading-tight text-slate-600">
            <span className="size-3 rounded-full tf-primary-bg" aria-hidden="true" />
            <span className="truncate">{subtitle}</span>
          </p>
        ) : null}
      </div>
      {customer ? (
        <div className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white text-slate-800">
          <UserRound className="size-7 tf-primary-dark-text" />
        </div>
      ) : null}
    </header>
  );
}
