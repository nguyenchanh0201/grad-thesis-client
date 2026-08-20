import { expect } from "@playwright/test";

import { test } from "../fixtures/seat-contention.fixture";

test.skip(
  !process.env.E2E_CONTENTION_PROFILE,
  "Select a named contention profile through the seat-contention runner.",
);

test.describe("live two-customer exact-seat contention @contention", () => {
  test("one customer wins and one receives the real seat conflict", async ({
    contentionFlow,
    contentionRun,
  }) => {
    if (process.env.E2E_KEEP_BROWSER_OPEN === "true") test.setTimeout(0);

    await contentionFlow.execute();

    expect(contentionRun.outcome).toMatchObject({
      classification: "ONE_WINNER_ONE_LOSER",
      invariantStatus: "PASS",
      verificationScope: "TWO_PARTICIPANTS",
    });
    expect(contentionRun.outcome?.winnerParticipantId).toMatch(/^[AB]$/);
    expect(contentionRun.outcome?.loserParticipantId).toMatch(/^[AB]$/);
    expect(contentionRun.outcome?.winningReservationId).toMatch(/^\d+$/);
    expect(contentionRun.gate.releaseSkewMs).toBeLessThanOrEqual(
      contentionRun.gate.maxReleaseSkewMs,
    );
    expect(contentionRun.continuation.status).toBe("PASSED");

    await contentionFlow.holdFinalViewsOpen();
  });
});
