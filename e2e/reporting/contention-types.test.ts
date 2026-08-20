import { describe, expect, it } from "vitest";

import {
  classifyHttpAttempt,
  markVerified,
  resolveContentionAttempts,
} from "./contention-types";

describe("resolveContentionAttempts", () => {
  it.each([
    ["A", 201, "10", "B", 409, null, "A", "B"],
    ["A", 409, null, "B", 201, "11", "B", "A"],
  ] as const)(
    "accepts either winner ordering %#",
    (aId, aStatus, aReservation, bId, bStatus, bReservation, winner, loser) => {
      const result = resolveContentionAttempts(
        classifyHttpAttempt(aId, aStatus, aReservation),
        classifyHttpAttempt(bId, bStatus, bReservation),
      );
      expect(result).toMatchObject({
        classification: "ONE_WINNER_ONE_LOSER",
        winnerParticipantId: winner,
        loserParticipantId: loser,
        invariantStatus: "INCONCLUSIVE",
      });
      expect(markVerified(result, "locked").invariantStatus).toBe("PASS");
    },
  );

  it("classifies dual create as a critical invariant failure", () => {
    const result = resolveContentionAttempts(
      classifyHttpAttempt("A", 201, "10"),
      classifyHttpAttempt("B", 201, "11"),
    );
    expect(result).toMatchObject({
      classification: "BOTH_CREATED",
      invariantStatus: "FAIL",
    });
  });

  it.each([
    [409, 409, "BOTH_CONFLICTED"],
    [503, 503, "BOTH_ATTEMPTS_FAILED"],
    [400, 409, "PRECONDITION_FAILED"],
    [403, 409, "PRECONDITION_FAILED"],
  ])("keeps non-winner pairs non-passing %#", (a, b, classification) => {
    const result = resolveContentionAttempts(
      classifyHttpAttempt("A", a, null),
      classifyHttpAttempt("B", b, null),
    );
    expect(result.classification).toBe(classification);
    expect(result.invariantStatus).not.toBe("PASS");
  });
});
