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

export type PaidDateRangePreset =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "last_month"
  | "quarter"
  | "year"
  | "custom"
  | "all";

export const PAID_DATE_RANGE_PRESETS: Array<{
  id: PaidDateRangePreset;
  label: string;
}> = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
  { id: "custom", label: "Custom" },
  { id: "all", label: "All Orders" },
];

export type PaidOrdersDateFilter = {
  allOrders: boolean;
  fromDate: string;
  toDate: string;
  /** How the range was chosen (for UI). */
  range: PaidDateRangePreset;
};

function parseIsoParts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Add calendar days to an ISO date (UTC date arithmetic on the calendar triple). */
export function addIsoDays(iso: string, deltaDays: number): string {
  const { y, m, d } = parseIsoParts(iso);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Monday-start week containing `iso` (ISO calendar week style). */
export function startOfWeekMonday(iso: string): string {
  const { y, m, d } = parseIsoParts(iso);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay(); // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addIsoDays(iso, mondayOffset);
}

export function startOfMonth(iso: string): string {
  const { y, m } = parseIsoParts(iso);
  return toIso(y, m, 1);
}

export function endOfMonth(iso: string): string {
  const { y, m } = parseIsoParts(iso);
  const last = new Date(Date.UTC(y, m, 0));
  return toIso(last.getUTCFullYear(), last.getUTCMonth() + 1, last.getUTCDate());
}

export function startOfQuarter(iso: string): string {
  const { y, m } = parseIsoParts(iso);
  const qStart = Math.floor((m - 1) / 3) * 3 + 1;
  return toIso(y, qStart, 1);
}

export function startOfYear(iso: string): string {
  const { y } = parseIsoParts(iso);
  return toIso(y, 1, 1);
}

export function rangeForPreset(
  preset: Exclude<PaidDateRangePreset, "custom" | "all">,
  now: Date = new Date(),
): { fromDate: string; toDate: string } {
  const today = todayIsoDateInIndia(now);
  switch (preset) {
    case "today":
      return { fromDate: today, toDate: today };
    case "yesterday": {
      const y = addIsoDays(today, -1);
      return { fromDate: y, toDate: y };
    }
    case "week":
      return { fromDate: startOfWeekMonday(today), toDate: today };
    case "month":
      return { fromDate: startOfMonth(today), toDate: today };
    case "last_month": {
      const firstThisMonth = startOfMonth(today);
      const lastDayPrev = addIsoDays(firstThisMonth, -1);
      return {
        fromDate: startOfMonth(lastDayPrev),
        toDate: lastDayPrev,
      };
    }
    case "quarter":
      return { fromDate: startOfQuarter(today), toDate: today };
    case "year":
      return { fromDate: startOfYear(today), toDate: today };
  }
}

export function defaultPaidOrdersDateFilter(
  now: Date = new Date(),
): PaidOrdersDateFilter {
  const { fromDate, toDate } = rangeForPreset("today", now);
  return { allOrders: false, fromDate, toDate, range: "today" };
}

function parseRangeParam(
  raw: string | string[] | undefined,
): PaidDateRangePreset | null {
  const value = String(Array.isArray(raw) ? raw[0] : (raw ?? ""))
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  const aliases: Record<string, PaidDateRangePreset> = {
    today: "today",
    yesterday: "yesterday",
    week: "week",
    this_week: "week",
    month: "month",
    this_month: "month",
    last_month: "last_month",
    quarter: "quarter",
    year: "year",
    this_year: "year",
    custom: "custom",
    all: "all",
  };
  return aliases[value] ?? null;
}

/**
 * Resolve paid list date filter from URL search params.
 * Missing range/from/to (and not all=1) → today in IST.
 */
export function resolvePaidOrdersDateFilter(params: {
  all?: string | string[] | undefined;
  from?: string | string[] | undefined;
  to?: string | string[] | undefined;
  range?: string | string[] | undefined;
  now?: Date;
}): PaidOrdersDateFilter {
  const now = params.now ?? new Date();
  const allRaw = String(
    Array.isArray(params.all) ? params.all[0] : (params.all ?? ""),
  )
    .trim()
    .toLowerCase();
  if (allRaw === "1" || allRaw === "true" || allRaw === "yes") {
    return { allOrders: true, fromDate: "", toDate: "", range: "all" };
  }

  const range = parseRangeParam(params.range);

  if (range === "all") {
    return { allOrders: true, fromDate: "", toDate: "", range: "all" };
  }

  if (range && range !== "custom") {
    const bounds = rangeForPreset(range, now);
    return { allOrders: false, ...bounds, range };
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
      range: "custom",
    };
  }

  return defaultPaidOrdersDateFilter(now);
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
  if (filter.allOrders || filter.range === "all") return "All orders";
  const preset = PAID_DATE_RANGE_PRESETS.find((p) => p.id === filter.range);
  if (preset && filter.range !== "custom") return preset.label;
  const from = formatIsoToDdMmYyyy(filter.fromDate);
  const to = formatIsoToDdMmYyyy(filter.toDate);
  if (from && to && from === to) return from;
  if (from && to) return `${from} – ${to}`;
  return "All orders";
}

export function paidDateFilterIsDefaultToday(
  filter: PaidOrdersDateFilter,
  now: Date = new Date(),
): boolean {
  if (filter.allOrders || filter.range !== "today") return false;
  const today = todayIsoDateInIndia(now);
  return filter.fromDate === today && filter.toDate === today;
}
