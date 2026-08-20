import { describe, expect, it } from "vitest";

import type { ContentionExecutionProfile } from "../config/contention-profile";
import { createContentionResult } from "./contention-evidence";
import { createContentionRun } from "./contention-types";

const profile = {
  profileName: "local",
  runLabel: "local-race",
  frontendUrl: "http://localhost:3000",
  apiUrl: "http://localhost:5004/api/v1",
  apiReadyPath: "/health/ready",
  eventSlug: "race-event",
  eventTitle: "Race Event",
  inventoryMode: "seated",
  seatLabel: "A-1",
  ticketQuantity: 2,
  participants: [
    {
      id: "A",
      label: "Customer A",
      email: "a@example.test",
      password: "secret-a",
      recipientFullName: "Demo A",
      recipientEmail: "a@example.test",
      recipientCountryCode: "+84",
      recipientPhone: "901111111",
    },
    {
      id: "B",
      label: "Customer B",
      email: "b@example.test",
      password: "secret-b",
      recipientFullName: "Demo B",
      recipientEmail: "b@example.test",
      recipientCountryCode: "+84",
      recipientPhone: "902222222",
    },
  ],
  completionMode: "reservation-only",
  navigationTimeoutMs: 30_000,
  waitroomTimeoutMs: 120_000,
  paymentTimeoutMs: 60_000,
  gateTimeoutMs: 30_000,
  resultTimeoutMs: 30_000,
  maxReleaseSkewMs: 2_000,
  reviewPauseMs: 0,
  ticketDialogReviewMs: 0,
  ticketReviewMs: 0,
  headless: true,
  slowMoMs: 0,
  tileWindows: false,
  windowWidth: 960,
  windowHeight: 900,
  diagnosticTrace: false,
} satisfies ContentionExecutionProfile;

function passedRun() {
  const run = createContentionRun(
    "20260816T120000Z-a1b2c3",
    profile,
    new Date("2026-08-16T12:00:00.000Z"),
  );
  run.completedAt = "2026-08-16T12:01:00.000Z";
  run.state = "COMPLETED";
  run.gate.releaseSkewMs = 4;
  run.outcome = {
    classification: "ONE_WINNER_ONE_LOSER",
    winnerParticipantId: "A",
    loserParticipantId: "B",
    winningReservationId: "123",
    targetSeatStatus: "locked",
    verificationScope: "TWO_PARTICIPANTS",
    invariantStatus: "PASS",
  };
  run.participants[0].actualOutcome = "PAYMENT_READY";
  run.participants[0].reservationId = "123";
  run.participants[0].reservationHttpStatus = 201;
  run.participants[0].steps.push({
    name: "login",
    startedAt: "2026-08-16T12:00:01.000Z",
    completedAt: "2026-08-16T12:00:02.000Z",
    status: "PASSED",
    message: "never serialize secret-a or a@example.test",
  });
  run.participants[1].actualOutcome = "LOST";
  run.participants[1].reservationHttpStatus = 409;
  run.continuation = {
    requestedMode: "reservation-only",
    expectedOutcome: "PAYMENT_READY",
    actualOutcome: "PAYMENT_READY",
    status: "PASSED",
    reservationId: "123",
    failure: null,
  };
  return run;
}

const artifacts = {
  customerAVideo: "customer-a.webm",
  customerBVideo: "customer-b.webm",
  customerAScreenshot: null,
  customerBScreenshot: "customer-b-final.png",
  htmlReport: "playwright-report/index.html",
};

describe("createContentionResult", () => {
  it("creates one redacted correlated two-participant result", () => {
    const result = createContentionResult(passedRun(), profile, artifacts);
    const json = JSON.stringify(result);
    expect(result.status).toBe("PASSED");
    expect(result.participants.map((item) => item.id)).toEqual(["A", "B"]);
    expect(json).not.toContain("secret-a");
    expect(json).not.toContain("a@example.test");
    expect(json).not.toContain("C:\\");
    expect(json).toContain("[REDACTED]");
  });

  it("keeps winner continuation failure separate from a passing race", () => {
    const run = passedRun();
    run.continuation.status = "FAILED";
    run.continuation.actualOutcome = "FAILED";
    run.continuation.failure = {
      code: "WINNER_CONTINUATION_FAILURE",
      stage: "payment",
      message: "sandbox timed out",
      httpStatus: null,
    };
    const result = createContentionResult(run, profile, artifacts);
    expect(result.status).toBe("FAILED");
    expect(result.contention.invariantStatus).toBe("PASS");
    expect(result.continuation.status).toBe("FAILED");
  });

  it("rejects absolute or escaping artifact paths", () => {
    expect(() =>
      createContentionResult(passedRun(), profile, {
        ...artifacts,
        customerAVideo: "C:\\private\\customer-a.webm",
      }),
    ).toThrow();
    expect(() =>
      createContentionResult(passedRun(), profile, {
        ...artifacts,
        customerBVideo: "../customer-b.webm",
      }),
    ).toThrow();
  });
});
