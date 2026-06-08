"use client";

import { useMemo, useState, useTransition } from "react";
import { Building2, Check, ChevronRight, Clock, CreditCard, QrCode, Save, Star, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { updateRestaurantProfile, updateRestaurantSettings } from "@/app/dashboard/settings/actions";
import type { RestaurantSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type SettingsSection = "establishment" | "hours" | "orders" | "qr" | "reviews";

type ValidationErrors = Partial<
  Record<"restaurantName" | "publicSlug" | "email" | "website" | "googleReviewUrl" | "service", string>
>;

const openDayOptions = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const sectionCards: Array<{ id: SettingsSection; title: string; subtitle: string; icon: typeof Building2 }> = [
  { id: "establishment", title: "Établissement", subtitle: "Nom, adresse, téléphone", icon: Building2 },
  { id: "hours", title: "Horaires", subtitle: "Service midi et soir", icon: Clock },
  { id: "orders", title: "Commandes", subtitle: "Paiement sur place", icon: CreditCard },
  { id: "qr", title: "QR", subtitle: "Lien client et instructions", icon: QrCode },
  { id: "reviews", title: "Avis Google", subtitle: "Lien Google Avis", icon: Star },
];

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureSettings(input: RestaurantSettings): RestaurantSettings {
  const publicSlug = normalizeSlug(input.publicSlug);

  return {
    ...input,
    restaurantName: input.restaurantName ?? "",
    serviceLabel: input.serviceLabel ?? "Service en cours",
    serviceOpen: Boolean(input.serviceOpen),
    qrEnabled: input.qrEnabled ?? true,
    qrOrdersEnabled: Boolean(input.qrOrdersEnabled),
    onSitePaymentEnabled: Boolean(input.onSitePaymentEnabled),
    serviceDate: input.serviceDate || new Date().toISOString().slice(0, 10),
    address: input.address ?? "",
    phone: input.phone ?? "",
    googleReviewLabel: input.googleReviewLabel ?? "Laisser un avis",
    googleReviewUrl: input.googleReviewUrl ?? "",
    publicSlug,
    city: input.city ?? "",
    email: input.email ?? "",
    website: input.website ?? "",
    hours: {
      automaticMode: input.hours?.automaticMode ?? true,
      lunchStart: input.hours?.lunchStart ?? "12:00",
      lunchEnd: input.hours?.lunchEnd ?? "14:30",
      dinnerStart: input.hours?.dinnerStart ?? "19:00",
      dinnerEnd: input.hours?.dinnerEnd ?? "22:30",
      openDays: input.hours?.openDays?.length ? input.hours.openDays : openDayOptions,
    },
    ordersSettings: {
      acceptanceMode: input.ordersSettings?.acceptanceMode ?? "manual",
      onSitePaymentEnabled: input.ordersSettings?.onSitePaymentEnabled ?? input.onSitePaymentEnabled ?? true,
      customerMessage: input.ordersSettings?.customerMessage ?? "",
      customerTrackingEnabled: input.ordersSettings?.customerTrackingEnabled ?? true,
    },
    qr: {
      instruction: input.qr?.instruction ?? "Scannez pour commander",
      showTableName: input.qr?.showTableName ?? true,
      publicRestaurantLink: `/r/${publicSlug}`,
    },
    reviewsSettings: {
      enabledAfterMeal: input.reviewsSettings?.enabledAfterMeal ?? true,
      googleReviewUrl: input.reviewsSettings?.googleReviewUrl ?? input.googleReviewUrl ?? "",
      suggestGoogleOnPositive: input.reviewsSettings?.suggestGoogleOnPositive ?? true,
    },
    appearance: {
      style: input.appearance?.style ?? "Classique",
      primaryColor: input.appearance?.primaryColor ?? "#047857",
    },
  };
}

function validateSettings(settings: RestaurantSettings) {
  const errors: ValidationErrors = {};
  const email = settings.email.trim();
  const website = settings.website.trim();
  const googleReviewUrl = settings.reviewsSettings.googleReviewUrl.trim();
  const lunchConfigured = Boolean(settings.hours.lunchStart && settings.hours.lunchEnd);
  const dinnerConfigured = Boolean(settings.hours.dinnerStart && settings.hours.dinnerEnd);
  const incompleteLunch = Boolean(settings.hours.lunchStart) !== Boolean(settings.hours.lunchEnd);
  const incompleteDinner = Boolean(settings.hours.dinnerStart) !== Boolean(settings.hours.dinnerEnd);

  if (!settings.restaurantName.trim()) errors.restaurantName = "Le nom du restaurant est requis";
  if (!settings.publicSlug.trim()) errors.publicSlug = "Le slug public est requis";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Adresse email invalide";
  if (website && !/^https?:\/\/.+\..+/.test(website)) errors.website = "Site web invalide";
  if (googleReviewUrl && !/^https?:\/\/.+\..+/.test(googleReviewUrl)) errors.googleReviewUrl = "Lien Google Avis invalide";

  if (settings.hours.automaticMode && ((!lunchConfigured && !dinnerConfigured) || incompleteLunch || incompleteDinner)) {
    errors.service = "Renseignez les horaires du service";
  }

  return errors;
}

function getPreparationStatus(settings: RestaurantSettings) {
  const lunchConfigured = Boolean(settings.hours.lunchStart && settings.hours.lunchEnd);
  const dinnerConfigured = Boolean(settings.hours.dinnerStart && settings.hours.dinnerEnd);

  const checks = [
    { ready: Boolean(settings.restaurantName.trim()), missing: "Nom du restaurant" },
    { ready: Boolean(settings.publicSlug.trim()), missing: "Slug public" },
    { ready: lunchConfigured || dinnerConfigured, missing: "Horaires du service" },
    { ready: settings.ordersSettings.onSitePaymentEnabled, missing: "Paiement sur place" },
    { ready: Boolean(settings.qr.instruction.trim()), missing: "Instruction QR" },
    {
      ready: !settings.reviewsSettings.enabledAfterMeal || Boolean(settings.reviewsSettings.googleReviewUrl.trim()),
      missing: "Lien Google Avis",
    },
  ];

  const readyCount = checks.filter((check) => check.ready).length;

  return {
    percent: Math.round((readyCount / checks.length) * 100),
    missing: checks.filter((check) => !check.ready).map((check) => check.missing),
  };
}

function getPublicRestaurantLink(publicSlug: string) {
  return publicSlug ? `/r/${publicSlug}` : "/r/votre-restaurant";
}

function fieldId(section: SettingsSection, name: string) {
  return `${section}-${name}`;
}

function Field({
  section,
  name,
  label,
  error,
  children,
}: {
  section: SettingsSection;
  name: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const id = fieldId(section, name);

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-base font-black text-slate-800">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl tf-primary-soft-bg px-4 text-left"
      aria-pressed={checked}
    >
      <span className="text-base font-black text-slate-800">{label}</span>
      <span className={cn("flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition", checked ? "tf-primary-bg" : "bg-slate-300")}>
        <span className={cn("size-6 rounded-full bg-white transition", checked && "translate-x-6")} />
      </span>
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold outline-none focus:border-(--tf-primary) focus:ring-4 focus:ring-(--tf-primary-ring)",
        props.className,
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-lg font-semibold outline-none focus:border-(--tf-primary) focus:ring-4 focus:ring-(--tf-primary-ring)",
        props.className,
      )}
    />
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-sheet-title"
    >
      <section className="max-h-[88dvh] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:max-w-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="settings-sheet-title" className="text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function SettingsClient({ initialSettings }: { initialSettings: RestaurantSettings }) {
  const hydratedSettings = useMemo(() => ensureSettings(initialSettings), [initialSettings]);
  const [draftOverride, setDraftOverride] = useState<RestaurantSettings | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  const draft = draftOverride ?? hydratedSettings;
  const preparation = useMemo(() => getPreparationStatus(draft), [draft]);
  const activeSectionTitle = activeSection ? sectionCards.find((section) => section.id === activeSection)?.title : null;

  function updateDraft(nextSettings: RestaurantSettings) {
    const normalizedPublicSlug = normalizeSlug(nextSettings.publicSlug);
    const normalized = ensureSettings({
      ...nextSettings,
      publicSlug: normalizedPublicSlug,
      qr: {
        ...nextSettings.qr,
        publicRestaurantLink: getPublicRestaurantLink(normalizedPublicSlug),
      },
    });

    setDraftOverride(normalized);
    setSaved(false);
    setActionError("");
  }

  function saveSettings() {
    const nextSettings = ensureSettings(draft);
    const nextErrors = validateSettings(nextSettings);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const sectionByError: Partial<Record<keyof ValidationErrors, SettingsSection>> = {
        restaurantName: "establishment",
        publicSlug: "establishment",
        email: "establishment",
        website: "establishment",
        googleReviewUrl: "reviews",
        service: "hours",
      };

      const firstError = Object.keys(nextErrors)[0] as keyof ValidationErrors;
      setActiveSection(sectionByError[firstError] ?? "establishment");
      setSaved(false);
      return;
    }

    startTransition(async () => {
      try {
        setActionError("");

        await updateRestaurantProfile({
          name: nextSettings.restaurantName,
          city: nextSettings.city || null,
          phone: nextSettings.phone || null,
          email: nextSettings.email || null,
          cuisine_type: null,
          google_review_url: nextSettings.reviewsSettings.googleReviewUrl || null,
          public_base_url: nextSettings.website || null,
          address: nextSettings.address || null,
          slug: nextSettings.publicSlug,
        });

        await updateRestaurantSettings({
          lunch_enabled: Boolean(nextSettings.hours.lunchStart && nextSettings.hours.lunchEnd),
          lunch_start: nextSettings.hours.lunchStart || null,
          lunch_end: nextSettings.hours.lunchEnd || null,
          dinner_enabled: Boolean(nextSettings.hours.dinnerStart && nextSettings.hours.dinnerEnd),
          dinner_start: nextSettings.hours.dinnerStart || null,
          dinner_end: nextSettings.hours.dinnerEnd || null,
          orders_enabled: nextSettings.qrOrdersEnabled,
          require_payment_before_preparation: !nextSettings.ordersSettings.onSitePaymentEnabled,
          qr_enabled: nextSettings.qrEnabled,
          reviews_enabled: nextSettings.reviewsSettings.enabledAfterMeal,
        });

        setDraftOverride(nextSettings);
        setActiveSection(null);
        setSaved(true);
      } catch (error) {
        setSaved(false);
        setActionError(error instanceof Error ? error.message : "Sauvegarde impossible.");
      }
    });
  }

  function toggleOpenDay(day: string) {
    const openDays = draft.hours.openDays.includes(day)
      ? draft.hours.openDays.filter((currentDay) => currentDay !== day)
      : [...draft.hours.openDays, day];

    updateDraft({
      ...draft,
      hours: {
        ...draft.hours,
        openDays,
      },
    });
  }

  return (
    <AppShell>
      <PageHeader title="Réglages" />

      <section className="mb-7 rounded-3xl border border-(--tf-primary-ring) bg-linear-to-br from-(--tf-primary-soft) to-white p-5 shadow-card">
        <div className="flex items-center gap-5">
          <span className="grid size-24 shrink-0 place-items-center rounded-full bg-linear-to-br from-(--tf-primary-600) to-(--tf-primary-dark) text-white shadow-green">
            <Check className="size-14" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-black tf-primary-dark-text">État de préparation</p>
            <h2 className="text-5xl font-black tracking-tighter tf-primary-dark-text">{preparation.percent}% prêt</h2>
          </div>
        </div>

        {preparation.missing.length > 0 ? (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-base font-semibold leading-relaxed tf-primary-dark-text">
            À compléter : {preparation.missing.join(", ")}.
          </p>
        ) : null}
      </section>

      <div className="grid gap-4">
        {sectionCards.map((section) => {
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className="flex min-h-24 w-full items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 text-left shadow-card"
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-full tf-primary-soft-bg tf-primary-dark-text">
                <Icon className="size-8" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-2xl font-black tracking-tight text-slate-950">{section.title}</span>
                <span className="block truncate text-lg text-slate-600">{section.subtitle}</span>
              </span>
              <ChevronRight className="size-7 shrink-0 text-slate-500" />
            </button>
          );
        })}
      </div>

      {actionError ? (
        <p className="mt-5 rounded-2xl bg-red-50 p-4 text-center text-base font-black text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {saved ? (
        <p className="mt-5 rounded-2xl tf-primary-soft-bg p-4 text-center text-lg font-black tf-primary-dark-text" role="status">
          Réglages enregistrés
        </p>
      ) : null}

      <button
        type="button"
        onClick={saveSettings}
        disabled={isPending}
        className="mt-7 min-h-16 w-full rounded-2xl bg-linear-to-br from-(--tf-primary-600) to-(--tf-primary-dark) px-4 text-xl font-black text-white shadow-green disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-4">
          <Save className="size-8" />
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </span>
      </button>

      {activeSection ? (
        <Sheet title={activeSectionTitle ?? "Réglages"} onClose={() => setActiveSection(null)}>
          <div className="grid gap-4">
            {activeSection === "establishment" ? (
              <>
                <Field section="establishment" name="restaurantName" label="Nom du restaurant" error={errors.restaurantName}>
                  <Input
                    id={fieldId("establishment", "restaurantName")}
                    value={draft.restaurantName}
                    onChange={(event) => updateDraft({ ...draft, restaurantName: event.target.value })}
                    aria-invalid={Boolean(errors.restaurantName)}
                  />
                </Field>

                <Field section="establishment" name="publicSlug" label="Slug public" error={errors.publicSlug}>
                  <Input
                    id={fieldId("establishment", "publicSlug")}
                    value={draft.publicSlug}
                    onChange={(event) => updateDraft({ ...draft, publicSlug: event.target.value })}
                    aria-invalid={Boolean(errors.publicSlug)}
                  />
                </Field>

                <p className="rounded-2xl tf-primary-soft-bg p-4 text-sm font-semibold tf-primary-dark-text">
                  Lien client : {getPublicRestaurantLink(draft.publicSlug)}/table/table-1
                </p>

                <Field section="establishment" name="address" label="Adresse">
                  <Input
                    id={fieldId("establishment", "address")}
                    value={draft.address}
                    onChange={(event) => updateDraft({ ...draft, address: event.target.value })}
                  />
                </Field>

                <Field section="establishment" name="city" label="Ville">
                  <Input
                    id={fieldId("establishment", "city")}
                    value={draft.city}
                    onChange={(event) => updateDraft({ ...draft, city: event.target.value })}
                  />
                </Field>

                <Field section="establishment" name="phone" label="Téléphone">
                  <Input
                    id={fieldId("establishment", "phone")}
                    value={draft.phone}
                    onChange={(event) => updateDraft({ ...draft, phone: event.target.value })}
                    inputMode="tel"
                  />
                </Field>

                <Field section="establishment" name="email" label="Email" error={errors.email}>
                  <Input
                    id={fieldId("establishment", "email")}
                    value={draft.email}
                    onChange={(event) => updateDraft({ ...draft, email: event.target.value })}
                    inputMode="email"
                    aria-invalid={Boolean(errors.email)}
                  />
                </Field>

                <Field section="establishment" name="website" label="Site web" error={errors.website}>
                  <Input
                    id={fieldId("establishment", "website")}
                    value={draft.website}
                    onChange={(event) => updateDraft({ ...draft, website: event.target.value })}
                    inputMode="url"
                    aria-invalid={Boolean(errors.website)}
                  />
                </Field>
              </>
            ) : null}

            {activeSection === "hours" ? (
              <>
                <p className="rounded-2xl tf-primary-soft-bg p-4 text-base font-semibold leading-relaxed tf-primary-dark-text">
                  Les horaires contrôlent l’ouverture du service et l’affichage côté client.
                </p>

                <Toggle
                  label="Mode automatique activé"
                  checked={draft.hours.automaticMode}
                  onChange={(automaticMode) =>
                    updateDraft({
                      ...draft,
                      hours: {
                        ...draft.hours,
                        automaticMode,
                      },
                    })
                  }
                />

                <div className="grid gap-4 min-[430px]:grid-cols-2">
                  <Field section="hours" name="lunchStart" label="Service midi début" error={errors.service}>
                    <Input
                      id={fieldId("hours", "lunchStart")}
                      type="time"
                      value={draft.hours.lunchStart}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          hours: {
                            ...draft.hours,
                            lunchStart: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>

                  <Field section="hours" name="lunchEnd" label="Service midi fin">
                    <Input
                      id={fieldId("hours", "lunchEnd")}
                      type="time"
                      value={draft.hours.lunchEnd}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          hours: {
                            ...draft.hours,
                            lunchEnd: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>

                  <Field section="hours" name="dinnerStart" label="Service soir début">
                    <Input
                      id={fieldId("hours", "dinnerStart")}
                      type="time"
                      value={draft.hours.dinnerStart}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          hours: {
                            ...draft.hours,
                            dinnerStart: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>

                  <Field section="hours" name="dinnerEnd" label="Service soir fin">
                    <Input
                      id={fieldId("hours", "dinnerEnd")}
                      type="time"
                      value={draft.hours.dinnerEnd}
                      onChange={(event) =>
                        updateDraft({
                          ...draft,
                          hours: {
                            ...draft.hours,
                            dinnerEnd: event.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                </div>

                <div>
                  <p className="mb-2 text-base font-black text-slate-800">Jours ouverts</p>
                  <div className="grid grid-cols-4 gap-2 min-[430px]:grid-cols-7">
                    {openDayOptions.map((day) => {
                      const selected = draft.hours.openDays.includes(day);

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleOpenDay(day)}
                          className={cn(
                            "min-h-12 rounded-2xl border px-2 text-base font-black",
                            selected ? "tf-primary-border tf-primary-bg text-white" : "border-slate-200 text-slate-700",
                          )}
                          aria-pressed={selected}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}

            {activeSection === "orders" ? (
              <>
                <Toggle
                  label="Commandes QR activees"
                  checked={draft.qrOrdersEnabled}
                  onChange={(qrOrdersEnabled) =>
                    updateDraft({
                      ...draft,
                      serviceOpen: qrOrdersEnabled,
                      qrOrdersEnabled,
                    })
                  }
                />

                <div className="grid gap-3 min-[430px]:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft({
                        ...draft,
                        ordersSettings: {
                          ...draft.ordersSettings,
                          acceptanceMode: "automatic",
                        },
                      })
                    }
                    className={cn(
                      "min-h-14 rounded-2xl border px-4 text-base font-black",
                      draft.ordersSettings.acceptanceMode === "automatic"
                        ? "tf-primary-border tf-primary-bg text-white"
                        : "border-slate-200 text-slate-700",
                    )}
                    aria-pressed={draft.ordersSettings.acceptanceMode === "automatic"}
                  >
                    Acceptation automatique
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateDraft({
                        ...draft,
                        ordersSettings: {
                          ...draft.ordersSettings,
                          acceptanceMode: "manual",
                        },
                      })
                    }
                    className={cn(
                      "min-h-14 rounded-2xl border px-4 text-base font-black",
                      draft.ordersSettings.acceptanceMode === "manual"
                        ? "tf-primary-border tf-primary-bg text-white"
                        : "border-slate-200 text-slate-700",
                    )}
                    aria-pressed={draft.ordersSettings.acceptanceMode === "manual"}
                  >
                    Mode manuel
                  </button>
                </div>

                <Toggle
                  label="Paiement sur place"
                  checked={draft.ordersSettings.onSitePaymentEnabled}
                  onChange={(onSitePaymentEnabled) =>
                    updateDraft({
                      ...draft,
                      onSitePaymentEnabled,
                      ordersSettings: {
                        ...draft.ordersSettings,
                        onSitePaymentEnabled,
                      },
                    })
                  }
                />

                <Field section="orders" name="customerMessage" label="Message client">
                  <Textarea
                    id={fieldId("orders", "customerMessage")}
                    value={draft.ordersSettings.customerMessage}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        ordersSettings: {
                          ...draft.ordersSettings,
                          customerMessage: event.target.value,
                        },
                      })
                    }
                  />
                </Field>

                <Toggle
                  label="Suivi client activé"
                  checked={draft.ordersSettings.customerTrackingEnabled}
                  onChange={(customerTrackingEnabled) =>
                    updateDraft({
                      ...draft,
                      ordersSettings: {
                        ...draft.ordersSettings,
                        customerTrackingEnabled,
                      },
                    })
                  }
                />
              </>
            ) : null}

            {activeSection === "qr" ? (
              <>
                <Toggle
                  label="QR actifs"
                  checked={draft.qrEnabled}
                  onChange={(qrEnabled) =>
                    updateDraft({
                      ...draft,
                      qrEnabled,
                    })
                  }
                />

                <Field section="qr" name="instruction" label="Instruction QR">
                  <Textarea
                    id={fieldId("qr", "instruction")}
                    value={draft.qr.instruction}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        qr: {
                          ...draft.qr,
                          instruction: event.target.value,
                        },
                      })
                    }
                  />
                </Field>

                <Toggle
                  label="Afficher le nom de table"
                  checked={draft.qr.showTableName}
                  onChange={(showTableName) =>
                    updateDraft({
                      ...draft,
                      qr: {
                        ...draft.qr,
                        showTableName,
                      },
                    })
                  }
                />

                <Field section="qr" name="publicRestaurantLink" label="Lien public du restaurant">
                  <Input id={fieldId("qr", "publicRestaurantLink")} value={getPublicRestaurantLink(draft.publicSlug)} readOnly />
                </Field>
              </>
            ) : null}

            {activeSection === "reviews" ? (
              <>
                <Toggle
                  label="Activer avis après repas"
                  checked={draft.reviewsSettings.enabledAfterMeal}
                  onChange={(enabledAfterMeal) =>
                    updateDraft({
                      ...draft,
                      reviewsSettings: {
                        ...draft.reviewsSettings,
                        enabledAfterMeal,
                      },
                    })
                  }
                />

                <Field section="reviews" name="googleReviewUrl" label="Lien Google Avis" error={errors.googleReviewUrl}>
                  <Input
                    id={fieldId("reviews", "googleReviewUrl")}
                    value={draft.reviewsSettings.googleReviewUrl}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        reviewsSettings: {
                          ...draft.reviewsSettings,
                          googleReviewUrl: event.target.value,
                        },
                        googleReviewUrl: event.target.value,
                      })
                    }
                    inputMode="url"
                    aria-invalid={Boolean(errors.googleReviewUrl)}
                  />
                </Field>

                <Toggle
                  label="Proposer Google si avis positif"
                  checked={draft.reviewsSettings.suggestGoogleOnPositive}
                  onChange={(suggestGoogleOnPositive) =>
                    updateDraft({
                      ...draft,
                      reviewsSettings: {
                        ...draft.reviewsSettings,
                        suggestGoogleOnPositive,
                      },
                    })
                  }
                />
              </>
            ) : null}

            <button
              type="button"
              onClick={saveSettings}
              disabled={isPending}
              className="mt-2 min-h-14 rounded-2xl bg-(--tf-primary-800) px-4 text-lg font-black text-white shadow-green disabled:opacity-60"
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </Sheet>
      ) : null}
    </AppShell>
  );
}
