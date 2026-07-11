import { INDIA_TIME_ZONE } from "@/lib/datetime/india";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DD_MM_YYYY = /^(\d{2})-(\d{2})-(\d{4})$/;

/** Calendar date YYYY-MM-DD in Asia/Kolkata for `now`. */
export function todayIsoDateInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatIsoToDdMmYyyy(iso: string): string {
  const trimmed = iso.trim();
  if (!ISO_DATE.test(trimmed)) return "";
  const [y, m, d] = trimmed.split("-");
  return `${d}-${m}-${y}`;
}

export function parseDdMmYyyyToIso(text: string): string | null {
  const raw = text.trim();
  if (!raw) return null;
  const match = raw.match(DD_MM_YYYY);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    year < 1900 ||
    year > 2100
  ) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type PaidOrdersDateFilter = {
  allOrders: boolean;
  fromDate: string;
  toDate: string;
};

export function defaultPaidOrdersDateFilter(
  now: Date = new Date(),
): PaidOrdersDateFilter {
  const today = todayIsoDateInIndia(now);
  return { allOrders: false, fromDate: today, toDate: today };
}

/**
 * Resolve paid list date filter from URL search params.
 * Missing from/to (and not all=1) → today in IST.
 */
export function resolvePaidOrdersDateFilter(params: {
  all?: string | string[] | undefined;
  from?: string | string[] | undefined;
  to?: string | string[] | undefined;
  now?: Date;
}): PaidOrdersDateFilter {
  const allRaw = String(
    Array.isArray(params.all) ? params.all[0] : (params.all ?? ""),
  )
    .trim()
    .toLowerCase();
  if (allRaw === "1" || allRaw === "true" || allRaw === "yes") {
    return { allOrders: true, fromDate: "", toDate: "" };
  }

  const fromRaw = String(
    Array.isArray(params.from) ? params.from[0] : (params.from ?? ""),
  ).trim();
  const toRaw = String(
    Array.isArray(params.to) ? params.to[0] : (params.to ?? ""),
  ).trim();

  const fromDate = ISO_DATE.test(fromRaw) ? fromRaw : "";
  const toDate = ISO_DATE.test(toRaw) ? toRaw : "";

  if (fromDate && toDate) {
    return {
      allOrders: false,
      fromDate: fromDate <= toDate ? fromDate : toDate,
      toDate: fromDate <= toDate ? toDate : fromDate,
    };
  }

  return defaultPaidOrdersDateFilter(params.now);
}

/** Inclusive IST calendar day → half-open UTC instant range for SQL. */
export function indiaDateRangeToUtcBounds(
  fromDate: string,
  toDate: string,
): { startUtc: Date; endExclusiveUtc: Date } | null {
  if (!ISO_DATE.test(fromDate) || !ISO_DATE.test(toDate)) return null;

  const startUtc = new Date(`${fromDate}T00:00:00+05:30`);
  const [y, m, d] = toDate.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const nextIso = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  const endExclusiveUtc = new Date(`${nextIso}T00:00:00+05:30`);

  if (
    Number.isNaN(startUtc.getTime()) ||
    Number.isNaN(endExclusiveUtc.getTime())
  ) {
    return null;
  }

  return { startUtc, endExclusiveUtc };
}

export function describePaidDateFilter(filter: PaidOrdersDateFilter): string {
  if (filter.allOrders) return "All orders";
  const from = formatIsoToDdMmYyyy(filter.fromDate);
  const to = formatIsoToDdMmYyyy(filter.toDate);
  if (from && to && from === to) return from;
  if (from && to) return `${from} – ${to}`;
  return "All orders";
}
