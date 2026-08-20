import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  applyContentionOverrides,
  ContentionProfileValidationError,
  loadContentionProfile,
  participantExecutionProfile,
  projectSafeContentionProfile,
} from "../config/contention-profile";
import { PreflightError, runTargetPreflight } from "../config/preflight";
import { generateRunId } from "./run-customer-booking";

export const CONTENTION_EXIT_CODE = {
  SUCCESS: 0,
  CONTENTION_FAILED: 1,
  INVALID_CONFIGURATION: 2,
  EVIDENCE_FAILED: 3,
} as const;

export type ContentionRunnerArguments = {
  profileName: string;
  headed: boolean;
  trace: boolean;
  check: boolean;
  testSuite: boolean;
  keepOpen: boolean;
};

export class ContentionCliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentionCliUsageError";
  }
}

export function parseContentionRunnerArguments(
  arguments_: readonly string[],
): ContentionRunnerArguments {
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
        throw new ContentionCliUsageError("--profile requires a profile name");
      }
      profileName = value;
      index += 1;
    } else if (argument === "--headed") {
      headed = true;
    } else if (argument === "--trace") {
      trace = true;
    } else if (argument === "--check") {
      check = true;
    } else if (argument === "--test") {
      testSuite = true;
    } else if (argument === "--keep-open") {
      keepOpen = true;
      headed = true;
    } else {
      throw new ContentionCliUsageError(`Unknown argument: ${argument}`);
    }
  }
  if (!profileName) throw new ContentionCliUsageError("--profile is required");
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(profileName)) {
    throw new ContentionCliUsageError("Invalid profile name");
  }
  if (check && testSuite) {
    throw new ContentionCliUsageError(
      "--check and --test cannot be used together",
    );
  }
  if (keepOpen && (check || testSuite)) {
    throw new ContentionCliUsageError(
      "--keep-open is supported only for a live contention run",
    );
  }
  return { profileName, headed, trace, check, testSuite, keepOpen };
}

export function mapContentionRunnerErrorToExitCode(error: unknown) {
  if (
    error instanceof ContentionCliUsageError ||
    error instanceof ContentionProfileValidationError ||
    error instanceof PreflightError
  ) {
    return CONTENTION_EXIT_CODE.INVALID_CONFIGURATION;
  }
  if (error instanceof Error && error.name === "EvidenceWriteError") {
    return CONTENTION_EXIT_CODE.EVIDENCE_FAILED;
  }
  return CONTENTION_EXIT_CODE.CONTENTION_FAILED;
}

export async function runSeatContention(arguments_: readonly string[]) {
  const options = parseContentionRunnerArguments(arguments_);
  const loaded = await loadContentionProfile(options.profileName);
  if (loaded.inventoryMode !== "seated") {
    throw new ContentionProfileValidationError([
      "E2E_INVENTORY_MODE must be seated for e2e:contention",
    ]);
  }
  const profile = applyContentionOverrides(loaded, options);
  const preflight = options.testSuite
    ? null
    : await runTargetPreflight(
        participantExecutionProfile(profile, profile.participants[0]),
      );

  console.log(
    JSON.stringify(
      {
        profile: projectSafeContentionProfile(profile),
        preflight,
        mode: options.check
          ? "check"
          : options.testSuite
            ? "contention-tests"
            : "seat-contention",
        keepBrowserOpen: options.keepOpen,
      },
      null,
      2,
    ),
  );
  if (options.check) return CONTENTION_EXIT_CODE.SUCCESS;
  if (profile.diagnosticTrace) {
    console.warn(
      "Diagnostic trace is local-only, may contain sensitive context, and is excluded from shareable evidence.",
    );
  }

  const invocation = resolvePnpmInvocation();
  const runId = generateRunId();
  const childEnvironment = {
    ...process.env,
    E2E_CONTENTION_PROFILE: profile.profileName,
    E2E_RUN_ID: runId,
    E2E_SUITE: "seat-contention",
    E2E_FE_URL: profile.frontendUrl,
    E2E_HEADLESS: String(profile.headless),
    E2E_SLOW_MO_MS: String(profile.slowMoMs),
    E2E_NAVIGATION_TIMEOUT_MS: String(profile.navigationTimeoutMs),
    E2E_WAITROOM_TIMEOUT_MS: String(profile.waitroomTimeoutMs),
    E2E_PAYMENT_TIMEOUT_MS: String(profile.paymentTimeoutMs),
    E2E_CONTENTION_GATE_TIMEOUT_MS: String(profile.gateTimeoutMs),
    E2E_CONTENTION_RESULT_TIMEOUT_MS: String(profile.resultTimeoutMs),
    E2E_CONTENTION_REVIEW_MS: String(profile.reviewPauseMs),
    E2E_DIAGNOSTIC_TRACE: String(profile.diagnosticTrace),
    E2E_KEEP_BROWSER_OPEN: String(options.keepOpen),
  };

  const childArguments = options.testSuite
    ? [
        ...invocation.prefixArguments,
        "exec",
        "vitest",
        "run",
        "e2e/config/contention-profile.test.ts",
        "e2e/coordination/reservation-attempt-gate.test.ts",
        "e2e/reporting/contention-evidence.test.ts",
        "e2e/reporting/contention-types.test.ts",
        "e2e/flows/seat-contention.flow.test.ts",
        "e2e/fixtures/seat-contention.fixture.test.ts",
        "e2e/pages/ticket-selection.page.test.ts",
        "e2e/presentation/participant-label.test.ts",
        "e2e/presentation/tile-windows.test.ts",
        "e2e/scripts/run-seat-contention.test.ts",
      ]
    : [
        ...invocation.prefixArguments,
        "exec",
        "playwright",
        "test",
        "e2e/tests/seat-contention.spec.ts",
        "--project=chromium",
      ];
  const result = spawnSync(invocation.command, childArguments, {
    cwd: process.cwd(),
    env: childEnvironment,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  const childStatus = result.status ?? CONTENTION_EXIT_CODE.CONTENTION_FAILED;
  if (options.testSuite) return childStatus;
  return resolveContentionChildExit(
    childStatus,
    existsSync(
      resolve(
        process.cwd(),
        "test-results",
        "seat-contention",
        runId,
        "contention-result.json",
      ),
    ),
  );
}

export function resolveContentionChildExit(
  childStatus: number,
  resultExists: boolean,
) {
  if (childStatus === 0) return CONTENTION_EXIT_CODE.SUCCESS;
  return resultExists
    ? CONTENTION_EXIT_CODE.CONTENTION_FAILED
    : CONTENTION_EXIT_CODE.EVIDENCE_FAILED;
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
    process.exitCode = await runSeatContention(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown failure");
    process.exitCode = mapContentionRunnerErrorToExitCode(error);
  }
}

if (/run-seat-contention\.(?:ts|js|mts|mjs)$/.test(process.argv[1] ?? "")) {
  void main();
}
