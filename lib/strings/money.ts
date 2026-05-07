export const fmt = (n: number) => n.toLocaleString("vi-VN");

export function formatPrice(
  cents: number | bigint,
  currency: string,
  toCents?: number | bigint,
): string {
  const format = (c: number | bigint) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
      Number(c) / 100,
    );
  return toCents !== undefined && toCents !== cents
    ? `${format(cents)} – ${format(toCents)}`
    : format(cents);
}
