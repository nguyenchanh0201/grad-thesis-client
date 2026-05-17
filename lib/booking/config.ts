const DEFAULT_TIMEOUT_REDIRECT_DELAY_MS = 1600;
const DEFAULT_RESERVATION_POLL_INTERVAL_MS = 5000;

function parsePositiveInt(input: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(input ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const TIMEOUT_REDIRECT_DELAY_MS = parsePositiveInt(
  process.env.NEXT_PUBLIC_BUY_TIMEOUT_REDIRECT_DELAY_MS,
  DEFAULT_TIMEOUT_REDIRECT_DELAY_MS,
);

export const RESERVATION_POLL_INTERVAL_MS = parsePositiveInt(
  process.env.NEXT_PUBLIC_RESERVATION_POLL_INTERVAL_MS,
  DEFAULT_RESERVATION_POLL_INTERVAL_MS,
);
