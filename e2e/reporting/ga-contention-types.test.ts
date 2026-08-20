import { describe, expect, it } from "vitest";

import { gaContentionTestProfile } from "../fixtures/ga-contention-profile.fixture";
import { classifyHttpAttempt } from "./contention-types";
import {
  createGaContentionRun,
  markGaVerified,
  resolveGaContentionAttempts,
} from "./ga-contention-types";

describe("GA contention outcome", () => {
  it("accepts one created reservation and one conflict", () => {
    const outcome = resolveGaContentionAttempts(
      classifyHttpAttempt("A", 201, "99"),
      classifyHttpAttempt("B", 409, null),
      gaContentionTestProfile,
    );
    expect(markGaVerified(outcome, "42")).toMatchObject({
      classification: "ONE_WINNER_ONE_LOSER",
      winnerParticipantId: "A",
      loserParticipantId: "B",
      ticketTypeId: "42",
      requestedQuantity: 2,
      invariantStatus: "PASS",
    });
  });

  it("creates a run with the GA target", () => {
    expect(
      createGaContentionRun("run-1", gaContentionTestProfile).target,
    ).toEqual({
      eventSlug: "ga-race-event",
      eventTitle: "GA Race Event",
      ticketTypeName: "GA Contention Demo",
      configuredTicketTypeId: "42",
      requestedQuantity: 2,
    });
  });
});
