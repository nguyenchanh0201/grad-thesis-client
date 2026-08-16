import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parse } from "dotenv";
import { z } from "zod";

const PROFILE_NAME = /^[a-z0-9][a-z0-9_-]*$/;

const ENVIRONMENT_KEYS = [
  "E2E_RUN_LABEL",
  "E2E_FE_URL",
  "E2E_API_URL",
  "E2E_API_READY_PATH",
  "E2E_EMAIL",
  "E2E_PASSWORD",
  "E2E_EVENT_SLUG",
  "E2E_EVENT_TITLE",
  "E2E_INVENTORY_MODE",
  "E2E_SEAT_LABEL",
  "E2E_SEAT_SELECTION_MODE",
  "E2E_RECIPIENT_FULL_NAME",
  "E2E_RECIPIENT_EMAIL",
  "E2E_RECIPIENT_COUNTRY_CODE",
  "E2E_RECIPIENT_PHONE",
  "E2E_RECIPIENT_ID_PASSPORT",
  "E2E_COMPLETION_MODE",
  "E2E_PAYMENT_METHOD",
  "E2E_VNPAY_SANDBOX_ORIGIN",
  "E2E_VNPAY_BANK_CODE",
  "E2E_VNPAY_CARD_NUMBER",
  "E2E_VNPAY_CARDHOLDER_NAME",
  "E2E_VNPAY_CARD_ISSUE_DATE",
  "E2E_VNPAY_OTP",
  "E2E_NAVIGATION_TIMEOUT_MS",
  "E2E_WAITROOM_TIMEOUT_MS",
  "E2E_PAYMENT_TIMEOUT_MS",
  "E2E_HEADLESS",
  "E2E_SLOW_MO_MS",
  "E2E_TICKET_DIALOG_REVIEW_MS",
  "E2E_TICKET_REVIEW_MS",
  "E2E_DIAGNOSTIC_TRACE",
] as const;

type EnvironmentKey = (typeof ENVIRONMENT_KEYS)[number];
type Environment = Partial<Record<EnvironmentKey, string>> &
  Record<string, string | undefined>;

const requiredText = z.string().trim().min(1, "is required");
const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);
const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.url().optional(),
);
const positiveInteger = (fallback: number) =>
  z.preprocess(
    (value) => value ?? String(fallback),
    z.coerce.number().int().positive(),
  );
const nonNegativeInteger = (fallback: number) =>
  z.preprocess(
    (value) => value ?? String(fallback),
    z.coerce.number().int().nonnegative(),
  );
const booleanValue = (fallback: boolean) =>
  z.preprocess(
    (value) => value ?? String(fallback),
    z.enum(["true", "false"]).transform((value) => value === "true"),
  );

