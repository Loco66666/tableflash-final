"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  Circle,
  ClipboardList,
  Eye,
  LogOut,
  Store,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: Building2 },
  { href: "/admin/requests", label: "Demandes", icon: ClipboardList },
  { href: "/admin/restaurants", label: "Restaurants", icon: Store },
  { href: "/admin", label: "Analytics", icon: Eye },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[86px] w-full max-w-[1512px] items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Zap className="h-8 w-8 fill-emerald-500 text-emerald-500" />
            <p className="text-[42px] font-semibold leading-none">TableFlash</p>
            <span className="rounded-full bg-emerald-100 px-5 py-2 text-xl font-semibold text-emerald-700">Admin</span>
          </div>
          <div className="flex items-center gap-7">
            <button className="relative p-1" aria-label="Notifications">
              <Bell className="h-7 w-7 text-slate-800" />
              <span className="absolute -right-2 -top-2 rounded-full bg-emerald-500 px-2 text-sm font-semibold text-white">3</span>
            </button>
            <div className="h-10 border-l border-slate-200" />
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl font-semibold text-emerald-700">AD</span>
              <div>
                <p className="text-2xl font-semibold leading-tight">Admin</p>
                <p className="text-lg text-slate-500">Administrateur</p>
              </div>
              <ChevronDown className="ml-2 h-5 w-5 text-slate-700" />
            </div>
            <div className="h-10 border-l border-slate-200" />
            <button className="inline-flex items-center gap-2 text-2xl text-slate-700">
              <LogOut className="h-6 w-6" />Déconnexion
            </button>
          </div>
        </div>

        <nav className="mx-auto flex h-[76px] w-full max-w-[1512px] items-end gap-8 px-8">
          {navItems.map((item) => {
            const active = item.label === "Analytics" ? false : item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className={`flex items-center gap-3 border-b-[3px] px-4 pb-4 pt-3 text-[30px] font-medium ${active ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-600"}`}>
                <Icon className="h-7 w-7" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1512px] px-8 py-8">{children}</main>
    </div>
  );
}

export function AdminPanel({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{(title || right) && <div className="mb-4 flex items-center justify-between">{title ? <h2 className="text-[44px] font-semibold leading-none">{title}</h2> : <span />} {right}</div>}{children}</section>;
}

export function AdminBadge({ label, tone = "emerald" }: { label: string; tone?: "emerald" | "amber" | "red" | "blue" }) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-600",
    blue: "bg-indigo-100 text-indigo-600",
  };
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-lg font-medium ${tones[tone]}`}><Circle className="h-3 w-3 fill-current" />{label}</span>;
}
