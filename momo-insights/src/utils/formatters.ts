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

export function parseAirtelBalancePeriodDate(value: string): Date {
  return parse(value.trim(), "dd MMM yyyy", new Date());
}

export function parseAirtelBalanceDateTime(dateStr: string, timeStr: string): Date {
  return parse(`${dateStr.trim()} ${timeStr.trim()}`, "dd/MM/yy HH:mm", new Date());
}

/** Parses dates like "03 Jul 2026" (1- or 2-digit day, abbreviated month, full year). */
export function parseDayMonthYear(value: string): Date {
  return parse(value.trim(), "d MMM yyyy", new Date());
}

/** Parses dates like "7 February 2026" (1- or 2-digit day, full month name, full year). */
export function parseFullMonthDayYear(value: string): Date {
  return parse(value.trim(), "d MMMM yyyy", new Date());
}

/** Resolves the year for a "17 Feb" style date (no year) given the statement's period bounds. */
export function resolveYearForDayMonth(monthIndex: number, periodFrom: Date, periodTo: Date): number {
  const fromYear = periodFrom.getFullYear();
  const toYear = periodTo.getFullYear();
  if (fromYear === toYear) return fromYear;
  return monthIndex >= periodFrom.getMonth() ? fromYear : toYear;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