const rawProfileSchema = z
  .object({
    E2E_RUN_LABEL: requiredText,
    E2E_FE_URL: z.url(),
    E2E_API_URL: z.url(),
    E2E_API_READY_PATH: z
      .string()
      .trim()
      .startsWith("/")
      .default("/health/ready"),
    E2E_EMAIL: z.email(),
    E2E_PASSWORD: requiredText,
    E2E_EVENT_SLUG: requiredText,
    E2E_EVENT_TITLE: requiredText,
    E2E_INVENTORY_MODE: z.literal("seated"),
    E2E_SEAT_LABEL: requiredText,
    E2E_SEAT_SELECTION_MODE: z
      .enum(["exact", "preferred-or-first-available", "first-available"])
      .default("exact"),
    E2E_RECIPIENT_FULL_NAME: requiredText,
    E2E_RECIPIENT_EMAIL: z.email(),
    E2E_RECIPIENT_COUNTRY_CODE: z
      .string()
      .trim()
      .regex(/^\+\d{1,3}$/),
    E2E_RECIPIENT_PHONE: requiredText,
    E2E_RECIPIENT_ID_PASSPORT: optionalText,
    E2E_COMPLETION_MODE: z.enum([
      "reservation-only",
      "mock-payment-success",
      "vnpay-sandbox-success",
    ]),
    E2E_PAYMENT_METHOD: optionalText,
    E2E_VNPAY_SANDBOX_ORIGIN: optionalUrl,
    E2E_VNPAY_BANK_CODE: optionalText,
    E2E_VNPAY_CARD_NUMBER: optionalText,
    E2E_VNPAY_CARDHOLDER_NAME: optionalText,
    E2E_VNPAY_CARD_ISSUE_DATE: optionalText,
    E2E_VNPAY_OTP: optionalText,
    E2E_NAVIGATION_TIMEOUT_MS: positiveInteger(30_000),
    E2E_WAITROOM_TIMEOUT_MS: positiveInteger(120_000),
    E2E_PAYMENT_TIMEOUT_MS: positiveInteger(60_000),
    E2E_HEADLESS: booleanValue(false),
    E2E_SLOW_MO_MS: nonNegativeInteger(150),
    E2E_TICKET_DIALOG_REVIEW_MS: nonNegativeInteger(5_000),
    E2E_TICKET_REVIEW_MS: nonNegativeInteger(10_000),
    E2E_DIAGNOSTIC_TRACE: booleanValue(false),
  })
  .superRefine((profile, context) => {
    for (const [key, value] of [
      ["E2E_FE_URL", profile.E2E_FE_URL],
      ["E2E_API_URL", profile.E2E_API_URL],
    ] as const) {
      const url = new URL(value);
      if (url.protocol === "https:") continue;
      if (url.protocol === "http:" && isLoopbackHost(url.hostname)) continue;
      context.addIssue({
        code: "custom",
        path: [key],
        message: "must use HTTPS unless the hostname is localhost or loopback",
      });
    }

    if (
      profile.E2E_COMPLETION_MODE === "mock-payment-success" &&
      profile.E2E_PAYMENT_METHOD !== "mock"
    ) {
      context.addIssue({
        code: "custom",
        path: ["E2E_PAYMENT_METHOD"],
        message:
          "must be mock when E2E_COMPLETION_MODE is mock-payment-success",
      });
    }

    if (
      profile.E2E_COMPLETION_MODE === "reservation-only" &&
      profile.E2E_PAYMENT_METHOD
    ) {
      context.addIssue({
        code: "custom",
        path: ["E2E_PAYMENT_METHOD"],
        message: "must be empty when E2E_COMPLETION_MODE is reservation-only",
      });
    }

    if (profile.E2E_COMPLETION_MODE === "vnpay-sandbox-success") {
      if (profile.E2E_PAYMENT_METHOD !== "vnpay") {
        context.addIssue({
          code: "custom",
          path: ["E2E_PAYMENT_METHOD"],
          message:
            "must be vnpay when E2E_COMPLETION_MODE is vnpay-sandbox-success",
        });
      }

      for (const [key, value] of [
        ["E2E_VNPAY_SANDBOX_ORIGIN", profile.E2E_VNPAY_SANDBOX_ORIGIN],
        ["E2E_VNPAY_BANK_CODE", profile.E2E_VNPAY_BANK_CODE],
        ["E2E_VNPAY_CARD_NUMBER", profile.E2E_VNPAY_CARD_NUMBER],
        ["E2E_VNPAY_CARDHOLDER_NAME", profile.E2E_VNPAY_CARDHOLDER_NAME],
        ["E2E_VNPAY_CARD_ISSUE_DATE", profile.E2E_VNPAY_CARD_ISSUE_DATE],
        ["E2E_VNPAY_OTP", profile.E2E_VNPAY_OTP],
      ] as const) {
        if (!value) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: "is required for VNPay sandbox completion",
          });
        }
      }

      if (profile.E2E_VNPAY_SANDBOX_ORIGIN) {
        const sandboxUrl = new URL(profile.E2E_VNPAY_SANDBOX_ORIGIN);
        if (
          sandboxUrl.protocol !== "https:" ||
          sandboxUrl.hostname !== "sandbox.vnpayment.vn"
        ) {
          context.addIssue({
            code: "custom",
            path: ["E2E_VNPAY_SANDBOX_ORIGIN"],
            message: "must be the official https://sandbox.vnpayment.vn origin",
          });
        }
      }

      if (
        profile.E2E_VNPAY_CARD_ISSUE_DATE &&
        !/^\d{2}\/\d{2}$/.test(profile.E2E_VNPAY_CARD_ISSUE_DATE)
      ) {
        context.addIssue({
          code: "custom",
          path: ["E2E_VNPAY_CARD_ISSUE_DATE"],
          message: "must use MM/YY format",
        });
      }
    }
  });

