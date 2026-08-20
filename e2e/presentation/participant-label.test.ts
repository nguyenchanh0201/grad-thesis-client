import { describe, expect, it } from "vitest";

import { sanitizeParticipantLabel } from "./participant-label";

describe("sanitizeParticipantLabel", () => {
  it("accepts stable non-secret labels", () => {
    expect(sanitizeParticipantLabel("Customer A")).toBe("Customer A");
    expect(sanitizeParticipantLabel("Khach B")).toBe("Khach B");
  });

  it.each(["a@example.test", "password A", "OTP B", "", "x".repeat(41)])(
    "rejects unsafe label %s",
    (value) => expect(() => sanitizeParticipantLabel(value)).toThrow(),
  );
});
