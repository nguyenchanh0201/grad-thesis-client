import type { Page, Request, Route } from "@playwright/test";
import { describe, expect, it, vi } from "vitest";

import {
  ReservationAttemptGate,
  ReservationAttemptGateError,
  validateReservationRequestMetadata,
} from "./reservation-attempt-gate";

function request(idempotencyKey: string, seatIndex = 7) {
  return {
    url: () => "http://localhost:5004/api/v1/reservations/seated",
    method: () => "POST",
    headers: () => ({ "idempotency-key": idempotencyKey }),
    postDataJSON: () => ({ eventSlug: "race-event", seatIndices: [seatIndex] }),
  } as unknown as Request;
}

function route() {
  return {
    continue: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn().mockResolvedValue(undefined),
  } as unknown as Route;
}

function pageHarness() {
  let handler: ((route: Route, request: Request) => Promise<void>) | undefined;
  const page = {
    route: vi.fn(async (_pattern, value) => {
      handler = value;
    }),
    unroute: vi.fn().mockResolvedValue(undefined),
  } as unknown as Page;
  return { page, invoke: (r: Route, q: Request) => handler!(r, q) };
}

describe("ReservationAttemptGate", () => {
  it("holds two matching requests and releases them with bounded skew", async () => {
    const a = pageHarness();
    const b = pageHarness();
    const gate = new ReservationAttemptGate({
      apiUrl: "http://localhost:5004/api/v1",
      eventSlug: "race-event",
      timeoutMs: 100,
      maxReleaseSkewMs: 2_000,
    });
    await gate.arm({ A: a.page, B: b.page });
    const routeA = route();
    const routeB = route();
    const intercepted = [
      a.invoke(routeA, request("attempt-a")),
      b.invoke(routeB, request("attempt-b")),
    ];

    const snapshot = await gate.waitAndRelease();
    await Promise.all(intercepted);

    expect(routeA.continue).toHaveBeenCalledOnce();
    expect(routeB.continue).toHaveBeenCalledOnce();
    expect(snapshot.state).toBe("RELEASED");
    expect(snapshot.releaseSkewMs).toBeLessThanOrEqual(2_000);
    expect(JSON.stringify(snapshot)).not.toContain("attempt-a");
  });

  it("aborts an unmatched single arrival on timeout", async () => {
    const a = pageHarness();
    const b = pageHarness();
    const gate = new ReservationAttemptGate({
      apiUrl: "http://localhost:5004/api/v1",
      eventSlug: "race-event",
      timeoutMs: 10,
      maxReleaseSkewMs: 2_000,
    });
    await gate.arm({ A: a.page, B: b.page });
    const routeA = route();
    const intercepted = a.invoke(routeA, request("attempt-a"));
    await expect(gate.waitAndRelease()).rejects.toMatchObject({
      code: "SYNCHRONIZATION_TIMEOUT",
    });
    await intercepted;
    expect(routeA.abort).toHaveBeenCalled();
  });
});

describe("validateReservationRequestMetadata", () => {
  it("rejects wrong targets, multiple seats, and missing idempotency", () => {
    const base = {
      requestUrl: "http://localhost:5004/api/v1/reservations/seated",
      method: "POST",
      headers: { "idempotency-key": "one" },
      body: { eventSlug: "race-event", seatIndices: [1] },
      expectedApiUrl: "http://localhost:5004/api/v1",
      expectedEventSlug: "race-event",
    };
    expect(() =>
      validateReservationRequestMetadata({
        ...base,
        body: { eventSlug: "race-event", seatIndices: [1, 2] },
      }),
    ).toThrow(ReservationAttemptGateError);
    expect(() =>
      validateReservationRequestMetadata({ ...base, headers: {} }),
    ).toThrow(/idempotency/i);
  });
});
