import { expect, test } from "@playwright/test";

import {
  classifyHttpAttempt,
  resolveContentionAttempts,
} from "../reporting/contention-types";

test.describe("seat contention failure rehearsals @contention-contract", () => {
  test("dual create is a critical invariant failure", () => {
    expect(
      resolveContentionAttempts(
        classifyHttpAttempt("A", 201, "1"),
        classifyHttpAttempt("B", 201, "2"),
      ),
    ).toMatchObject({
      classification: "BOTH_CREATED",
      invariantStatus: "FAIL",
    });
  });

  test("dual conflict and busy outcomes remain inconclusive", () => {
    expect(
      resolveContentionAttempts(
        classifyHttpAttempt("A", 409, null),
        classifyHttpAttempt("B", 409, null),
      ).invariantStatus,
    ).toBe("INCONCLUSIVE");
    expect(
      resolveContentionAttempts(
        classifyHttpAttempt("A", 503, null),
        classifyHttpAttempt("B", 503, null),
      ).classification,
    ).toBe("BOTH_ATTEMPTS_FAILED");
  });
});
