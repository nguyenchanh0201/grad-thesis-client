export const fmt = (n: number) => n.toLocaleString("vi-VN");

export function formatPrice(
  amount: number | bigint,
  currency: string,
  toAmount?: number | bigint,
): string {
  const format = (v: number | bigint) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
      Number(v),
    );
  return toAmount !== undefined && toAmount !== amount
    ? `${format(amount)} – ${format(toAmount)}`
    : format(amount);
}
