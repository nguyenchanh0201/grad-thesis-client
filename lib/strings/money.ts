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

export function formatDisplayPrice(
  price?: string | number,
  defaultCurrency: string = "VND",
) {
  if (price === undefined || price === null) return price;

  const priceStr = String(price);

  // Extract number part: match digits, commas, and dots
  const match = priceStr.match(/[\d.,]+/);
  if (!match) {
    return price; // No numbers found (e.g., "Free")
  }

  const numStr = match[0];
  const lastDotIndex = numStr.lastIndexOf(".");
  const lastCommaIndex = numStr.lastIndexOf(",");
  const lastSeparatorIndex = Math.max(lastDotIndex, lastCommaIndex);

  let numericPrice: number;
  if (lastSeparatorIndex !== -1) {
    const charsAfterSeparator = numStr.length - 1 - lastSeparatorIndex;
    if (charsAfterSeparator === 3) {
      numericPrice = Number(numStr.replace(/[.,]/g, ""));
    } else {
      const integerPart = numStr
        .substring(0, lastSeparatorIndex)
        .replace(/[.,]/g, "");
      const decimalPart = numStr.substring(lastSeparatorIndex + 1);
      numericPrice = Number(`${integerPart}.${decimalPart}`);
    }
  } else {
    numericPrice = Number(numStr);
  }

  if (isNaN(numericPrice)) return price;

  let detectedCurrency = defaultCurrency;
  const upperPrice = priceStr.toUpperCase();
  if (priceStr.includes("₫") || upperPrice.includes("VND"))
    detectedCurrency = "VND";
  else if (priceStr.includes("$") || upperPrice.includes("USD"))
    detectedCurrency = "USD";
  else if (priceStr.includes("¥") || upperPrice.includes("JPY"))
    detectedCurrency = "JPY";
  else if (priceStr.includes("€") || upperPrice.includes("EUR"))
    detectedCurrency = "EUR";

  const formattedNumber = new Intl.NumberFormat("en-US").format(numericPrice);

  // Try to preserve prefixes like "From"
  const prefixMatch = priceStr.match(/^[^\d]+/);
  let prefix = "";
  if (prefixMatch) {
    // Remove any currency symbols from prefix
    prefix = prefixMatch[0]
      .replace(/[₫$¥€]/g, "")
      .replace(/VND|USD|JPY|EUR/i, "")
      .trim();
    if (prefix) prefix += " ";
  }

  return `${prefix}${detectedCurrency} ${formattedNumber}`;
}
