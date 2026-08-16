import type { ExecutionProfile } from "./profile";

export type PreflightFailureCode = "TARGET_UNAVAILABLE" | "TARGET_MISMATCH";

export class PreflightError extends Error {
  readonly code: PreflightFailureCode;
  readonly status: number | null;

  constructor(
    code: PreflightFailureCode,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "PreflightError";
    this.code = code;
    this.status = status;
  }
}

export type TargetPreflightResult = {
  checkedAt: string;
  routing: "direct-api" | "frontend-proxy";
  frontend: { origin: string; status: number };
  api: { origin: string; status: number; readyPath: string };
};

export type TargetPreflightOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export async function runTargetPreflight(
  profile: ExecutionProfile,
  options: TargetPreflightOptions = {},
): Promise<TargetPreflightResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? profile.navigationTimeoutMs;
  const frontendUrl = new URL(profile.frontendUrl);
  const apiUrl = new URL(profile.apiUrl);
  const readyUrl = `${profile.apiUrl.replace(/\/+$/, "")}${profile.apiReadyPath}`;

  let frontendResponse: Response;
  let apiResponse: Response;
  try {
    frontendResponse = await fetchImpl(frontendUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    apiResponse = await fetchImpl(readyUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new PreflightError(
      "TARGET_UNAVAILABLE",
      "The configured frontend or API readiness target could not be reached.",
    );
  }

  if (!frontendResponse.ok) {
    throw new PreflightError(
      "TARGET_UNAVAILABLE",
      `The configured frontend returned HTTP ${frontendResponse.status}.`,
      frontendResponse.status,
    );
  }
  if (!apiResponse.ok) {
    throw new PreflightError(
      "TARGET_UNAVAILABLE",
      `The configured API readiness check returned HTTP ${apiResponse.status}.`,
      apiResponse.status,
    );
  }

  assertFinalOrigin("frontend", frontendResponse.url, [frontendUrl.origin]);
  assertFinalOrigin("API", apiResponse.url, [
    apiUrl.origin,
    frontendUrl.origin,
  ]);

  const declaredApiTarget = frontendResponse.headers.get(
    "x-ticketing-api-origin",
  );
  if (declaredApiTarget && !matchesConfiguredApi(declaredApiTarget, apiUrl)) {
    throw new PreflightError(
      "TARGET_MISMATCH",
      "The frontend declares a different API target than the selected profile.",
    );
  }

  return {
    checkedAt: new Date().toISOString(),
    routing:
      frontendUrl.origin === apiUrl.origin ? "frontend-proxy" : "direct-api",
    frontend: {
      origin: frontendUrl.origin,
      status: frontendResponse.status,
    },
    api: {
      origin: apiUrl.origin,
      status: apiResponse.status,
      readyPath: profile.apiReadyPath,
    },
  };
}

function assertFinalOrigin(
  label: string,
  responseUrl: string,
  allowedOrigins: readonly string[],
) {
  if (!responseUrl) return;
  let origin: string;
  try {
    origin = new URL(responseUrl).origin;
  } catch {
    return;
  }
  if (!allowedOrigins.includes(origin)) {
    throw new PreflightError(
      "TARGET_MISMATCH",
      `The ${label} readiness request was redirected to an unexpected origin.`,
    );
  }
}

function matchesConfiguredApi(declared: string, configured: URL) {
  try {
    const candidate = new URL(declared);
    if (candidate.origin !== configured.origin) return false;
    const candidatePath = candidate.pathname.replace(/\/+$/, "");
    const configuredPath = configured.pathname.replace(/\/+$/, "");
    return (
      candidatePath === "" ||
      candidatePath === "/" ||
      candidatePath === configuredPath ||
      configuredPath.startsWith(`${candidatePath}/`) ||
      candidatePath.startsWith(`${configuredPath}/`)
    );
  } catch {
    return false;
  }
}
