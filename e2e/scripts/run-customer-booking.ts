import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

import {
  applyProfileOverrides,
  loadExecutionProfile,
  ProfileValidationError,
  projectSafeProfile,
  type CompletionMode,
} from "../config/profile";
import { PreflightError, runTargetPreflight } from "../config/preflight";

export const EXIT_CODE = {
  SUCCESS: 0,
  JOURNEY_FAILED: 1,
  INVALID_CONFIGURATION: 2,
  EVIDENCE_FAILED: 3,
} as const;

export type RunnerArguments = {
  profileName: string;
  headed: boolean;
  trace: boolean;
  check: boolean;
  testSuite: boolean;
  keepOpen: boolean;
};

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

export function parseRunnerArguments(
  arguments_: readonly string[],
): RunnerArguments {
  let profileName: string | undefined;
  let headed = false;
  let trace = false;
  let check = false;
  let testSuite = false;
  let keepOpen = false;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--") continue;
    if (argument === "--profile") {
      const value = arguments_[index + 1];
      if (!value || value.startsWith("--")) {
        throw new CliUsageError("--profile requires a profile name");
      }
      profileName = value;
      index += 1;
      continue;
    }
    if (argument === "--headed") {
      headed = true;
      continue;
    }
    if (argument === "--trace") {
      trace = true;
      continue;
    }
    if (argument === "--check") {
      check = true;
      continue;
    }
    if (argument === "--test") {
      testSuite = true;
      continue;
    }
    if (argument === "--keep-open") {
      keepOpen = true;
      headed = true;
      continue;
    }
    throw new CliUsageError(`Unknown argument: ${argument}`);
  }

  if (!profileName) throw new CliUsageError("--profile is required");
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(profileName)) {
    throw new CliUsageError("Invalid profile name");
  }
  if (check && testSuite) {
    throw new CliUsageError("--check and --test cannot be used together");
  }
  if (keepOpen && (check || testSuite)) {
    throw new CliUsageError(
      "--keep-open is supported only for a single booking journey",
    );
  }

  return { profileName, headed, trace, check, testSuite, keepOpen };
}

export function generateRunId(now = new Date()) {
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  return `${timestamp}-${randomBytes(3).toString("hex")}`;
}

export function mapRunnerErrorToExitCode(error: unknown): number {
  if (
    error instanceof CliUsageError ||
    error instanceof ProfileValidationError ||
    error instanceof PreflightError
  ) {
    return EXIT_CODE.INVALID_CONFIGURATION;
  }
  if (error instanceof Error && error.name === "EvidenceWriteError") {
    return EXIT_CODE.EVIDENCE_FAILED;
  }
  return EXIT_CODE.JOURNEY_FAILED;
}

export async function runCustomerBooking(arguments_: readonly string[]) {
  const options = parseRunnerArguments(arguments_);
  const loadedProfile = await loadExecutionProfile(options.profileName);
  const profile = applyProfileOverrides(loadedProfile, options);
  const preflight = await runTargetPreflight(profile);

  console.log(
    JSON.stringify(
      {
        profile: projectSafeProfile(profile),
        preflight,
        mode: options.check ? "check" : options.testSuite ? "test" : "booking",
        keepBrowserOpen: options.keepOpen,
      },
      null,
      2,
    ),
  );

  if (options.check) return EXIT_CODE.SUCCESS;
  if (profile.diagnosticTrace) {
    console.warn(
      "Diagnostic trace is local-only, may contain sensitive context, and is not part of shareable evidence.",
    );
  }

  const runId = generateRunId();
  const childEnvironment = {
    ...process.env,
    E2E_PROFILE: profile.profileName,
    E2E_RUN_ID: runId,
    E2E_FE_URL: profile.frontendUrl,
    E2E_HEADLESS: String(profile.headless),
    E2E_SLOW_MO_MS: String(profile.slowMoMs),
    E2E_TICKET_DIALOG_REVIEW_MS: String(profile.ticketDialogReviewMs),
    E2E_TICKET_REVIEW_MS: String(profile.ticketReviewMs),
    E2E_NAVIGATION_TIMEOUT_MS: String(profile.navigationTimeoutMs),
    E2E_WAITROOM_TIMEOUT_MS: String(profile.waitroomTimeoutMs),
    E2E_PAYMENT_TIMEOUT_MS: String(profile.paymentTimeoutMs),
    E2E_DIAGNOSTIC_TRACE: String(profile.diagnosticTrace),
    E2E_KEEP_BROWSER_OPEN: String(options.keepOpen),
  };
  const invocation = resolvePnpmInvocation();
  const testArguments = [
    ...invocation.prefixArguments,
    "exec",
    "playwright",
    "test",
    options.testSuite ? "e2e/tests" : "e2e/tests/customer-booking.spec.ts",
    "--project=chromium",
  ];
  if (!options.testSuite) {
    testArguments.push("--grep", selectedScenarioTag(profile.completionMode));
  }
  const result = spawnSync(invocation.command, testArguments, {
    cwd: process.cwd(),
    env: childEnvironment,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) throw result.error;
  return result.status ?? EXIT_CODE.JOURNEY_FAILED;
}

export function selectedScenarioTag(completionMode: CompletionMode) {
  switch (completionMode) {
    case "reservation-only":
      return "@reservation-only";
    case "mock-payment-success":
      return "@mock-payment";
    case "vnpay-sandbox-success":
      return "@vnpay-sandbox";
  }
}

function resolvePnpmInvocation() {
  const npmExecutable = process.env.npm_execpath;
  if (npmExecutable?.endsWith(".cjs") || npmExecutable?.endsWith(".js")) {
    return { command: process.execPath, prefixArguments: [npmExecutable] };
  }
  return {
    command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    prefixArguments: [] as string[],
  };
}

async function main() {
  try {
    process.exitCode = await runCustomerBooking(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    console.error(message);
    process.exitCode = mapRunnerErrorToExitCode(error);
  }
}

if (/run-customer-booking\.(?:ts|js|mts|mjs)$/.test(process.argv[1] ?? "")) {
  void main();
}
