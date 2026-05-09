const LOCALE = "en-US";

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

/** Parse ISO datetime string to a Date object. */
export function parseIso(iso: string): Date {
  return new Date(iso);
}

/**
 * ISO datetime string → "13 Jun, 2026"
 *
 * Converts to local time first so the displayed date matches the viewer's
 * calendar (avoids UTC-vs-local off-by-one for UTC+ timezones).
 */
export function fmtIsoDate(iso: string): string {
  const date = new Date(iso);
  const month = date.toLocaleDateString(LOCALE, { month: "short" });
  return `${date.getDate()} ${month}, ${date.getFullYear()}`;
}

/** ISO datetime string → "HH:MM" */
export function fmtIsoTime(iso: string): string {
  return iso.slice(11, 16);
}

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

export const WDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Date → ISO string at local midnight (start-of-day) for API date-range filters. */
export function localDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T00:00:00.000Z`;
}

/** Date → ISO string at local end-of-day for API date-range filters. */
export function localDateToEndOfDayIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T23:59:59.999Z`;
}
