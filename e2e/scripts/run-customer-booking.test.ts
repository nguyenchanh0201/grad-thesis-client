import { describe, expect, it } from "vitest";

import {
  CliUsageError,
  EXIT_CODE,
  generateRunId,
  mapRunnerErrorToExitCode,
  parseRunnerArguments,
  selectedScenarioTag,
} from "./run-customer-booking";

describe("parseRunnerArguments", () => {
  it("parses profile and presentation flags", () => {
    expect(
      parseRunnerArguments([
        "--",
        "--profile",
        "local",
        "--headed",
        "--trace",
        "--keep-open",
      ]),
    ).toEqual({
      profileName: "local",
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
    { arguments_: ["--profile", "local", "--check", "--keep-open"] },
    { arguments_: ["--profile", "local", "--test", "--keep-open"] },
  ])("rejects invalid arguments: $arguments_", ({ arguments_ }) => {
    expect(() => parseRunnerArguments(arguments_)).toThrow(CliUsageError);
  });
});

describe("generateRunId", () => {
  it("produces a filesystem-safe unique identifier", () => {
    const first = generateRunId(new Date("2026-08-14T12:34:56.000Z"));
    const second = generateRunId(new Date("2026-08-14T12:34:56.000Z"));

    expect(first).toMatch(/^20260814T123456Z-[a-f0-9]{6}$/);
    expect(second).not.toBe(first);
  });
});

describe("mapRunnerErrorToExitCode", () => {
  it("keeps the documented exit-code boundary", () => {
    expect(mapRunnerErrorToExitCode(new CliUsageError("bad input"))).toBe(
      EXIT_CODE.INVALID_CONFIGURATION,
    );
    expect(mapRunnerErrorToExitCode(new Error("journey failed"))).toBe(
      EXIT_CODE.JOURNEY_FAILED,
    );
    expect(
      mapRunnerErrorToExitCode(
        Object.assign(new Error("evidence failed"), {
          name: "EvidenceWriteError",
        }),
      ),
    ).toBe(EXIT_CODE.EVIDENCE_FAILED);
  });
});

describe("selectedScenarioTag", () => {
  it("runs only the scenario selected by the profile", () => {
    expect(selectedScenarioTag("reservation-only")).toBe("@reservation-only");
    expect(selectedScenarioTag("mock-payment-success")).toBe("@mock-payment");
    expect(selectedScenarioTag("vnpay-sandbox-success")).toBe("@vnpay-sandbox");
  });
});
