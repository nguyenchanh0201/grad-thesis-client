import { describe, expect, it } from "vitest";

import {
  classifyHttpAttempt,
  resolveContentionAttempts,
} from "../reporting/contention-types";

describe("seat contention flow resolution", () => {
  it("requires a reservation id only from the winner", () => {
    const result = resolveContentionAttempts(
      classifyHttpAttempt("A", 201, "100"),
      classifyHttpAttempt("B", 409, null),
    );
    expect(result.winningReservationId).toBe("100");
    expect(result.loserParticipantId).toBe("B");
  });

  it("never treats busy, auth, or timeout as an expected loser", () => {
    for (const status of [null, 400, 401, 403, 503, 500]) {
      expect(classifyHttpAttempt("B", status, null).result).not.toBe(
        "CONFLICT",
      );
    }
  });
});
