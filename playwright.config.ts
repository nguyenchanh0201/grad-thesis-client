import { defineConfig, devices } from "@playwright/test";

const runId = process.env.E2E_RUN_ID ?? "discovery";
const suite = ["seat-contention", "ga-contention"].includes(
  process.env.E2E_SUITE ?? "",
)
  ? process.env.E2E_SUITE!
  : "customer-booking";
const outputRoot = `test-results/${suite}/${runId}`;
const navigationTimeout = Number(
  process.env.E2E_NAVIGATION_TIMEOUT_MS ?? 30_000,
);
const waitroomTimeout = Number(process.env.E2E_WAITROOM_TIMEOUT_MS ?? 120_000);
const paymentTimeout = Number(process.env.E2E_PAYMENT_TIMEOUT_MS ?? 60_000);
const contentionGateTimeout = Number(
  process.env.E2E_CONTENTION_GATE_TIMEOUT_MS ?? 30_000,
);
const contentionResultTimeout = Number(
  process.env.E2E_CONTENTION_RESULT_TIMEOUT_MS ?? 30_000,
);
const contentionReviewMs = Number(process.env.E2E_CONTENTION_REVIEW_MS ?? 0);
const headless = process.env.E2E_HEADLESS !== "false";
const diagnosticTrace = process.env.E2E_DIAGNOSTIC_TRACE === "true";

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: Math.max(
    navigationTimeout * 8 +
      waitroomTimeout +
      paymentTimeout +
      contentionGateTimeout +
      contentionResultTimeout +
      contentionReviewMs,
    120_000,
  ),
  expect: { timeout: navigationTimeout },
  outputDir: `${outputRoot}/raw`,
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: `${outputRoot}/playwright-report`, open: "never" },
    ],
  ],
  use: {
    baseURL: process.env.E2E_FE_URL ?? "http://localhost:3000",
    headless,
    viewport: { width: 1440, height: 900 },
    actionTimeout: navigationTimeout,
    navigationTimeout,
    video: "on",
    screenshot: "only-on-failure",
    trace: diagnosticTrace ? "on" : "off",
    storageState: undefined,
    launchOptions: {
      slowMo: Number(process.env.E2E_SLOW_MO_MS ?? 0),
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: undefined },
    },
  ],
});