export type CompletionMode =
  | "reservation-only"
  | "mock-payment-success"
  | "vnpay-sandbox-success";
export type VnpaySandboxProfile = {
  origin: string;
  bankCode: string;
  cardNumber: string;
  cardholderName: string;
  cardIssueDate: string;
  otp: string;
};
export type SeatSelectionMode =
  | "exact"
  | "preferred-or-first-available"
  | "first-available";

export type ExecutionProfile = {
  profileName: string;
  runLabel: string;
  frontendUrl: string;
  apiUrl: string;
  apiReadyPath: string;
  email: string;
  password: string;
  eventSlug: string;
  eventTitle: string;
  inventoryMode: "seated";
  seatLabel: string;
  seatSelectionMode: SeatSelectionMode;
  recipientFullName: string;
  recipientEmail: string;
  recipientCountryCode: string;
  recipientPhone: string;
  recipientIdPassport?: string;
  completionMode: CompletionMode;
  paymentMethod?: "mock" | "vnpay";
  vnpaySandbox?: VnpaySandboxProfile;
  navigationTimeoutMs: number;
  waitroomTimeoutMs: number;
  paymentTimeoutMs: number;
  headless: boolean;
  slowMoMs: number;
  ticketDialogReviewMs: number;
  ticketReviewMs: number;
  diagnosticTrace: boolean;
};

