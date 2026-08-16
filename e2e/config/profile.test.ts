import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ProfileValidationError,
  loadExecutionProfile,
  projectSafeProfile,
} from "./profile";

const temporaryDirectories: string[] = [];

async function profileDirectory() {
  const directory = await mkdtemp(join(tmpdir(), "booking-profile-"));
  temporaryDirectories.push(directory);
  return directory;
}

function validProfile(overrides: Record<string, string> = {}) {
  return {
    E2E_RUN_LABEL: "local-rehearsal",
    E2E_FE_URL: "http://localhost:3000",
    E2E_API_URL: "http://localhost:5004/api/v1",
    E2E_EMAIL: "observer@example.test",
    E2E_PASSWORD: "super-secret",
    E2E_EVENT_SLUG: "observer-event",
    E2E_EVENT_TITLE: "Observer Event",
    E2E_INVENTORY_MODE: "seated",
    E2E_SEAT_LABEL: "A1",
    E2E_RECIPIENT_FULL_NAME: "Demo Customer",
    E2E_RECIPIENT_EMAIL: "observer@example.test",
    E2E_RECIPIENT_COUNTRY_CODE: "+84",
    E2E_RECIPIENT_PHONE: "901234567",
    E2E_COMPLETION_MODE: "reservation-only",
    ...overrides,
  };
}

