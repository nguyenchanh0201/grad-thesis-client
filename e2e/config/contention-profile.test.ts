import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  contentionSensitiveValues,
  loadContentionProfile,
  participantExecutionProfile,
  projectSafeContentionProfile,
} from "./contention-profile";

const directories: string[] = [];

function validProfile(overrides: Record<string, string> = {}) {
  return {
    E2E_RUN_LABEL: "local-race",
    E2E_FE_URL: "http://localhost:3000",
    E2E_API_URL: "http://localhost:5004/api/v1",
    E2E_EVENT_SLUG: "race-event",
    E2E_EVENT_TITLE: "Race Event",
    E2E_INVENTORY_MODE: "seated",
    E2E_SEAT_LABEL: "A-1",
    E2E_CUSTOMER_A_LABEL: "Customer A",
    E2E_CUSTOMER_A_EMAIL: "a@example.test",
    E2E_CUSTOMER_A_PASSWORD: "secret-a",
    E2E_CUSTOMER_A_RECIPIENT_FULL_NAME: "Demo A",
    E2E_CUSTOMER_A_RECIPIENT_EMAIL: "a@example.test",
    E2E_CUSTOMER_A_RECIPIENT_COUNTRY_CODE: "+84",
    E2E_CUSTOMER_A_RECIPIENT_PHONE: "901111111",
    E2E_CUSTOMER_B_LABEL: "Customer B",
    E2E_CUSTOMER_B_EMAIL: "b@example.test",
    E2E_CUSTOMER_B_PASSWORD: "secret-b",
    E2E_CUSTOMER_B_RECIPIENT_FULL_NAME: "Demo B",
    E2E_CUSTOMER_B_RECIPIENT_EMAIL: "b@example.test",
    E2E_CUSTOMER_B_RECIPIENT_COUNTRY_CODE: "+84",
    E2E_CUSTOMER_B_RECIPIENT_PHONE: "902222222",
    E2E_COMPLETION_MODE: "reservation-only",
    ...overrides,
  };
}

async function writeProfile(values: Record<string, string>) {
  const directory = await mkdtemp(join(tmpdir(), "contention-profile-"));
  directories.push(directory);
  await writeFile(
    join(directory, "local.env"),
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
    "utf8",
  );
  return directory;
}

afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("loadContentionProfile", () => {
  it("loads two isolated exact-seat participant profiles", async () => {
    const directory = await writeProfile(validProfile());
    const profile = await loadContentionProfile("local", {
      profilesDirectory: directory,
      environment: {},
    });

    expect(profile.participants.map((item) => item.id)).toEqual(["A", "B"]);
    expect(profile.maxReleaseSkewMs).toBe(2_000);
    expect(profile.tileWindows).toBe(true);
    expect(
      participantExecutionProfile(profile, profile.participants[0]),
    ).toMatchObject({ seatSelectionMode: "exact", email: "a@example.test" });
  });

  it.each<Record<string, string>>([
    { E2E_CUSTOMER_B_EMAIL: "A@example.test" },
    { E2E_CUSTOMER_B_LABEL: "Customer A" },
    { E2E_SEAT_LABEL: "AUTO" },
    { E2E_SEAT_LABEL: "" },
    { E2E_FE_URL: "http://tickets.example.test" },
  ])("rejects unsafe cross-field configuration %#", async (override) => {
    const directory = await writeProfile(validProfile(override));
    await expect(
      loadContentionProfile("local", {
        profilesDirectory: directory,
        environment: {},
      }),
    ).rejects.toThrow();
  });

  it("loads a GA ticket type and quantity while reusing both participants", async () => {
    const directory = await writeProfile(
      validProfile({
        E2E_INVENTORY_MODE: "ga",
        E2E_SEAT_LABEL: "",
        E2E_TICKET_TYPE_NAME: "GA Contention Demo",
        E2E_TICKET_TYPE_ID: "42",
        E2E_GA_QUANTITY: "2",
      }),
    );
    const profile = await loadContentionProfile("local", {
      profilesDirectory: directory,
      environment: {},
    });
    expect(profile).toMatchObject({
      inventoryMode: "ga",
      ticketTypeName: "GA Contention Demo",
      ticketTypeId: "42",
      ticketQuantity: 2,
    });
  });

  it("validates official VNPay sandbox settings", async () => {
    const directory = await writeProfile(
      validProfile({
        E2E_COMPLETION_MODE: "vnpay-sandbox-success",
        E2E_PAYMENT_METHOD: "vnpay",
        E2E_VNPAY_SANDBOX_ORIGIN: "https://sandbox.vnpayment.vn",
        E2E_VNPAY_BANK_CODE: "NCB",
        E2E_VNPAY_CARD_NUMBER: "public-card",
        E2E_VNPAY_CARDHOLDER_NAME: "SANDBOX USER",
        E2E_VNPAY_CARD_ISSUE_DATE: "07/15",
        E2E_VNPAY_OTP: "123456",
      }),
    );
    const profile = await loadContentionProfile("local", {
      profilesDirectory: directory,
      environment: {},
    });
    const projection = JSON.stringify(projectSafeContentionProfile(profile));
    expect(projection).not.toContain("public-card");
    expect(projection).not.toContain("123456");
    expect(contentionSensitiveValues(profile)).toContain("secret-a");
  });

  it("does not let legacy single-customer environment keys override participants", async () => {
    const directory = await writeProfile(validProfile());
    const profile = await loadContentionProfile("local", {
      profilesDirectory: directory,
      environment: {
        E2E_EMAIL: "legacy@example.test",
        E2E_PASSWORD: "legacy-secret",
      },
    });
    expect(profile.participants.map((item) => item.email)).toEqual([
      "a@example.test",
      "b@example.test",
    ]);
  });
});