export class ProfileValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(
      `Invalid E2E profile:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
    );
    this.name = "ProfileValidationError";
    this.issues = issues;
  }
}

export type LoadExecutionProfileOptions = {
  profilesDirectory?: string;
  environment?: Environment;
};

export async function loadExecutionProfile(
  profileName: string,
  options: LoadExecutionProfileOptions = {},
): Promise<ExecutionProfile> {
  if (!PROFILE_NAME.test(profileName)) {
    throw new ProfileValidationError([
      "profileName must contain only lowercase letters, digits, dash, or underscore",
    ]);
  }

  const profilesDirectory =
    options.profilesDirectory ?? resolve(process.cwd(), "e2e", "profiles");
  const profilePath = resolve(profilesDirectory, `${profileName}.env`);
  let fileValues: Record<string, string>;
  try {
    fileValues = parse(await readFile(profilePath, "utf8"));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new ProfileValidationError([
        `profile '${profileName}' was not found in e2e/profiles`,
      ]);
    }
    throw error;
  }

  const environment = options.environment ?? process.env;
  const overrides = Object.fromEntries(
    ENVIRONMENT_KEYS.flatMap((key) => {
      const value = environment[key];
      return value === undefined ? [] : [[key, value]];
    }),
  );
  const result = rawProfileSchema.safeParse({ ...fileValues, ...overrides });

  if (!result.success) {
    throw new ProfileValidationError(
      result.error.issues.map((issue) => {
        const field = issue.path[0] ?? "profile";
        return `${String(field)}: ${issue.message}`;
      }),
    );
  }

  const raw = result.data;
  return {
    profileName,
    runLabel: raw.E2E_RUN_LABEL,
    frontendUrl: normalizeUrl(raw.E2E_FE_URL),
    apiUrl: normalizeUrl(raw.E2E_API_URL),
    apiReadyPath: raw.E2E_API_READY_PATH,
    email: raw.E2E_EMAIL,
    password: raw.E2E_PASSWORD,
    eventSlug: raw.E2E_EVENT_SLUG,
    eventTitle: raw.E2E_EVENT_TITLE,
    inventoryMode: raw.E2E_INVENTORY_MODE,
    seatLabel: raw.E2E_SEAT_LABEL,
    seatSelectionMode: raw.E2E_SEAT_SELECTION_MODE,
    recipientFullName: raw.E2E_RECIPIENT_FULL_NAME,
    recipientEmail: raw.E2E_RECIPIENT_EMAIL,
    recipientCountryCode: raw.E2E_RECIPIENT_COUNTRY_CODE,
    recipientPhone: raw.E2E_RECIPIENT_PHONE,
    recipientIdPassport: raw.E2E_RECIPIENT_ID_PASSPORT,
    completionMode: raw.E2E_COMPLETION_MODE,
    paymentMethod:
      raw.E2E_PAYMENT_METHOD === "mock" || raw.E2E_PAYMENT_METHOD === "vnpay"
        ? raw.E2E_PAYMENT_METHOD
        : undefined,
    vnpaySandbox:
      raw.E2E_COMPLETION_MODE === "vnpay-sandbox-success"
        ? {
            origin: normalizeUrl(raw.E2E_VNPAY_SANDBOX_ORIGIN!),
            bankCode: raw.E2E_VNPAY_BANK_CODE!,
            cardNumber: raw.E2E_VNPAY_CARD_NUMBER!,
            cardholderName: raw.E2E_VNPAY_CARDHOLDER_NAME!,
            cardIssueDate: raw.E2E_VNPAY_CARD_ISSUE_DATE!,
            otp: raw.E2E_VNPAY_OTP!,
          }
        : undefined,
    navigationTimeoutMs: raw.E2E_NAVIGATION_TIMEOUT_MS,
    waitroomTimeoutMs: raw.E2E_WAITROOM_TIMEOUT_MS,
    paymentTimeoutMs: raw.E2E_PAYMENT_TIMEOUT_MS,
    headless: raw.E2E_HEADLESS,
    slowMoMs: raw.E2E_SLOW_MO_MS,
    ticketDialogReviewMs: raw.E2E_TICKET_DIALOG_REVIEW_MS,
    ticketReviewMs: raw.E2E_TICKET_REVIEW_MS,
    diagnosticTrace: raw.E2E_DIAGNOSTIC_TRACE,
  };
}

export function profileSensitiveValues(profile: ExecutionProfile) {
  return [
    profile.password,
    profile.vnpaySandbox?.cardNumber,
    profile.vnpaySandbox?.otp,
  ].filter((value): value is string => Boolean(value));
}

export function projectSafeProfile(profile: ExecutionProfile) {
  return {
    profileName: profile.profileName,
    runLabel: profile.runLabel,
    frontendUrl: profile.frontendUrl,
    apiUrl: profile.apiUrl,
    eventSlug: profile.eventSlug,
    eventTitle: profile.eventTitle,
    inventoryMode: profile.inventoryMode,
    seatLabel: profile.seatLabel,
    seatSelectionMode: profile.seatSelectionMode,
    completionMode: profile.completionMode,
    headless: profile.headless,
    slowMoMs: profile.slowMoMs,
    ticketDialogReviewMs: profile.ticketDialogReviewMs,
    ticketReviewMs: profile.ticketReviewMs,
    diagnosticTrace: profile.diagnosticTrace,
  };
}

export function applyProfileOverrides(
  profile: ExecutionProfile,
  overrides: { headed?: boolean; trace?: boolean },
): ExecutionProfile {
  return {
    ...profile,
    headless: overrides.headed ? false : profile.headless,
    diagnosticTrace: overrides.trace ? true : profile.diagnosticTrace,
  };
}

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function isLoopbackHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}
