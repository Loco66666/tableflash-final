"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MoreHorizontal, QrCode, ShoppingBag, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Accueil", icon: Home, key: "home" },
  { href: "/dashboard/orders", label: "Commandes", icon: ShoppingBag, key: "orders" },
  { href: "/dashboard/menu", label: "Menu", icon: Utensils, key: "menu" },
  { href: "/dashboard/qr", label: "QR", icon: QrCode, key: "qr" },
  { href: "/dashboard/more", label: "Plus", icon: MoreHorizontal, key: "plus" },
];

function getActiveKey(pathname: string) {
  if (pathname.includes("/orders")) return "orders";
  if (pathname.includes("/menu")) return "menu";
  if (pathname.includes("/qr")) return "qr";
  if (pathname.includes("/more") || pathname.includes("/reviews") || pathname.includes("/statistics") || pathname.includes("/settings")) return "plus";
  return "home";
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const activeKey = getActiveKey(pathname);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--tf-primary-dark)]/10 bg-white/95 px-2 safe-pb-bottom-nav pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:left-1/2 md:max-w-[760px] md:-translate-x-1/2 md:rounded-t-[2rem]">
      <div className="mx-auto grid max-w-[430px] grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeKey === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.78rem] font-medium text-slate-500 transition",
                active && "text-[var(--tf-primary-800)]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("size-6 stroke-[1.9]", active && "fill-[color:var(--tf-primary-700)]/10 stroke-[var(--tf-primary-800)]")} />
              <span>{item.label}</span>
              <span className={cn("h-1 w-8 rounded-full", active ? "bg-[var(--tf-primary-700)]" : "bg-transparent")} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
