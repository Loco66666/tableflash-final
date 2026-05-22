"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPanel, AdminShell } from "@/components/admin/AdminUI";
import { adminRestaurants } from "@/lib/admin-data";

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const restaurant = adminRestaurants.find((r) => r.id === id) ?? adminRestaurants[2];

  return (
    <AdminShell>
      <p className="text-[30px] text-slate-500">Restaurants / {restaurant.name}</p>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between">
          <div><p className="text-6xl font-semibold">{restaurant.name}</p><p className="text-[31px] text-slate-600">{restaurant.status} • {restaurant.plan} • Restaurant</p></div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-xl border px-3 py-2 text-[30px]">Ouvrir le dashboard</Link>
            <button className="rounded-xl border px-3 py-2 text-[30px]">Suspendre</button>
            <button className="rounded-xl border px-3 py-2 text-[30px]">Réinitialiser l’accès</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2 border-t border-slate-100 pt-3 text-[30px] text-slate-700">
          <p>Propriétaire: <strong>{restaurant.owner}</strong></p>
          <p>Ville: <strong>{restaurant.city}</strong></p>
          <p>Téléphone: <strong>{restaurant.phone}</strong></p>
          <p>Email: <strong>{restaurant.email}</strong></p>
          <p>Inscrit le: <strong>20 mai 2026</strong></p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <AdminPanel title="Abonnement & facturation"><p className="text-[32px]">Plan: {restaurant.plan}</p><p className="text-[32px]">Tarif: {restaurant.priceOrTrial}</p><p className="text-[32px]">Prochaine facture: 01 juin 2026</p></AdminPanel>
        <AdminPanel title="Informations opérationnelles"><p className="text-[32px]">Type: Restaurant</p><p className="text-[32px]">Source: Google Recherche</p><p className="text-[32px]">Dernière activité: {restaurant.lastActivity}</p></AdminPanel>
        <AdminPanel title="Demandes récentes"><ul className="space-y-2 text-[32px]"><li>Réinitialisation de mot de passe</li><li>Ajout d’un utilisateur manager</li><li>Question sur l’abonnement</li></ul></AdminPanel>
        <AdminPanel title="Activité récente"><div className="mb-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3"><p className="text-[30px]">Commandes<br/><strong className="text-5xl">{restaurant.ordersToday}</strong></p><p className="text-[30px]">Scans QR<br/><strong className="text-5xl">{restaurant.scansToday}</strong></p><p className="text-[30px]">Conversion<br/><strong className="text-5xl">28%</strong></p></div><p className="text-[31px] text-slate-600">Aujourd’hui, activité stable avec un pic entre 12h et 14h.</p></AdminPanel>
      </div>
      <div className="mt-4"><AdminPanel title="État d’essai & abonnement"><div className="grid grid-cols-3 gap-3 text-[31px]"><p>Essai restant<br/><strong className="text-5xl">13 jours</strong></p><p>Statut paiement<br/><strong className="text-5xl">À jour</strong></p><p>Risque churn<br/><strong className="text-5xl">Faible</strong></p></div></AdminPanel></div>
    </AdminShell>
  );
}
