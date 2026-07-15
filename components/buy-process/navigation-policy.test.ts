import { describe, expect, it } from "vitest";
import {
  isNavigationFrozen,
  shouldRedirectToGatewayStep,
} from "./navigation-policy";

describe("navigation-policy", () => {
  it("freezes navigation for initiated payment", () => {
    expect(isNavigationFrozen("INITIATED")).toBe(true);
  });

  it("freezes navigation for failed payment", () => {
    expect(isNavigationFrozen("FAILED")).toBe(true);
  });

  it("freezes navigation for successful payment", () => {
    expect(isNavigationFrozen("SUCCESS")).toBe(true);
  });

  it("keeps navigation open when no payment has started", () => {
    expect(isNavigationFrozen(null)).toBe(false);
  });

  it("redirects backward steps to gateway when flow is frozen", () => {
    expect(shouldRedirectToGatewayStep(3, "INITIATED", false)).toBe(true);
    expect(shouldRedirectToGatewayStep(2, "SUCCESS", false)).toBe(true);
  });

  it("does not redirect gateway step when flow is frozen", () => {
    expect(shouldRedirectToGatewayStep(3, "INITIATED", true)).toBe(false);
  });
});
