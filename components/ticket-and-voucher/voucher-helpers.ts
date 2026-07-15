import type { AvailableVoucher } from "@/schemas/reservation";
import { fmt } from "@/lib/strings/money";

const DEFAULT_CURRENCY = "VND";

function formatVoucherMoney(
  amount: number | bigint,
  currency = DEFAULT_CURRENCY,
): string {
  return `${fmt(Number(amount))} ${currency}`;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatVoucherDiscount(voucher: AvailableVoucher): string {
  if (voucher.discountType === "percent") {
    const maxAmount =
      voucher.maxDiscountAmount > 0
        ? ` (max ${formatVoucherMoney(voucher.maxDiscountAmount)})`
        : "";

    return `${voucher.discountValue}% off${maxAmount}`;
  }

  return `${formatVoucherMoney(voucher.discountValue)} off`;
}

export function formatVoucherMinOrder(voucher: AvailableVoucher): string {
  return formatVoucherMoney(voucher.minOrderAmount);
}

export function formatVoucherWindow(voucher: AvailableVoucher): string {
  const from = formatDateTime(voucher.startsAt);
  const to = formatDateTime(voucher.endsAt);

  if (!voucher.startsAt && !voucher.endsAt) {
    return "Always active";
  }

  if (!voucher.startsAt) {
    return `Valid until ${to}`;
  }

  if (!voucher.endsAt) {
    return `Valid from ${from}`;
  }

  return `${from} to ${to}`;
}

function formatShortDate(value: string | null): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatVoucherWindowShort(voucher: AvailableVoucher): string {
  if (!voucher.startsAt && !voucher.endsAt) {
    return "Always active";
  }
  if (!voucher.startsAt) {
    return `Until ${formatShortDate(voucher.endsAt)}`;
  }
  if (!voucher.endsAt) {
    return `From ${formatShortDate(voucher.startsAt)}`;
  }
  return `${formatShortDate(voucher.startsAt)} to ${formatShortDate(voucher.endsAt)}`;
}

export function formatVoucherValidUntil(voucher: AvailableVoucher): string {
  if (!voucher.endsAt) {
    return "No expiry";
  }

  const date = new Date(voucher.endsAt);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getVoucherStatus(
  voucher: AvailableVoucher,
): "active" | "upcoming" | "expired" {
  const now = Date.now();
  const startsAtMs = voucher.startsAt
    ? new Date(voucher.startsAt).getTime()
    : null;
  const endsAtMs = voucher.endsAt ? new Date(voucher.endsAt).getTime() : null;

  if (startsAtMs && startsAtMs > now) {
    return "upcoming";
  }
  if (endsAtMs && endsAtMs < now) {
    return "expired";
  }
  return "active";
}
