import type { RestaurantSettings } from "@/lib/types";

export type ServiceKind = "midi" | "soir";

export type ServiceStatus = {
  isOpen: boolean;
  currentService: ServiceKind | null;
  title: string;
  subtitle: string;
  nextServiceLabel: string | null;
  nextServiceTime: string | null;
};

type ServiceWindow = {
  kind: ServiceKind;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
};

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const FULL_DAY_LABELS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const DEFAULT_HOURS = {
  lunchStart: "12:00",
  lunchEnd: "14:30",
  dinnerStart: "19:00",
  dinnerEnd: "22:30",
};

export const loadingServiceStatus: ServiceStatus = {
  isOpen: false,
  currentService: null,
  title: "Chargement du service",
  subtitle: "Vérification des horaires",
  nextServiceLabel: null,
  nextServiceTime: null,
};

function timeToMinutes(time?: string | null) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;

  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function formatServiceTime(time: string) {
  const minutes = timeToMinutes(time);
  if (minutes === null) return null;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(restMinutes).padStart(2, "0")}`;
}

function getOpenDays(settings: RestaurantSettings) {
  return Array.isArray(settings.hours.openDays) ? settings.hours.openDays.filter(Boolean) : [];
}

function isOpenDay(settings: RestaurantSettings, dayIndex: number) {
  const openDays = getOpenDays(settings);
  return openDays.length === 0 || openDays.includes(DAY_LABELS[dayIndex]);
}

function isInsideRange(currentMinutes: number, service: ServiceWindow) {
  if (service.startMinutes === service.endMinutes) return false;
  if (service.startMinutes < service.endMinutes) {
    return currentMinutes >= service.startMinutes && currentMinutes < service.endMinutes;
  }

  return currentMinutes >= service.startMinutes || currentMinutes < service.endMinutes;
}

function createServiceWindow(kind: ServiceKind, start?: string, end?: string): ServiceWindow | null {
  const normalizedStart = formatServiceTime(start ?? "");
  const normalizedEnd = formatServiceTime(end ?? "");
  const startMinutes = timeToMinutes(normalizedStart);
  const endMinutes = timeToMinutes(normalizedEnd);

  if (!normalizedStart || !normalizedEnd || startMinutes === null || endMinutes === null || startMinutes === endMinutes) {
    return null;
  }

  return { kind, start: normalizedStart, end: normalizedEnd, startMinutes, endMinutes };
}

function getConfiguredServices(settings: RestaurantSettings) {
  const hours = settings.hours ?? DEFAULT_HOURS;
  const lunchStart = hours.lunchStart ?? DEFAULT_HOURS.lunchStart;
  const lunchEnd = hours.lunchEnd ?? DEFAULT_HOURS.lunchEnd;
  const dinnerStart = hours.dinnerStart ?? DEFAULT_HOURS.dinnerStart;
  const dinnerEnd = hours.dinnerEnd ?? DEFAULT_HOURS.dinnerEnd;
  const services = [
    createServiceWindow("midi", lunchStart, lunchEnd),
    createServiceWindow("soir", dinnerStart, dinnerEnd),
  ].filter((service): service is ServiceWindow => Boolean(service));

  return services.sort((left, right) => left.startMinutes - right.startMinutes);
}

function getRelativeDayLabel(offset: number, dayIndex: number) {
  if (offset === 0) return "";
  if (offset === 1) return "demain ";
  return `${FULL_DAY_LABELS[dayIndex]} `;
}

function getNextService(settings: RestaurantSettings, now: Date, services: ServiceWindow[]) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset < 8; offset += 1) {
    const checkedDayIndex = (now.getDay() + offset) % 7;
    if (!isOpenDay(settings, checkedDayIndex)) continue;

    const nextService = services.find((service) => offset > 0 || service.startMinutes > currentMinutes);
    if (!nextService) continue;

    return {
      label: `Prochain service ${getRelativeDayLabel(offset, checkedDayIndex)}à ${nextService.start}`,
      time: nextService.start,
    };
  }

  return { label: "Aucun service programmé", time: null };
}

export function getCurrentServiceStatus(settings: RestaurantSettings, now: Date | null): ServiceStatus {
  if (!now) return loadingServiceStatus;

  if (!settings.hours?.automaticMode) {
    return {
      isOpen: false,
      currentService: null,
      title: "Ouverture manuelle",
      subtitle: "Les horaires automatiques sont désactivés",
      nextServiceLabel: null,
      nextServiceTime: null,
    };
  }

  const services = getConfiguredServices(settings);
  if (services.length === 0) {
    return {
      isOpen: false,
      currentService: null,
      title: "Service fermé",
      subtitle: "Aucun service programmé",
      nextServiceLabel: null,
      nextServiceTime: null,
    };
  }

  const currentDayIndex = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayIsOpen = isOpenDay(settings, currentDayIndex);

  if (todayIsOpen) {
    const activeService = services.find((service) => isInsideRange(currentMinutes, service));

    if (activeService) {
      return {
        isOpen: true,
        currentService: activeService.kind,
        title: `Service ${activeService.kind} en cours`,
        subtitle: "Service ouvert",
        nextServiceLabel: null,
        nextServiceTime: null,
      };
    }
  }

  const nextService = getNextService(settings, now, services);

  return {
    isOpen: false,
    currentService: null,
    title: "Service fermé",
    subtitle: nextService.label,
    nextServiceLabel: nextService.label,
    nextServiceTime: nextService.time,
  };
}
