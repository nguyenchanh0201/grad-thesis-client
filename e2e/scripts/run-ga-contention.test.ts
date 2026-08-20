import { describe, expect, it } from "vitest";

import { ContentionProfileValidationError } from "../config/contention-profile";
import {
  mapContentionRunnerErrorToExitCode,
  CONTENTION_EXIT_CODE,
} from "./run-seat-contention";

describe("GA contention runner", () => {
  it("maps an inventory profile mismatch to configuration failure", () => {
    expect(
      mapContentionRunnerErrorToExitCode(
        new ContentionProfileValidationError(["wrong inventory mode"]),
      ),
    ).toBe(CONTENTION_EXIT_CODE.INVALID_CONFIGURATION);
  });
});
