"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminRestaurants } from "@/lib/admin-data";

export default function RestaurantDetailPage() {
  const { id } = useParams<{id:string}>();
  const restaurant = adminRestaurants.find((r) => r.id === id) ?? adminRestaurants.find((r) => r.id === "la-table-verte")!;
  return <AdminShell><p className="text-sm text-slate-500">Restaurants &gt; {restaurant.name}</p><h1 className="text-3xl font-semibold">Fiche restaurant</h1>
    <div className="rounded-3xl border border-slate-200 bg-white p-6"><p className="text-2xl font-semibold">{restaurant.name}</p><p>{restaurant.status} • Plan Premium • Cuisine française • Restaurant</p><div className="mt-4 flex gap-2"><Link href="/dashboard" className="rounded-xl border px-3 py-2">Ouvrir le dashboard</Link><button className="rounded-xl border px-3 py-2">Suspendre</button><button className="rounded-xl border px-3 py-2">Réinitialiser l’accès</button><a href={`mailto:${restaurant.email}`} className="rounded-xl border px-3 py-2">Contacter</a></div></div>
  </AdminShell>;
}
