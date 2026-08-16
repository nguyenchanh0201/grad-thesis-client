import { describe, expect, it } from "vitest";

import { PreflightError } from "../config/preflight";
import { ProfileValidationError } from "../config/profile";
import {
  EvidenceWriteError,
  JourneyFailure,
  classifyFailure,
} from "./failure-classifier";
import type { FailureCode, JourneyStep } from "./types";

describe("classifyFailure", () => {
  it.each<{
    step: JourneyStep;
    code: FailureCode;
  }>([
    { step: "login", code: "AUTHENTICATION_FAILED" },
    { step: "event", code: "EVENT_PRECONDITION_FAILED" },
    { step: "waitroom", code: "WAITROOM_TERMINAL" },
    { step: "seat", code: "INVENTORY_UNAVAILABLE" },
    { step: "reservation", code: "RESERVATION_FAILED" },
    { step: "recipient", code: "RECIPIENT_FAILED" },
    { step: "payment", code: "PAYMENT_FAILED" },
    { step: "confirmation", code: "CONFIRMATION_FAILED" },
  ])("maps an ordinary $step error to $code", ({ step, code }) => {
    expect(classifyFailure(new Error("failed"), step).code).toBe(code);
  });

  it("preserves intentional business classifications", () => {
    const result = classifyFailure(
      new JourneyFailure(
        "ACTIVE_CHECKOUT_PRECONDITION",
        "event",
        "Active checkout exists",
        409,
      ),
      "event",
    );

    expect(result).toEqual({
      code: "ACTIVE_CHECKOUT_PRECONDITION",
      step: "event",
      message: "An unfinished checkout already exists for this customer.",
      httpStatus: 409,
    });
  });

  it("classifies profile, target, critical 5xx, and evidence failures", () => {
    expect(
      classifyFailure(new ProfileValidationError(["bad"]), "preflight").code,
    ).toBe("INVALID_PROFILE");
    expect(
      classifyFailure(
        new PreflightError("TARGET_MISMATCH", "wrong"),
        "preflight",
      ).code,
    ).toBe("TARGET_MISMATCH");
    expect(
      classifyFailure(
        Object.assign(new Error("server"), { httpStatus: 503 }),
        "payment",
      ).code,
    ).toBe("CRITICAL_5XX");
    expect(
      classifyFailure(new EvidenceWriteError("disk"), "evidence").code,
    ).toBe("EVIDENCE_FAILED");
  });

  it("never includes raw passwords, tokens, cookies, or response bodies", () => {
    const result = classifyFailure(
      new JourneyFailure(
        "PAYMENT_FAILED",
        "payment",
        "password=hunter2 Authorization: Bearer abc cookie=session-secret body={secret}",
      ),
      "payment",
      ["hunter2", "session-secret"],
    );

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("session-secret");
    expect(serialized).not.toContain("Bearer abc");
    expect(serialized).not.toContain("body={secret}");
  });
});
