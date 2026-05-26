"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Building2,
  CalendarDays,
  Filter,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { AdminShell, InlineToast, SimpleModal } from "@/components/admin/AdminUI";
import type { AdminApplication } from "./page";
import {
  approveApplication,
  markApplicationNeedsFollowup,
  rejectApplication,
} from "./actions";

type ApprovalCredentials = {
  restaurantName: string;
  email: string;
  temporaryPassword: string;
};

export function AdminRequestsClient({
  initialRequests,
}: {
  initialRequests: AdminApplication[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const [confirmRefuse, setConfirmRefuse] = useState<AdminApplication | null>(null);
  const [credentials, setCredentials] = useState<ApprovalCredentials | null>(null);
  const [toast, setToast] = useState("");
  const [note, setNote] = useState("");
  const [plan, setPlan] = useState<"Essai gratuit" | "Standard" | "Premium">("Essai gratuit");
  const [isPending, startTransition] = useTransition();

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests],
  );

  const followupCount = useMemo(
    () => requests.filter((request) => request.status === "needs_followup").length,
    [requests],
  );

  return (
    <AdminShell>
      {toast && <InlineToast message={toast} />}

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Demandes d’inscription</h1>
          <p className="text-sm text-slate-600">
            Examinez et validez les nouvelles demandes d’inscription des restaurants.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filtrer
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">En attente</p>
          <p className="text-3xl font-semibold">{pendingCount}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">À relancer</p>
          <p className="text-3xl font-semibold text-amber-700">{followupCount}</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">Aucune demande en attente</h2>
          <p className="mt-2 text-sm text-slate-600">
            Les nouvelles inscriptions apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="mt-1 rounded-full bg-emerald-100 p-2 text-emerald-600">
                    <Building2 className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-lg font-semibold">{request.restaurant_name}</p>

                    <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-600 md:grid-cols-2">
                      <p className="inline-flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.owner_name}
                      </p>
                      <p className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {request.city ?? "-"}
                      </p>
                      <p className="inline-flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {request.phone ?? "-"}
                      </p>
                      <p className="inline-flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {request.email}
                      </p>
                      <p className="text-sm text-slate-500">
                        Type: {request.restaurant_type ?? "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Source: {request.source ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="inline-flex items-center gap-1 text-sm text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    {request.created_at
                      ? new Date(request.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelected(request)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                    >
                      Examiner
                    </button>

                    <button
                      onClick={() => setConfirmRefuse(request)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmRefuse && (
        <SimpleModal title="Confirmer le refus" onClose={() => setConfirmRefuse(null)}>
          <p className="text-sm text-slate-700">
            Refuser la demande de <strong>{confirmRefuse.restaurant_name}</strong> ?
          </p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setConfirmRefuse(null)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Annuler
            </button>

            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await rejectApplication({ applicationId: confirmRefuse.id });
                  setRequests((previous) =>
                    previous.filter((request) => request.id !== confirmRefuse.id),
                  );
                  setConfirmRefuse(null);
                  setToast("Demande refusée");
                })
              }
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white"
            >
              Refuser
            </button>
          </div>
        </SimpleModal>
      )}

      {selected && (
        <SimpleModal title="Valider la demande" onClose={() => setSelected(null)}>
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            Vous allez créer le compte de <strong>{selected.restaurant_name}</strong>.
          </p>

          <div className="mt-4 grid gap-3">
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value as typeof plan)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option>Essai gratuit</option>
              <option>Standard</option>
              <option>Premium</option>
            </select>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              placeholder="Ajouter une note interne..."
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Annuler
            </button>

            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await approveApplication({
                    applicationId: selected.id,
                    planLabel: plan,
                    internalNote: note,
                  });

                  setRequests((previous) =>
                    previous.filter((request) => request.id !== selected.id),
                  );

                  if (result.credentials) {
                    setCredentials({
                      restaurantName: selected.restaurant_name,
                      email: result.credentials.email,
                      temporaryPassword: result.credentials.temporaryPassword,
                    });
                  }

                  setSelected(null);
                  setToast(result.message);
                  setNote("");
                })
              }
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Créer le compte
            </button>

            <button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await markApplicationNeedsFollowup({
                    applicationId: selected.id,
                    internalNote: note,
                  });

                  setRequests((previous) =>
                    previous.map((request) =>
                      request.id === selected.id
                        ? { ...request, status: "needs_followup" }
                        : request,
                    ),
                  );

                  setSelected(null);
                  setToast("Demande marquée à relancer");
                })
              }
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800"
            >
              À relancer
            </button>
          </div>
        </SimpleModal>
      )}

      {credentials && (
        <SimpleModal
          title="Compte restaurateur créé"
          onClose={() => setCredentials(null)}
        >
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
            Demande validée. Le compte restaurateur de{" "}
            <strong>{credentials.restaurantName}</strong> a été créé.
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Identifiants temporaires à transmettre au restaurateur
            </p>

            <div className="mt-3 space-y-2 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="font-mono font-semibold text-slate-900">
                  {credentials.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mot de passe temporaire
                </p>
                <p className="font-mono font-semibold text-slate-900">
                  {credentials.temporaryPassword}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Copiez ces identifiants maintenant. Ils seront remplacés plus tard par un email automatique.
          </p>

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setCredentials(null)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              J’ai copié les identifiants
            </button>
          </div>
        </SimpleModal>
      )}
    </AdminShell>
  );
}