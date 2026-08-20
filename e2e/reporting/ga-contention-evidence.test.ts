import { describe, expect, it } from "vitest";

import { createGaContentionResult } from "./ga-contention-evidence";
import { createGaContentionRun } from "./ga-contention-types";
import { gaContentionTestProfile } from "../fixtures/ga-contention-profile.fixture";

describe("createGaContentionResult", () => {
  it("writes a redacted two-video GA result", () => {
    const run = createGaContentionRun(
      "20260820T120000Z-ga",
      gaContentionTestProfile,
      new Date("2026-08-20T12:00:00.000Z"),
    );
    run.completedAt = "2026-08-20T12:01:00.000Z";
    run.state = "COMPLETED";
    run.gate.releaseSkewMs = 5;
    run.outcome = {
      classification: "ONE_WINNER_ONE_LOSER",
      winnerParticipantId: "A",
      loserParticipantId: "B",
      winningReservationId: "99",
      ticketTypeId: "42",
      ticketTypeName: "GA Contention Demo",
      requestedQuantity: 2,
      verificationScope: "TWO_PARTICIPANTS",
      invariantStatus: "PASS",
    };
    run.continuation = {
      requestedMode: "reservation-only",
      expectedOutcome: "PAYMENT_READY",
      actualOutcome: "PAYMENT_READY",
      status: "PASSED",
      reservationId: "99",
      failure: null,
    };
    run.participants[0].steps.push({
      name: "login",
      startedAt: "2026-08-20T12:00:01.000Z",
      completedAt: "2026-08-20T12:00:02.000Z",
      status: "PASSED",
      message: "hide secret-a",
    });
    const result = createGaContentionResult(run, gaContentionTestProfile, {
      customerAVideo: "customer-a.webm",
      customerBVideo: "customer-b.webm",
      customerAScreenshot: null,
      customerBScreenshot: null,
      htmlReport: "playwright-report/index.html",
    });
    expect(result.status).toBe("PASSED");
    expect(result.requestedQuantityPerCustomer).toBe(2);
    expect(JSON.stringify(result)).not.toContain("secret-a");
  });
});
