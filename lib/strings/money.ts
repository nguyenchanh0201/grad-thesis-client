export function formatPrice(
  from: number,
  to: number | undefined,
  currency: string,
) {
  const fmt = (n: number) => n.toLocaleString("vi-VN");
  return to && to !== from
    ? `From ${fmt(from)} to ${fmt(to)} ${currency}`
    : `From ${fmt(from)} ${currency}`;
}
