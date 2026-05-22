"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Building2, ChevronDown, ClipboardList, Eye, LogOut, Store, Zap } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 fill-emerald-500 text-emerald-500" />
            <p className="text-[42px] font-semibold leading-none">TableFlash</p>
            <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-2xl font-semibold text-emerald-700">Admin</span>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative" aria-label="Notifications">
              <Bell className="h-6 w-6 text-slate-700" />
              <span className="absolute -right-2 -top-2 rounded-full bg-emerald-500 px-1.5 text-xs font-semibold text-white">3</span>
            </button>
            <div className="h-8 border-l border-slate-200" />
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700">AD</span>
              <div>
                <p className="text-[34px] font-semibold leading-none">Admin</p>
                <p className="text-xl text-slate-500">Administrateur</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-700" />
            </div>
            <div className="h-8 border-l border-slate-200" />
            <button className="inline-flex items-center gap-2 text-[36px] text-slate-700">
              <LogOut className="h-4 w-4" />Déconnexion
            </button>
          </div>
        </div>

        <nav className="mx-auto flex h-14 w-full max-w-[1280px] items-end gap-6 px-6">
          {navItems.map((item) => {
            const active = item.label === "Analytics" ? false : item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className={`flex items-center gap-2 border-b-2 px-2 pb-3 text-[41px] font-semibold ${active ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-700"}`}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1280px] px-6 py-6">{children}</main>
    </div>
  );
}

export function AdminPanel({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between">
          {title ? <h2 className="text-5xl font-semibold text-slate-900">{title}</h2> : <span />}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
