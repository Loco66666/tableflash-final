import type { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, value, label, warm = false }: { icon: LucideIcon; value: string; label: string; warm?: boolean }) {
  return (
    <div className="flex min-h-[8.2rem] flex-col items-center justify-center rounded-[1.25rem] border border-slate-200 bg-white p-3 text-center shadow-card">
      <span className={"mb-3 grid size-14 place-items-center rounded-full " + (warm ? "bg-amber-100 text-amber-600" : "bg-emerald-50 text-emerald-800")}>
        <Icon className="size-8 stroke-[1.9]" />
      </span>
      <strong className="text-3xl font-black tracking-[-0.04em] text-emerald-800">{value}</strong>
      <span className="text-sm leading-tight text-slate-600">{label}</span>
    </div>
  );
}
