"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Zap } from "lucide-react";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/requests", label: "Demandes" },
  { href: "/admin/restaurants", label: "Restaurants" },
  { href: "/admin", label: "Analytics" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-100 p-2 text-emerald-600"><Zap size={18} /></div><p className="text-xl font-semibold">TableFlash</p><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Admin</span></div>
          <div className="flex items-center gap-6">
            <button className="relative rounded-xl border border-slate-200 p-2"><Bell size={18} /><span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 text-[10px] text-white">3</span></button>
            <div className="flex items-center gap-3"><div className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">AD</div><div><p className="text-sm font-semibold">Admin</p><p className="text-xs text-slate-500">Administrateur</p></div><ChevronDown size={16} className="text-slate-500" /></div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"><LogOut size={14} />Déconnexion</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-8 px-8">
          {nav.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return <Link key={item.label} href={item.href} className={`border-b-2 py-3 text-sm font-medium ${active ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500"}`}>{item.label}</Link>;
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] space-y-6 px-8 py-8">{children}</main>
    </div>
  );
}