async function writeProfile(
  directory: string,
  name: string,
  values: Record<string, string>,
) {
  await writeFile(
    join(directory, `${name}.env`),
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
    "utf8",
  );
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("loadExecutionProfile", () => {
  it("loads required values and applies safe defaults", async () => {
    const directory = await profileDirectory();
    await writeProfile(directory, "local", validProfile());

    const profile = await loadExecutionProfile("local", {
      profilesDirectory: directory,
      environment: {},
    });

    expect(profile).toMatchObject({
      profileName: "local",
      apiReadyPath: "/health/ready",
      inventoryMode: "seated",
      seatSelectionMode: "exact",
      completionMode: "reservation-only",
      navigationTimeoutMs: 30_000,
      waitroomTimeoutMs: 120_000,
      paymentTimeoutMs: 60_000,
      headless: false,
      slowMoMs: 150,
      ticketDialogReviewMs: 5_000,
      ticketReviewMs: 10_000,
      diagnosticTrace: false,
    });
  });

  it("loads an explicit preferred-seat fallback mode", async () => {
    const directory = await profileDirectory();
    await writeProfile(
      directory,
      "local",
      validProfile({
        E2E_SEAT_SELECTION_MODE: "preferred-or-first-available",
      }),
    );

    const profile = await loadExecutionProfile("local", {
      profilesDirectory: directory,
      environment: {},
    });

    expect(profile.seatSelectionMode).toBe("preferred-or-first-available");
  });

  it("loads first-available mode for a repeatable seated demo", async () => {
    const directory = await profileDirectory();
    await writeProfile(
      directory,
      "local",
      validProfile({
        E2E_SEAT_LABEL: "AUTO",
        E2E_SEAT_SELECTION_MODE: "first-available",
      }),
    );

    const profile = await loadExecutionProfile("local", {
      profilesDirectory: directory,
      environment: {},
    });

    expect(profile.seatLabel).toBe("AUTO");
    expect(profile.seatSelectionMode).toBe("first-available");
  });

  it("allows HTTP only for local targets", async () => {
    const directory = await profileDirectory();
    await writeProfile(
      directory,
      "deployed",
      validProfile({ E2E_FE_URL: "http://tickets.example.test" }),
    );

    await expect(
      loadExecutionProfile("deployed", {
        profilesDirectory: directory,
        environment: {},
      }),
    ).rejects.toThrow(/HTTPS/i);
  });

  it("loads a deployed HTTPS profile without changing the schema", async () => {
    const directory = await profileDirectory();
    await writeProfile(
      directory,
      "deployed",
      validProfile({
        E2E_FE_URL: "https://tickets.example.test",
        E2E_API_URL: "https://api.example.test/api/v1",
      }),
    );

    const profile = await loadExecutionProfile("deployed", {
      profilesDirectory: directory,
      environment: {},
    });
    expect(profile.frontendUrl).toBe("https://tickets.example.test");
    expect(profile.apiUrl).toBe("https://api.example.test/api/v1");
  });

  it("reports a missing named profile safely", async () => {
    const directory = await profileDirectory();
    await expect(
      loadExecutionProfile("missing", {
        profilesDirectory: directory,
        environment: { E2E_PASSWORD: "must-not-leak" },
      }),
    ).rejects.toThrow(/was not found/);
  });

  it("enforces supported enums and conditional mock payment fields", async () => {
    const directory = await profileDirectory();
    await writeProfile(
      directory,
      "mock",
      validProfile({ E2E_COMPLETION_MODE: "mock-payment-success" }),
    );

    await expect(
      loadExecutionProfile("mock", {
        profilesDirectory: directory,
        environment: {},
      }),
    ).rejects.toThrow(/E2E_PAYMENT_METHOD/);
  });

  it("loads complete VNPay sandbox settings without exposing card data", async () => {
    const directory = await profileDirectory();
    await writeProfile(
      directory,
      "vnpay",
      validProfile({
        E2E_COMPLETION_MODE: "vnpay-sandbox-success",
        E2E_PAYMENT_METHOD: "vnpay",
        E2E_VNPAY_SANDBOX_ORIGIN: "https://sandbox.vnpayment.vn",
        E2E_VNPAY_BANK_CODE: "NCB",
        E2E_VNPAY_CARD_NUMBER: "9704198526191432198",
        E2E_VNPAY_CARDHOLDER_NAME: "NGUYEN VAN A",
        E2E_VNPAY_CARD_ISSUE_DATE: "07/15",
        E2E_VNPAY_OTP: "123456",
      }),
    );

    const profile = await loadExecutionProfile("vnpay", {
      profilesDirectory: directory,
      environment: {},
    });

    expect(profile.paymentMethod).toBe("vnpay");
    expect(profile.vnpaySandbox?.bankCode).toBe("NCB");
    const projection = JSON.stringify(projectSafeProfile(profile));
    expect(projection).not.toContain("9704198526191432198");
    expect(projection).not.toContain("123456");
  });

  it("rejects VNPay completion outside the official sandbox origin", async () => {
    const directory = await profileDirectory();
    await writeProfile(
      directory,
      "vnpay",
      validProfile({
        E2E_COMPLETION_MODE: "vnpay-sandbox-success",
        E2E_PAYMENT_METHOD: "vnpay",
        E2E_VNPAY_SANDBOX_ORIGIN: "https://payments.example.test",
        E2E_VNPAY_BANK_CODE: "NCB",
        E2E_VNPAY_CARD_NUMBER: "test-card",
        E2E_VNPAY_CARDHOLDER_NAME: "TEST USER",
        E2E_VNPAY_CARD_ISSUE_DATE: "07/15",
        E2E_VNPAY_OTP: "test-otp",
      }),
    );

    await expect(
      loadExecutionProfile("vnpay", {
        profilesDirectory: directory,
        environment: {},
      }),
    ).rejects.toThrow(/official.*sandbox/i);
  });

  it("lets explicit process values override the named profile", async () => {
    const directory = await profileDirectory();
    await writeProfile(directory, "local", validProfile());

    const profile = await loadExecutionProfile("local", {
      profilesDirectory: directory,
      environment: {
        E2E_EVENT_SLUG: "overridden-event",
        E2E_HEADLESS: "true",
        E2E_NAVIGATION_TIMEOUT_MS: "45000",
        E2E_TICKET_DIALOG_REVIEW_MS: "8000",
        E2E_TICKET_REVIEW_MS: "20000",
      },
    });

    expect(profile.eventSlug).toBe("overridden-event");
    expect(profile.headless).toBe(true);
    expect(profile.navigationTimeoutMs).toBe(45_000);
    expect(profile.ticketDialogReviewMs).toBe(8_000);
    expect(profile.ticketReviewMs).toBe(20_000);
  });

  it("aggregates validation failures without exposing password values", async () => {
    const directory = await profileDirectory();
    await writeProfile(directory, "broken", {
      E2E_PASSWORD: "do-not-print-this",
      E2E_FE_URL: "not-a-url",
    });

    const error = await loadExecutionProfile("broken", {
      profilesDirectory: directory,
      environment: {},
    }).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ProfileValidationError);
    expect(String(error)).toContain("E2E_RUN_LABEL");
    expect(String(error)).toContain("E2E_FE_URL");
    expect(String(error)).not.toContain("do-not-print-this");
  });

  it("never includes the password in the display projection", async () => {
    const directory = await profileDirectory();
    await writeProfile(directory, "local", validProfile());
    const profile = await loadExecutionProfile("local", {
      profilesDirectory: directory,
      environment: {},
    });

    expect(projectSafeProfile(profile)).not.toHaveProperty("password");
    expect(JSON.stringify(projectSafeProfile(profile))).not.toContain(
      "super-secret",
    );
  });
});
