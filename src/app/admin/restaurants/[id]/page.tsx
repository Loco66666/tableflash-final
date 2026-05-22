"use client";

import Link from "next/link";
import { PencilLine } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AdminPanel, AdminShell, InlineToast, SimpleModal } from "@/components/admin/AdminUI";
import { adminRestaurants } from "@/lib/admin-data";

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const baseRestaurant = adminRestaurants.find((r) => r.id === id) ?? adminRestaurants[2];
  const [status, setStatus] = useState(baseRestaurant.status);
  const [openModal, setOpenModal] = useState<"suspend" | "billing" | "contact" | "activity" | "requests" | "note" | null>(null);
  const [toast, setToast] = useState("");

  return (
    <AdminShell>
      {toast && <InlineToast message={toast} />}
      <p className="text-sm text-slate-500">Restaurants / {baseRestaurant.name}</p>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-3xl font-semibold">{baseRestaurant.name}</p><p className="text-sm text-slate-600">{status} • {baseRestaurant.plan} • Restaurant</p></div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-lg border px-3 py-2 text-sm">Ouvrir le dashboard</Link>
            <button onClick={() => setOpenModal("suspend")} className="rounded-lg border px-3 py-2 text-sm">Suspendre</button>
            <button onClick={() => {setToast("Accès réinitialisé"); setTimeout(() => setToast(""), 1800);}} className="rounded-lg border px-3 py-2 text-sm">Réinitialiser l’accès</button>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminPanel title="Abonnement & facturation" right={<button onClick={() => setOpenModal("billing")} className="text-sm text-emerald-600">Voir la facturation</button>}><p className="text-sm">Plan: {baseRestaurant.plan}</p></AdminPanel>
        <AdminPanel title="Informations opérationnelles" right={<button onClick={() => setOpenModal("contact")} className="text-sm text-emerald-600">Contacter</button>}><p className="text-sm">Dernière activité: {baseRestaurant.lastActivity}</p></AdminPanel>
        <AdminPanel title="Demandes récentes" right={<button onClick={() => setOpenModal("requests")} className="text-sm text-emerald-600">Voir tout</button>}><ul className="space-y-2 text-sm"><li>Réinitialisation de mot de passe</li></ul></AdminPanel>
        <AdminPanel title="Activité récente" right={<button onClick={() => setOpenModal("activity")} className="text-sm text-emerald-600">Voir toute l’activité</button>}><p className="text-sm">Aujourd’hui, activité stable avec un pic entre 12h et 14h.</p></AdminPanel>
      </div>
      <div className="mt-4"><AdminPanel title="Note interne" right={<button onClick={() => setOpenModal("note")} className="rounded p-1 hover:bg-slate-100"><PencilLine className="h-4 w-4" /></button>}><p className="text-sm text-slate-600">Client engagé, à suivre sur l’activation de l’équipe.</p></AdminPanel></div>

      {openModal === "suspend" && <SimpleModal title="Confirmer l’action" onClose={() => setOpenModal(null)}><p className="text-sm">Voulez-vous mettre à jour le statut ?</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => setOpenModal(null)} className="rounded-lg border px-4 py-2 text-sm">Annuler</button><button onClick={() => {setStatus((s) => s === "Suspendu" ? "Actif" : "Suspendu"); setOpenModal(null);}} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Confirmer</button></div></SimpleModal>}
      {openModal === "billing" && <SimpleModal title="Résumé de facturation" onClose={() => setOpenModal(null)}><p className="text-sm">Plan {baseRestaurant.plan}, prochaine échéance: 01 juin 2026.</p></SimpleModal>}
      {openModal === "contact" && <SimpleModal title="Contacter le restaurant" onClose={() => setOpenModal(null)}><p className="text-sm">Email: {baseRestaurant.email}</p><p className="text-sm">Téléphone: {baseRestaurant.phone}</p></SimpleModal>}
      {openModal === "activity" && <SimpleModal title="Toute l’activité" onClose={() => setOpenModal(null)}><ul className="text-sm"><li>12:45 - Nouveau scan QR</li><li>13:10 - Commande validée</li></ul></SimpleModal>}
      {openModal === "requests" && <SimpleModal title="Toutes les demandes récentes" onClose={() => setOpenModal(null)}><ul className="text-sm"><li>Support sur abonnement</li><li>Demande d’accès manager</li></ul></SimpleModal>}
      {openModal === "note" && <SimpleModal title="Modifier la note interne" onClose={() => setOpenModal(null)}><textarea rows={4} className="w-full rounded-lg border border-slate-200 p-2 text-sm" defaultValue="Client engagé, à suivre sur l’activation de l’équipe."/><div className="mt-3 flex justify-end"><button onClick={() => {setOpenModal(null); setToast("Note mise à jour"); setTimeout(() => setToast(""), 1800);}} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">Enregistrer</button></div></SimpleModal>}
    </AdminShell>
  );
}
