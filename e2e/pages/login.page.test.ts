import type { Page } from "@playwright/test";
import { describe, expect, it, vi } from "vitest";

import type { ExecutionProfile } from "../config/profile";
import { LoginPage } from "./login.page";

vi.mock("@playwright/test", () => ({
  expect: vi.fn(() => ({
    toBeVisible: vi.fn().mockResolvedValue(undefined),
  })),
}));

const profile = {
  eventSlug: "harmony-night-live",
  email: "admin@example.test",
  password: "demo-password",
  navigationTimeoutMs: 30_000,
} as ExecutionProfile;

describe("LoginPage", () => {
  it("ignores a visible Next.js route announcer outside the login form", async () => {
    const authAlert = {
      waitFor: vi.fn().mockRejectedValue(new Error("not visible")),
      isVisible: vi.fn().mockResolvedValue(false),
    };
    const form = {
      getByRole: vi.fn().mockReturnValue({
        first: vi.fn().mockReturnValue(authAlert),
      }),
    };
    const fill = vi.fn().mockResolvedValue(undefined);
    const click = vi.fn().mockResolvedValue(undefined);
    const page = {
      goto: vi.fn().mockResolvedValue(undefined),
      locator: vi.fn().mockReturnValue(form),
      getByRole: vi.fn((role: string) => {
        if (role === "heading") {
          return { toString: () => "heading" };
        }
        if (role === "textbox") return { fill };
        if (role === "button") return { click };
        throw new Error(`Unexpected role: ${role}`);
      }),
      getByLabel: vi.fn().mockReturnValue({ fill }),
      waitForURL: vi.fn().mockResolvedValue(undefined),
      url: vi
        .fn()
        .mockReturnValue("http://localhost:3000/events/harmony-night-live"),
    };

    await expect(
      new LoginPage(page as unknown as Page).login(profile),
    ).resolves.toBeUndefined();

    expect(page.locator).toHaveBeenCalledWith("form");
    expect(form.getByRole).toHaveBeenCalledWith("alert");
    expect(authAlert.isVisible).toHaveBeenCalled();
  });
});
