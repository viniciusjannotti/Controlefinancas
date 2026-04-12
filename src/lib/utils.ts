import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: any): string {
  try {
    if (!date) return "—";
    // Firestore Timestamp object
    if (typeof date === "object" && date.seconds) {
      return new Intl.DateTimeFormat("pt-BR").format(new Date(date.seconds * 1000));
    }
    // ISO date string like "2025-03-15" — must add time to avoid UTC-shift issue
    if (typeof date === "string") {
      const d = date.includes("T") ? new Date(date) : new Date(date + "T12:00:00");
      if (isNaN(d.getTime())) return "—";
      return new Intl.DateTimeFormat("pt-BR").format(d);
    }
    // Date object
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat("pt-BR").format(date);
    }
    return "—";
  } catch {
    return "—";
  }
}
