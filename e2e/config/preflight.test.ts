import { describe, expect, it, vi } from "vitest";

import type { ExecutionProfile } from "./profile";
import { PreflightError, runTargetPreflight } from "./preflight";

function profile(overrides: Partial<ExecutionProfile> = {}): ExecutionProfile {
  return {
    profileName: "local",
    runLabel: "local",
    frontendUrl: "http://localhost:3000",
    apiUrl: "http://localhost:5004/api/v1",
    apiReadyPath: "/health/ready",
    email: "observer@example.test",
    password: "secret",
    eventSlug: "event",
    eventTitle: "Event",
    inventoryMode: "seated",
    seatLabel: "A1",
    recipientFullName: "Observer",
    recipientEmail: "observer@example.test",
    recipientCountryCode: "+84",
    recipientPhone: "901234567",
    completionMode: "reservation-only",
    navigationTimeoutMs: 30_000,
    waitroomTimeoutMs: 120_000,
    paymentTimeoutMs: 60_000,
    headless: true,
    slowMoMs: 0,
    ticketDialogReviewMs: 0,
    ticketReviewMs: 0,
    diagnosticTrace: false,
    ...overrides,
    seatSelectionMode: overrides.seatSelectionMode ?? "exact",
  };
}

function response(
  url: string,
  status = 200,
  headers: Record<string, string> = {},
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    headers: new Headers(headers),
  } as Response;
}

describe("runTargetPreflight", () => {
  it("accepts a reachable frontend and direct API target", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response("http://localhost:3000/"))
      .mockResolvedValueOnce(
        response("http://localhost:5004/api/v1/health/ready"),
      );

    const result = await runTargetPreflight(profile(), { fetchImpl });

    expect(result.routing).toBe("direct-api");
    expect(result.frontend.status).toBe(200);
    expect(result.api.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(
      fetchImpl.mock.calls.every((call) => call[1]?.method === "GET"),
    ).toBe(true);
  });

  it("accepts an API exposed through the frontend origin", async () => {
    const proxied = profile({ apiUrl: "http://localhost:3000/api/v1" });
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response("http://localhost:3000/"))
      .mockResolvedValueOnce(
        response("http://localhost:3000/api/v1/health/ready"),
      );

    const result = await runTargetPreflight(proxied, { fetchImpl });
    expect(result.routing).toBe("frontend-proxy");
  });

  it("classifies an unavailable target without leaking credentials", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("down"));

    const error = await runTargetPreflight(profile(), { fetchImpl }).catch(
      (cause: unknown) => cause,
    );
    expect(error).toBeInstanceOf(PreflightError);
    expect((error as PreflightError).code).toBe("TARGET_UNAVAILABLE");
    expect(String(error)).not.toContain("secret");
  });

  it("rejects an explicit frontend API marker that points elsewhere", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response("https://tickets.example.test/", 200, {
          "x-ticketing-api-origin": "https://wrong-api.example.test/api/v1",
        }),
      )
      .mockResolvedValueOnce(
        response("https://api.example.test/api/v1/health/ready"),
      );

    const error = await runTargetPreflight(
      profile({
        frontendUrl: "https://tickets.example.test",
        apiUrl: "https://api.example.test/api/v1",
      }),
      { fetchImpl },
    ).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(PreflightError);
    expect((error as PreflightError).code).toBe("TARGET_MISMATCH");
  });
});
