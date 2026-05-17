import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[1.4rem] border border-slate-200/80 bg-white p-5 shadow-card", className)}>{children}</section>;
}
