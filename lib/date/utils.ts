export function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function fmtDate(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

export function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mo, dy, yr] = m.map(Number);
  const d = new Date(yr, mo - 1, dy);
  return d.getMonth() === mo - 1 ? d : null;
}

export function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function shiftMonth(d: Date, n: number) {
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

export function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function fmtShort(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
