import { describe, expect, it } from "vitest";

import {
  CONTENTION_EXIT_CODE,
  ContentionCliUsageError,
  mapContentionRunnerErrorToExitCode,
  parseContentionRunnerArguments,
  resolveContentionChildExit,
} from "./run-seat-contention";

describe("parseContentionRunnerArguments", () => {
  it("parses the live presentation flags", () => {
    expect(
      parseContentionRunnerArguments([
        "--",
        "--profile",
        "local-contention",
        "--headed",
        "--trace",
        "--keep-open",
      ]),
    ).toEqual({
      profileName: "local-contention",
      headed: true,
      trace: true,
      check: false,
      testSuite: false,
      keepOpen: true,
    });
  });

  it.each([
    { arguments_: [] },
    { arguments_: ["--profile"] },
    { arguments_: ["--profile", "../secret"] },
    { arguments_: ["--profile", "local", "--unknown"] },
    { arguments_: ["--profile", "local", "--check", "--test"] },
    { arguments_: ["--profile", "local", "--test", "--keep-open"] },
  ])("rejects invalid input %#", ({ arguments_ }) => {
    expect(() => parseContentionRunnerArguments(arguments_)).toThrow(
      ContentionCliUsageError,
    );
  });
});

describe("mapContentionRunnerErrorToExitCode", () => {
  it("preserves configuration, journey, and evidence boundaries", () => {
    expect(
      mapContentionRunnerErrorToExitCode(
        new ContentionCliUsageError("bad input"),
      ),
    ).toBe(CONTENTION_EXIT_CODE.INVALID_CONFIGURATION);
    expect(mapContentionRunnerErrorToExitCode(new Error("race failed"))).toBe(
      CONTENTION_EXIT_CODE.CONTENTION_FAILED,
    );
    expect(
      mapContentionRunnerErrorToExitCode(
        Object.assign(new Error("video failed"), {
          name: "EvidenceWriteError",
        }),
      ),
    ).toBe(CONTENTION_EXIT_CODE.EVIDENCE_FAILED);
  });

  it("maps a failed browser run without a result bundle to evidence failure", () => {
    expect(resolveContentionChildExit(1, false)).toBe(
      CONTENTION_EXIT_CODE.EVIDENCE_FAILED,
    );
    expect(resolveContentionChildExit(1, true)).toBe(
      CONTENTION_EXIT_CODE.CONTENTION_FAILED,
    );
    expect(resolveContentionChildExit(0, true)).toBe(
      CONTENTION_EXIT_CODE.SUCCESS,
    );
  });
});
