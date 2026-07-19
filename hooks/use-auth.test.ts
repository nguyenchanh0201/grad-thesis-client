import { beforeEach, describe, expect, it } from "vitest";

import { getCurrentAuthPath } from "@/hooks/use-auth";

describe("auth hook helpers", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/auth/login");
  });

  it("identifies login as the default Google auth return context", () => {
    window.history.replaceState(null, "", "/auth/login?redirect=%2Fevents");

    expect(getCurrentAuthPath()).toBe("/auth/login");
  });

  it("preserves register as the Google auth return context", () => {
    window.history.replaceState(null, "", "/auth/register?redirect=%2Fevents");

    expect(getCurrentAuthPath()).toBe("/auth/register");
  });
});
