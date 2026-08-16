import { describe, expect, it } from "vitest";

import { isAllowedVnpaySandboxUrl } from "./payment.page";

describe("isAllowedVnpaySandboxUrl", () => {
  it("accepts only the configured official VNPay sandbox origin", () => {
    const origin = "https://sandbox.vnpayment.vn";

    expect(
      isAllowedVnpaySandboxUrl(
        new URL("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"),
        origin,
      ),
    ).toBe(true);
    expect(
      isAllowedVnpaySandboxUrl(
        new URL("https://sandbox.vnpayment.vn.evil.test/checkout"),
        origin,
      ),
    ).toBe(false);
    expect(
      isAllowedVnpaySandboxUrl(
        new URL("http://sandbox.vnpayment.vn/paymentv2/vpcpay.html"),
        origin,
      ),
    ).toBe(false);
  });
});
