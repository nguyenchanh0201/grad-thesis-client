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
import { runTargetPreflight } from "../config/preflight";
import { generateRunId } from "./run-customer-booking";
import {
  CONTENTION_EXIT_CODE,
  mapContentionRunnerErrorToExitCode,
  parseContentionRunnerArguments,
  resolveContentionChildExit,
} from "./run-seat-contention";

export async function runGaContention(arguments_: readonly string[]) {
  const options = parseContentionRunnerArguments(arguments_);
  const loaded = await loadContentionProfile(options.profileName);
  if (loaded.inventoryMode !== "ga") {
    throw new ContentionProfileValidationError([
      "E2E_INVENTORY_MODE must be ga for e2e:ga-contention",
    ]);
  }
  const profile = applyContentionOverrides(loaded, options);
  const preflight = options.testSuite
    ? null
    : await runTargetPreflight(
        participantExecutionProfile(profile, profile.participants[0]),
      );
  const inventory = options.testSuite
    ? null
    : await inspectGaInventory(profile.apiUrl, profile.eventSlug, {
        name: profile.ticketTypeName!,
        configuredId: profile.ticketTypeId,
      });

  console.log(
    JSON.stringify(
      {
        profile: projectSafeContentionProfile(profile),
        preflight,
        inventory,
        mode: options.check
          ? "check"
          : options.testSuite
            ? "ga-contention-tests"
            : "ga-contention",
        keepBrowserOpen: options.keepOpen,
      },
      null,
      2,
    ),
  );
  if (options.check) return CONTENTION_EXIT_CODE.SUCCESS;

  const invocation = resolvePnpmInvocation();
  const runId = generateRunId();
  const childEnvironment = {
    ...process.env,
    E2E_CONTENTION_PROFILE: profile.profileName,
    E2E_RUN_ID: runId,
    E2E_SUITE: "ga-contention",
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
        "e2e/pages/ticket-selection.page.test.ts",
        "e2e/reporting/ga-contention-types.test.ts",
        "e2e/reporting/ga-contention-evidence.test.ts",
        "e2e/scripts/run-ga-contention.test.ts",
      ]
    : [
        ...invocation.prefixArguments,
        "exec",
        "playwright",
        "test",
        "e2e/tests/ga-contention.spec.ts",
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
        "ga-contention",
        runId,
        "ga-contention-result.json",
      ),
    ),
  );
}

export async function inspectGaInventory(
  apiUrl: string,
  eventSlug: string,
  target: { name: string; configuredId?: string },
) {
  const response = await fetch(
    `${apiUrl}/events/slug/${encodeURIComponent(eventSlug)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) {
    throw new ContentionProfileValidationError([
      `GA event lookup returned HTTP ${response.status}`,
    ]);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : payload;
  if (data.isSeated !== false) {
    throw new ContentionProfileValidationError([
      "E2E_EVENT_SLUG must identify a non-seated GA event",
    ]);
  }
  const ticketTypes = Array.isArray(data.ticketTypes) ? data.ticketTypes : [];
  const matches = ticketTypes.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const value = item as Record<string, unknown>;
    return (
      String(value.typeName ?? value.name ?? value.label ?? "") === target.name
    );
  }) as Record<string, unknown>[];
  if (matches.length !== 1) {
    throw new ContentionProfileValidationError([
      `E2E_TICKET_TYPE_NAME must match exactly one ticket type; found ${matches.length}`,
    ]);
  }
  const resolvedId = String(matches[0].id ?? "");
  if (target.configuredId && target.configuredId !== resolvedId) {
    throw new ContentionProfileValidationError([
      "E2E_TICKET_TYPE_ID does not match the configured ticket type name",
    ]);
  }
  return {
    ticketTypeId: resolvedId,
    ticketTypeName: target.name,
    isSeated: false,
  };
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
    process.exitCode = await runGaContention(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown failure");
    process.exitCode = mapContentionRunnerErrorToExitCode(error);
  }
}

if (/run-ga-contention\.(?:ts|js|mts|mjs)$/.test(process.argv[1] ?? "")) {
  void main();
}
