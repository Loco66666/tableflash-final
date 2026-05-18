import type { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, value, label, warm = false }: { icon: LucideIcon; value: string; label: string; warm?: boolean }) {
  return (
    <div className="flex min-h-[6.75rem] flex-col items-center justify-center rounded-[1.25rem] border border-slate-200 bg-white p-3 text-center shadow-card min-[390px]:min-h-[7.25rem] md:min-h-[7.5rem]">
      <span className={"mb-2 grid size-10 place-items-center rounded-full min-[390px]:size-11 md:mb-3 " + (warm ? "bg-amber-100 text-amber-600" : "bg-emerald-50 text-emerald-800")}>
        <Icon className="size-5 stroke-[1.9] min-[390px]:size-6" />
      </span>
      <strong className="max-w-full truncate text-2xl font-black leading-none tracking-[-0.05em] text-emerald-800 min-[390px]:text-[1.65rem] md:text-3xl">{value}</strong>
      <span className="mt-1 max-w-full text-pretty text-xs leading-tight text-slate-600 min-[390px]:text-[0.8rem] md:text-sm">{label}</span>
    </div>
  );
}
