import type { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, value, label, warm = false }: { icon: LucideIcon; value: string; label: string; warm?: boolean }) {
  return (
    <div className="flex min-h-[7.5rem] flex-col items-center justify-center rounded-[1.25rem] border border-slate-200 bg-white p-2 text-center shadow-card min-[390px]:min-h-[8.2rem] min-[390px]:p-3">
      <span className={"mb-3 grid size-11 place-items-center rounded-full min-[390px]:size-14 " + (warm ? "bg-amber-100 text-amber-600" : "bg-emerald-50 text-emerald-800")}>
        <Icon className="size-7 stroke-[1.9] min-[390px]:size-8" />
      </span>
      <strong className="text-[1.45rem] font-black leading-none tracking-[-0.05em] text-emerald-800 min-[390px]:text-3xl">{value}</strong>
      <span className="mt-1 text-xs leading-tight text-slate-600 min-[390px]:text-sm">{label}</span>
    </div>
  );
}
