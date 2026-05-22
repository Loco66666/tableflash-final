"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Bell, Building2, CheckCircle2, ChevronDown, ClipboardList, Eye, LogOut, Store, X, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: Building2 },
  { href: "/admin/requests", label: "Demandes", icon: ClipboardList },
  { href: "/admin/restaurants", label: "Restaurants", icon: Store },
  { href: "/admin/analytics", label: "Analytics", icon: Eye },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="relative border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 fill-emerald-500 text-emerald-500" />
            <p className="text-2xl font-semibold leading-none">TableFlash</p>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="relative">
              <button
                className="relative rounded-md p-1 hover:bg-slate-100"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileOpen(false);
                }}
              >
                <Bell className="h-4 w-4 text-slate-700" />
                <span className="absolute -right-2 -top-2 rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white">3</span>
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-10 z-20 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="mb-2 text-sm font-semibold">Notifications</p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="rounded-lg bg-slate-50 p-2">Nouvelle demande reçue de « Chez Marius ».</li>
                    <li className="rounded-lg bg-slate-50 p-2">« La Table Verte » a terminé son onboarding.</li>
                    <li className="rounded-lg bg-slate-50 p-2">Rappel: 2 restaurants à relancer aujourd’hui.</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="h-6 border-l border-slate-200" />
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-md p-1 hover:bg-slate-100"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">AD</span>
                <div>
                  <p className="text-sm font-semibold leading-none">Admin</p>
                  <p className="text-xs text-slate-500">Administrateur</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-600" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">Profil</button>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">Préférences</button>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">Aide</button>
                </div>
              )}
            </div>
            <div className="h-6 border-l border-slate-200" />
            <button
              className="inline-flex items-center gap-1.5 text-sm text-slate-700"
              onClick={() => router.push("/logout")}
            >
              <LogOut className="h-4 w-4" />Déconnexion
            </button>
          </div>
        </div>

        <nav className="mx-auto flex h-12 w-full max-w-[1500px] items-end gap-5 px-8">
          {navItems.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
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

export function InlineToast({ message }: { message: string }) {
  return (
    <div className="fixed right-6 top-20 z-50 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 shadow">
      <CheckCircle2 className="h-4 w-4" />
      {message}
    </div>
  );
}

export function SimpleModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button className="rounded-md p-1 hover:bg-slate-100" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
