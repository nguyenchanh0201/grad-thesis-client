import { expect, test } from "@playwright/test";

import type { WinnerContinuation } from "../reporting/contention-types";

test.describe("winner continuation contract @contention-contract", () => {
  test("reservation-only preserves the winning reservation", () => {
    const continuation: WinnerContinuation = {
      requestedMode: "reservation-only",
      expectedOutcome: "PAYMENT_READY",
      actualOutcome: "PAYMENT_READY",
      status: "PASSED",
      reservationId: "123",
      failure: null,
    };
    expect(continuation).toMatchObject({
      reservationId: "123",
      status: "PASSED",
      actualOutcome: "PAYMENT_READY",
    });
  });

  test("later payment failure remains a continuation-only failure", () => {
    const continuation: WinnerContinuation = {
      requestedMode: "vnpay-sandbox-success",
      expectedOutcome: "PAID",
      actualOutcome: "FAILED",
      status: "FAILED",
      reservationId: "123",
      failure: {
        code: "WINNER_CONTINUATION_FAILURE",
        stage: "payment",
        message: "sandbox timeout",
        httpStatus: null,
      },
    };
    expect(continuation.failure?.code).toBe("WINNER_CONTINUATION_FAILURE");
    expect(continuation.reservationId).toBe("123");
  });
});
