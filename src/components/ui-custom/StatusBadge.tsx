import { cn } from "@/lib/utils";

const tones = {
  green: "bg-emerald-50 text-emerald-800",
  orange: "bg-orange-50 text-orange-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-rose-50 text-rose-700",
  gray: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ label, tone = "green" }: { label: string; tone?: keyof typeof tones }) {
  return <span className={cn("inline-flex min-h-8 items-center rounded-xl px-3 text-sm font-semibold", tones[tone])}>{label}</span>;
}
