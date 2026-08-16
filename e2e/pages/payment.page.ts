import { expect, type Locator, type Page } from "@playwright/test";

import type { ExecutionProfile, VnpaySandboxProfile } from "../config/profile";
import { JourneyFailure } from "../reporting/failure-classifier";
import type { BookingResponseObserver } from "../flows/booking-responses";

export class PaymentPage {
  constructor(private readonly page: Page) {}

  async verifyPaymentReady(
    profile: ExecutionProfile,
    reservationId: string,
    observer: BookingResponseObserver,
  ) {
    await expect(
      this.page.getByRole("heading", { name: "Review and pay" }),
    ).toBeVisible();
    await observer.waitForReservationState(
      ["PENDING", "PAYMENT_LOCKED"],
      profile.navigationTimeoutMs,
    );
    if (observer.snapshot().reservationId !== reservationId) {
      throw new JourneyFailure(
        "PAYMENT_FAILED",
        "payment",
        "Payment readiness did not match the created reservation.",
      );
    }
  }

  async startMockPayment(profile: ExecutionProfile) {
    const mockRadio = await this.requirePaymentMethod(
      "Mock Payment",
      profile.navigationTimeoutMs,
      "The MockPay method was not offered by the customer payment page.",
    );
    await mockRadio.click();
    await expect(mockRadio).toBeChecked();

    const buyButton = this.page.getByRole("button", {
      name: /^(Buy|Continue payment|Generate new payment link)/,
    });
    await expect(buyButton).toBeEnabled();
    await buyButton.click();
    await this.page.waitForURL(/\/mock-checkout(?:[/?#]|$)/, {
      timeout: profile.paymentTimeoutMs,
    });
  }

  async completeVnpaySandboxPayment(profile: ExecutionProfile) {
    const sandbox = profile.vnpaySandbox;
    if (!sandbox) {
      throw new JourneyFailure(
        "INVALID_PROFILE",
        "payment",
        "VNPay sandbox settings are missing from the selected profile.",
      );
    }

    const vnpayRadio = await this.requirePaymentMethod(
      "VNPay",
      profile.navigationTimeoutMs,
      "The VNPay method was not offered by the customer payment page.",
    );
    await vnpayRadio.click();
    await expect(vnpayRadio).toBeChecked();

    const buyButton = this.page.getByRole("button", {
      name: /^(Buy|Continue payment|Generate new payment link)/,
    });
    await expect(buyButton).toBeEnabled();
    const gatewayNavigation = this.page.waitForURL(
      (url) => isAllowedVnpaySandboxUrl(url, sandbox.origin),
      { timeout: profile.paymentTimeoutMs },
    );
    await buyButton.click();
    await gatewayNavigation;
    await this.page.waitForLoadState("domcontentloaded");

    await this.completeSandboxCardForm(sandbox, profile.paymentTimeoutMs);

    const confirmationUrl = new RegExp(
      `/buy/${escapeRegExp(profile.eventSlug)}/confirmation`,
    );
    const otpInput = await this.waitForOtpOrReturn(
      this.otpInputCandidates(),
      confirmationUrl,
      profile.paymentTimeoutMs,
    );
    if (!otpInput) return;
    await otpInput.fill(sandbox.otp);

    const returnNavigation = this.page.waitForURL(confirmationUrl, {
      timeout: profile.paymentTimeoutMs,
    });
    await this.clickRequired(
      this.confirmPaymentCandidates(),
      "VNPay sandbox did not expose the OTP confirmation button.",
    );
    await returnNavigation;
  }

  private async completeSandboxCardForm(
    sandbox: VnpaySandboxProfile,
    timeoutMs: number,
  ) {
    let cardNumber = await this.waitForVisible(
      this.cardNumberInputCandidates(),
      1_500,
    );

    if (!cardNumber) {
      await this.clickFirstVisible(this.domesticCardCandidates());
      await this.selectSandboxBank(sandbox.bankCode);
      cardNumber = await this.waitForVisible(
        this.cardNumberInputCandidates(),
        timeoutMs,
      );
    }

    if (!cardNumber) {
      throw new JourneyFailure(
        "PAYMENT_FAILED",
        "payment",
        "VNPay sandbox did not display the test-card form.",
      );
    }

    const cardholder = await this.waitForVisible(
      this.cardholderInputCandidates(),
      timeoutMs,
    );
    const issueDate = await this.waitForVisible(
      this.issueDateInputCandidates(),
      timeoutMs,
    );
    if (!cardholder || !issueDate) {
      throw new JourneyFailure(
        "PAYMENT_FAILED",
        "payment",
        "VNPay sandbox cardholder fields were unavailable.",
      );
    }

    await cardNumber.fill(sandbox.cardNumber);
    await cardholder.fill(sandbox.cardholderName);
    await issueDate.fill(sandbox.cardIssueDate);
    await this.clickRequired(
      this.continuePaymentCandidates(),
      "VNPay sandbox did not expose the card confirmation button.",
    );
    const consent = await this.waitForVisible(
      [
        this.page.getByRole("button", {
          name: /^Đồng ý\s*&\s*Tiếp tục$/i,
        }),
        this.page.getByText(/^Đồng ý\s*&\s*Tiếp tục$/i, { exact: true }),
      ],
      5_000,
    );
    if (consent) await consent.click();
  }

  private cardNumberInputCandidates() {
    return [
      this.page.getByLabel(/Số thẻ|Card number/i),
      this.page.getByPlaceholder(/Số thẻ|Card number/i),
      this.page.locator(
        'input[name="card_number"], input[name="cardNumber"], input[id*="card_number" i], input[id*="cardNumber" i], input[autocomplete="cc-number"]',
      ),
    ];
  }

  private cardholderInputCandidates() {
    return [
      this.page.getByLabel(/Tên chủ thẻ|Cardholder|Card holder/i),
      this.page.getByPlaceholder(/Tên chủ thẻ|Cardholder|Card holder/i),
      this.page.locator(
        'input[name="card_holder"], input[name="cardHolder"], input[id*="card_holder" i], input[id*="cardHolder" i], input[autocomplete="cc-name"]',
      ),
    ];
  }

  private issueDateInputCandidates() {
    return [
      this.page.getByLabel(/Ngày phát hành|Ngày hết hạn|Issue date|Expiry/i),
      this.page.getByPlaceholder(
        /Ngày phát hành|Ngày hết hạn|Issue date|Expiry|MM\/YY/i,
      ),
      this.page.locator(
        'input[name="card_date"], input[name="cardDate"], input[id*="card_date" i], input[id*="cardDate" i]',
      ),
    ];
  }

  private otpInputCandidates() {
    return [
      this.page.getByLabel(/OTP|Mã xác thực/i),
      this.page.getByPlaceholder(/OTP|Mã xác thực/i),
      this.page.locator(
        'input[name*="otp" i], input[id*="otp" i], input[autocomplete="one-time-code"]',
      ),
    ];
  }

  private domesticCardCandidates() {
    return [
      this.page.getByRole("button", {
        name: /Thẻ nội địa|tài khoản ngân hàng|Domestic card/i,
      }),
      this.page.getByRole("link", {
        name: /Thẻ nội địa|tài khoản ngân hàng|Domestic card/i,
      }),
      this.page.getByText(
        /Thẻ nội địa và tài khoản ngân hàng|ATM và tài khoản ngân hàng/i,
      ),
    ];
  }

  private bankCandidates(bankCode: string) {
    const bankPattern = new RegExp(`^${escapeRegExp(bankCode)}$`, "i");
    return [
      this.page.getByRole("button", { name: bankPattern }),
      this.page.getByRole("link", { name: bankPattern }),
      this.page.locator("button, a").filter({ hasText: bankPattern }),
      this.page.getByText(bankPattern),
      this.page.locator(`img[alt*="${bankCode}" i]`),
      this.page.locator(`img[src*="${bankCode}" i]`),
      this.page.locator(
        `[data-bank-code="${bankCode}" i], [data-bankcode="${bankCode}" i], [data-code="${bankCode}" i], [value="${bankCode}" i], [onclick*="${bankCode}" i], [href*="${bankCode}" i]`,
      ),
    ];
  }

  private async selectSandboxBank(bankCode: string) {
    let bank = await this.waitForVisible(this.bankCandidates(bankCode), 2_000);
    if (!bank) {
      const search = await this.waitForVisible(
        [
          this.page.getByPlaceholder(/Tìm kiếm|Search/i),
          this.page.locator('input[type="search"]'),
        ],
        5_000,
      );
      if (search) {
        await search.fill("");
        await search.pressSequentially(bankCode, { delay: 100 });
        await search.press("Enter").catch(() => {});
        bank = await this.waitForVisible(this.bankCandidates(bankCode), 10_000);
      }
    }

    if (bank) {
      await bank.click();
      return;
    }
    throw new JourneyFailure(
      "PAYMENT_FAILED",
      "payment",
      `VNPay sandbox did not offer bank ${bankCode}.`,
    );
  }

  private continuePaymentCandidates() {
    const actionName = /^(Tiếp tục|Continue|Xác nhận|Thanh toán|Pay now)$/i;
    return [
      this.page.getByRole("button", {
        name: actionName,
      }),
      this.page.getByRole("link", { name: actionName }),
      this.page.getByText(actionName, { exact: true }),
      this.page.locator(
        'input[type="submit"][value*="Tiếp tục" i], input[type="button"][value*="Tiếp tục" i], input[type="submit"][value*="Continue" i], input[type="button"][value*="Continue" i], input[type="submit"][value*="Xác nhận" i], input[type="button"][value*="Xác nhận" i], input[type="submit"][value*="Thanh toán" i], input[type="button"][value*="Thanh toán" i]',
      ),
    ];
  }

  private confirmPaymentCandidates() {
    const actionName = /^(Xác nhận|Confirm|Tiếp tục|Thanh toán|Pay now)$/i;
    return [
      this.page.getByRole("button", {
        name: actionName,
      }),
      this.page.getByRole("link", { name: actionName }),
      this.page.getByText(actionName, { exact: true }),
      this.page.locator(
        'input[type="submit"][value*="Xác nhận" i], input[type="submit"][value*="Confirm" i], input[type="submit"][value*="Thanh toán" i]',
      ),
    ];
  }

  private async requirePaymentMethod(
    accessibleName: string,
    timeoutMs: number,
    unavailableMessage: string,
  ) {
    const radio = this.page.getByRole("radio", {
      name: accessibleName,
      exact: true,
    });
    const visible = await radio
      .waitFor({ state: "visible", timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);
    if (visible) return radio;

    throw new JourneyFailure(
      "PAYMENT_METHOD_UNAVAILABLE",
      "payment",
      unavailableMessage,
    );
  }

  private async clickRequired(candidates: Locator[], message: string) {
    const locator = await this.waitForVisible(candidates, 10_000);
    if (locator) {
      await locator.click();
      return;
    }
    throw new JourneyFailure("PAYMENT_FAILED", "payment", message);
  }

  private async waitForOtpOrReturn(
    candidates: Locator[],
    confirmationUrl: RegExp,
    timeoutMs: number,
  ) {
    const deadline = Date.now() + timeoutMs;
    do {
      if (confirmationUrl.test(this.page.url())) return null;
      const gatewayError = this.page.getByText(
        /Có lỗi xảy ra trong quá trình xử lý|An error occurred/i,
      );
      if (await gatewayError.isVisible().catch(() => false)) {
        throw new JourneyFailure(
          "PAYMENT_FAILED",
          "payment",
          "VNPay sandbox rejected the configured test transaction.",
        );
      }
      const otp = await this.firstVisible(candidates);
      if (otp) return otp;
      await this.page.waitForTimeout(250);
    } while (Date.now() < deadline);

    throw new JourneyFailure(
      "PAYMENT_FAILED",
      "payment",
      "VNPay sandbox neither returned to the application nor displayed OTP.",
    );
  }

  private async clickFirstVisible(candidates: Locator[]) {
    const locator = await this.firstVisible(candidates);
    if (!locator) return false;
    await locator.click();
    return true;
  }

  private async waitForVisible(candidates: Locator[], timeoutMs: number) {
    const deadline = Date.now() + timeoutMs;
    do {
      const locator = await this.firstVisible(candidates);
      if (locator) return locator;
      await this.page.waitForTimeout(250);
    } while (Date.now() < deadline);
    return null;
  }

  private async firstVisible(candidates: Locator[]) {
    for (const candidate of candidates) {
      const count = await candidate.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const locator = candidate.nth(index);
        if (await locator.isVisible().catch(() => false)) return locator;
      }
    }
    return null;
  }
}

export function isAllowedVnpaySandboxUrl(value: URL, configuredOrigin: string) {
  try {
    const allowed = new URL(configuredOrigin);
    return (
      value.protocol === "https:" &&
      value.origin === allowed.origin &&
      value.hostname === "sandbox.vnpayment.vn"
    );
  } catch {
    return false;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
