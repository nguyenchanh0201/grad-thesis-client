import { expect } from "@playwright/test";

import { test } from "../fixtures/ga-contention.fixture";

test.describe("two-customer GA quantity contention", () => {
  test("allows exactly one customer to reserve the remaining quantity", async ({
    gaContentionFlow,
    gaContentionRun,
  }) => {
    await gaContentionFlow.execute();

    expect(gaContentionRun.state).toBe("COMPLETED");
    expect(gaContentionRun.outcome).toMatchObject({
      classification: "ONE_WINNER_ONE_LOSER",
      invariantStatus: "PASS",
      verificationScope: "TWO_PARTICIPANTS",
      requestedQuantity: gaContentionRun.target.requestedQuantity,
    });
    expect(gaContentionRun.outcome?.winnerParticipantId).toMatch(/^[AB]$/);
    expect(gaContentionRun.outcome?.loserParticipantId).toMatch(/^[AB]$/);
    expect(gaContentionRun.outcome?.winningReservationId).toMatch(/^\d+$/);
    expect(gaContentionRun.gate.releaseSkewMs).toBeLessThanOrEqual(
      gaContentionRun.gate.maxReleaseSkewMs,
    );
    expect(gaContentionRun.continuation.status).toBe("PASSED");

    await gaContentionFlow.holdFinalViewsOpen();
  });
});
