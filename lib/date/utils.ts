const LOCALE = "en-US";

// ─── Calendar / Date helpers ──────────────────────────────────────────────────

export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function shiftMonth(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function calDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i));
  while (days.length % 7) days.push(null);
  return days;
}

// ─── ISO string helpers ───────────────────────────────────────────────────────

/** Parse ISO datetime string to a Date object. */
export function parseIso(iso: string): Date {
  return new Date(iso);
}

/**
 * ISO datetime string → "13 Jun, 2026"
 *
 * Reads the date component directly from the string to avoid timezone shifts —
 * the displayed date is always the event's local calendar date, not UTC.
 */
export function fmtIsoDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const month = new Date(y, m - 1, 1).toLocaleDateString(LOCALE, {
    month: "short",
  });
  return `${d} ${month}, ${y}`;
}

/** ISO datetime string → "HH:MM" */
export function fmtIsoTime(iso: string): string {
  return iso.slice(11, 16);
}

// ─── Date object formatters ───────────────────────────────────────────────────

/** Date → "MM/DD/YYYY" (form inputs) */
export function fmtDate(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Date → "13 Jun, 2026" (detail views, confirmations) */
export function fmtDisplayDate(d: Date): string {
  const month = d.toLocaleDateString(LOCALE, { month: "short" });
  return `${d.getDate()} ${month}, ${d.getFullYear()}`;
}

/** Date → "Jun 13" (compact card display) */
export function fmtShort(d: Date): string {
  return d.toLocaleDateString(LOCALE, { month: "short", day: "numeric" });
}

/** Date → "June 2026" (calendar headers) */
export function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
}

// ─── Input parsing / formatting ───────────────────────────────────────────────

export function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mo, dy, yr] = m.map(Number);
  const d = new Date(yr, mo - 1, dy);
  return d.getMonth() === mo - 1 ? d : null;
}

export function autoFormatDateInput(raw: string): string {
  let d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length >= 1 && parseInt(d[0]) > 1) d = "0" + d;
  if (d.length >= 3 && parseInt(d[2]) > 3) d = d.slice(0, 2) + "0" + d.slice(2);
  d = d.slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const WDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
