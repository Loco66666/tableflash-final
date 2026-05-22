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
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 fill-emerald-500 text-emerald-500" />
            <p className="text-2xl font-semibold leading-none">TableFlash</p>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <button className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4 text-slate-700" />
              <span className="absolute -right-2 -top-2 rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white">3</span>
            </button>
            <div className="h-6 border-l border-slate-200" />
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">AD</span>
              <div>
                <p className="text-sm font-semibold leading-none">Admin</p>
                <p className="text-xs text-slate-500">Administrateur</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-600" />
            </div>
            <div className="h-6 border-l border-slate-200" />
            <button className="inline-flex items-center gap-1.5 text-sm text-slate-700">
              <LogOut className="h-4 w-4" />Déconnexion
            </button>
          </div>
        </div>

        <nav className="mx-auto flex h-12 w-full max-w-[1500px] items-end gap-5 px-8">
          {navItems.map((item) => {
            const active = item.label === "Analytics" ? false : item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className={`flex items-center gap-1.5 border-b-2 px-1 pb-2 text-sm font-medium ${active ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-700"}`}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1500px] px-8 py-6">{children}</main>
    </div>
  );
}

export function AdminPanel({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.06)]">
      {(title || right) && (
        <div className="mb-4 flex items-center justify-between">
          {title ? <h2 className="text-xl font-semibold text-slate-900">{title}</h2> : <span />}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
