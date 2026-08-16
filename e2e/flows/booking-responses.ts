import { expect, type Page, type Response } from "@playwright/test";

import type { ExecutionProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";

type ReservationStatus =
  | "PENDING"
  | "PAYMENT_LOCKED"
  | "PAID"
  | "CANCELLED"
  | "EXPIRED";

export type BookingResponseSnapshot = {
  reservationId: string | null;
  reservationStatus: ReservationStatus | null;
  paymentStatus: string | null;
  recipientUpdated: boolean;
};

export class BookingResponseObserver {
  private readonly snapshotValue: BookingResponseSnapshot = {
    reservationId: null,
    reservationStatus: null,
    paymentStatus: null,
    recipientUpdated: false,
  };
  private readonly criticalResponses: Array<{ path: string; status: number }> =
    [];
  private targetMismatch: string | null = null;
  private readonly handler = (response: Response) => {
    void this.observe(response);
  };

  constructor(
    private readonly page: Page,
    private readonly profile: ExecutionProfile,
  ) {}

  attach() {
    this.page.on("response", this.handler);
  }

  detach() {
    this.page.off("response", this.handler);
  }

  snapshot(): BookingResponseSnapshot {
    return { ...this.snapshotValue };
  }

  async waitForReservationId(timeoutMs: number) {
    await expect
      .poll(() => this.snapshotValue.reservationId, {
        timeout: timeoutMs,
        intervals: [100, 250, 500, 1_000],
      })
      .not.toBeNull();
    return this.snapshotValue.reservationId;
  }

  async waitForReservationState(
    expected: readonly ReservationStatus[],
    timeoutMs: number,
  ) {
    await expect
      .poll(() => expected.includes(this.snapshotValue.reservationStatus!), {
        timeout: timeoutMs,
        intervals: [100, 250, 500, 1_000, 2_000],
      })
      .toBe(true);
    return this.snapshotValue.reservationStatus;
  }

  assertHealthy() {
    if (this.targetMismatch) {
      throw new JourneyFailure(
        "TARGET_MISMATCH",
        "preflight",
        this.targetMismatch,
      );
    }
    const critical = this.criticalResponses[0];
    if (critical) {
      throw new JourneyFailure(
        "CRITICAL_5XX",
        "preflight",
        `A customer API request returned HTTP ${critical.status}.`,
        critical.status,
      );
    }
  }

  private async observe(response: Response) {
    const url = new URL(response.url());
    if (!isBookingApiPath(url.pathname)) return;

    const allowedOrigins = new Set([
      new URL(this.profile.frontendUrl).origin,
      new URL(this.profile.apiUrl).origin,
    ]);
    if (!allowedOrigins.has(url.origin)) {
      this.targetMismatch =
        "Customer booking traffic reached an origin outside the selected profile.";
      return;
    }
    if (response.status() >= 500) {
      this.criticalResponses.push({
        path: url.pathname,
        status: response.status(),
      });
      return;
    }
    if (!response.ok()) return;

    const method = response.request().method();
    const payload = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object") return;
    const data = unwrapData(payload as Record<string, unknown>);

    if (
      method === "POST" &&
      /\/reservations\/(seated|ga)$/.test(url.pathname)
    ) {
      const id = stringValue(
        (payload as Record<string, unknown>).reservationId,
      );
      if (id) this.snapshotValue.reservationId = id;
    }
    if (
      method === "PATCH" &&
      /\/reservations\/\d+\/recipient$/.test(url.pathname)
    ) {
      this.snapshotValue.recipientUpdated = true;
    }

    const reservationId =
      stringValue(data.reservationId) ?? stringValue(data.id);
    if (reservationId) this.snapshotValue.reservationId = reservationId;
    const reservationStatus =
      reservationState(data.reservationStatus) ?? reservationState(data.status);
    if (reservationStatus)
      this.snapshotValue.reservationStatus = reservationStatus;

    if (data.payment && typeof data.payment === "object") {
      const payment = data.payment as Record<string, unknown>;
      this.snapshotValue.paymentStatus = stringValue(payment.status);
    }
  }
}

function unwrapData(payload: Record<string, unknown>): Record<string, unknown> {
  return payload.data && typeof payload.data === "object"
    ? (payload.data as Record<string, unknown>)
    : payload;
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return null;
}

function reservationState(value: unknown): ReservationStatus | null {
  return ["PENDING", "PAYMENT_LOCKED", "PAID", "CANCELLED", "EXPIRED"].includes(
    String(value),
  )
    ? (String(value) as ReservationStatus)
    : null;
}

function isBookingApiPath(pathname: string) {
  return /\/(events|tickets|reservations|payment|identity)(?:\/|$)/.test(
    pathname,
  );
}
