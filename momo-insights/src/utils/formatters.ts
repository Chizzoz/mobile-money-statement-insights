import { format, parse } from "date-fns";

const CURRENCY_ALIASES: Record<string, string> = {
  zmk: "ZMW",
  zmw: "ZMW",
  kwacha: "ZMW",
};

export function normalizeCurrency(raw?: string): string {
  if (!raw) return "ZMW";
  const key = raw.trim().toLowerCase();
  return CURRENCY_ALIASES[key] ?? raw.trim().toUpperCase();
}

export function parseAmount(value: string): number {
  return parseFloat(value.replace(/,/g, "").trim()) || 0;
}

export function formatCurrency(amount: number, currency = "ZMW"): string {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date): string {
  return format(date, "dd MMM yyyy, h:mm a");
}

export function formatShortDate(date: Date): string {
  return format(date, "dd MMM");
}

export function parseAirtelPeriodDate(value: string): Date {
  return parse(value.trim(), "dd-MMM-yy", new Date());
}

export function parseAirtelTransactionDate(value: string): Date {
  return parse(value.trim(), "dd-MM-yy h:mm a", new Date());
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
