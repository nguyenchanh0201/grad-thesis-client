import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parse } from "dotenv";
import { z } from "zod";

import type {
  CompletionMode,
  ExecutionProfile,
  VnpaySandboxProfile,
} from "./profile";

const PROFILE_NAME = /^[a-z0-9][a-z0-9_-]*$/;
const SAFE_LABEL = /^[\p{L}\p{N}][\p{L}\p{N} _-]{0,39}$/u;

const ENVIRONMENT_KEYS = [
  "E2E_RUN_LABEL",
  "E2E_FE_URL",
  "E2E_API_URL",
  "E2E_API_READY_PATH",
  "E2E_EVENT_SLUG",
  "E2E_EVENT_TITLE",
  "E2E_INVENTORY_MODE",
  "E2E_SEAT_LABEL",
  "E2E_TICKET_TYPE_NAME",
  "E2E_TICKET_TYPE_ID",
  "E2E_GA_QUANTITY",
  "E2E_CUSTOMER_A_LABEL",
  "E2E_CUSTOMER_A_EMAIL",
  "E2E_CUSTOMER_A_PASSWORD",
  "E2E_CUSTOMER_A_RECIPIENT_FULL_NAME",
  "E2E_CUSTOMER_A_RECIPIENT_EMAIL",
  "E2E_CUSTOMER_A_RECIPIENT_COUNTRY_CODE",
  "E2E_CUSTOMER_A_RECIPIENT_PHONE",
  "E2E_CUSTOMER_A_RECIPIENT_ID_PASSPORT",
  "E2E_CUSTOMER_B_LABEL",
  "E2E_CUSTOMER_B_EMAIL",
  "E2E_CUSTOMER_B_PASSWORD",
  "E2E_CUSTOMER_B_RECIPIENT_FULL_NAME",
  "E2E_CUSTOMER_B_RECIPIENT_EMAIL",
  "E2E_CUSTOMER_B_RECIPIENT_COUNTRY_CODE",
  "E2E_CUSTOMER_B_RECIPIENT_PHONE",
  "E2E_CUSTOMER_B_RECIPIENT_ID_PASSPORT",
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
  "E2E_CONTENTION_GATE_TIMEOUT_MS",
  "E2E_CONTENTION_RESULT_TIMEOUT_MS",
  "E2E_CONTENTION_MAX_RELEASE_SKEW_MS",
  "E2E_CONTENTION_REVIEW_MS",
  "E2E_TICKET_DIALOG_REVIEW_MS",
  "E2E_TICKET_REVIEW_MS",
  "E2E_HEADLESS",
  "E2E_SLOW_MO_MS",
  "E2E_CONTENTION_TILE_WINDOWS",
  "E2E_CONTENTION_WINDOW_WIDTH",
  "E2E_CONTENTION_WINDOW_HEIGHT",
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
const positiveInteger = (fallback: number, maximum = 600_000) =>
  z.preprocess(
    (value) => value ?? String(fallback),
    z.coerce.number().int().positive().max(maximum),
  );
const nonNegativeInteger = (fallback: number, maximum = 600_000) =>
  z.preprocess(
    (value) => value ?? String(fallback),
    z.coerce.number().int().nonnegative().max(maximum),
  );
const booleanValue = (fallback: boolean) =>
  z.preprocess(
    (value) => value ?? String(fallback),
    z.enum(["true", "false"]).transform((value) => value === "true"),
  );

const rawSchema = z
  .object({
    E2E_RUN_LABEL: requiredText,
    E2E_FE_URL: z.url(),
    E2E_API_URL: z.url(),
    E2E_API_READY_PATH: z
      .string()
      .trim()
      .startsWith("/")
      .default("/health/ready"),
    E2E_EVENT_SLUG: requiredText,
    E2E_EVENT_TITLE: requiredText,
    E2E_INVENTORY_MODE: z.enum(["seated", "ga"]),
    E2E_SEAT_LABEL: optionalText,
    E2E_TICKET_TYPE_NAME: optionalText,
    E2E_TICKET_TYPE_ID: optionalText,
    E2E_GA_QUANTITY: positiveInteger(2, 100),
    E2E_CUSTOMER_A_LABEL: z
      .string()
      .trim()
      .regex(SAFE_LABEL)
      .default("Customer A"),
    E2E_CUSTOMER_A_EMAIL: z.email(),
    E2E_CUSTOMER_A_PASSWORD: requiredText,
    E2E_CUSTOMER_A_RECIPIENT_FULL_NAME: requiredText,
    E2E_CUSTOMER_A_RECIPIENT_EMAIL: z.email(),
    E2E_CUSTOMER_A_RECIPIENT_COUNTRY_CODE: z
      .string()
      .trim()
      .regex(/^\+\d{1,3}$/),
    E2E_CUSTOMER_A_RECIPIENT_PHONE: requiredText,
    E2E_CUSTOMER_A_RECIPIENT_ID_PASSPORT: optionalText,
    E2E_CUSTOMER_B_LABEL: z
      .string()
      .trim()
      .regex(SAFE_LABEL)
      .default("Customer B"),
    E2E_CUSTOMER_B_EMAIL: z.email(),
    E2E_CUSTOMER_B_PASSWORD: requiredText,
    E2E_CUSTOMER_B_RECIPIENT_FULL_NAME: requiredText,
    E2E_CUSTOMER_B_RECIPIENT_EMAIL: z.email(),
    E2E_CUSTOMER_B_RECIPIENT_COUNTRY_CODE: z
      .string()
      .trim()
      .regex(/^\+\d{1,3}$/),
    E2E_CUSTOMER_B_RECIPIENT_PHONE: requiredText,
    E2E_CUSTOMER_B_RECIPIENT_ID_PASSPORT: optionalText,
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
    E2E_WAITROOM_TIMEOUT_MS: positiveInteger(300_000),
    E2E_PAYMENT_TIMEOUT_MS: positiveInteger(180_000),
    E2E_CONTENTION_GATE_TIMEOUT_MS: positiveInteger(30_000),
    E2E_CONTENTION_RESULT_TIMEOUT_MS: positiveInteger(30_000),
    E2E_CONTENTION_MAX_RELEASE_SKEW_MS: positiveInteger(2_000, 10_000),
    E2E_CONTENTION_REVIEW_MS: nonNegativeInteger(10_000),
    E2E_TICKET_DIALOG_REVIEW_MS: nonNegativeInteger(10_000),
    E2E_TICKET_REVIEW_MS: nonNegativeInteger(10_000),
    E2E_HEADLESS: booleanValue(false),
    E2E_SLOW_MO_MS: nonNegativeInteger(750, 10_000),
    E2E_CONTENTION_TILE_WINDOWS: booleanValue(true),
    E2E_CONTENTION_WINDOW_WIDTH: positiveInteger(960, 8_000),
    E2E_CONTENTION_WINDOW_HEIGHT: positiveInteger(900, 8_000),
    E2E_DIAGNOSTIC_TRACE: booleanValue(false),
  })
  .superRefine((value, context) => {
    validateTargetUrl(value.E2E_FE_URL, "E2E_FE_URL", context);
    validateTargetUrl(value.E2E_API_URL, "E2E_API_URL", context);

    if (value.E2E_INVENTORY_MODE === "seated" && !value.E2E_SEAT_LABEL) {
      issue(context, "E2E_SEAT_LABEL", "is required for seated contention");
    }
    if (
      value.E2E_INVENTORY_MODE === "seated" &&
      value.E2E_SEAT_LABEL?.trim().toUpperCase() === "AUTO"
    ) {
      issue(
        context,
        "E2E_SEAT_LABEL",
        "must identify one exact seat and cannot be AUTO",
      );
    }
    if (value.E2E_INVENTORY_MODE === "ga" && !value.E2E_TICKET_TYPE_NAME) {
      issue(context, "E2E_TICKET_TYPE_NAME", "is required for GA contention");
    }
    if (
      value.E2E_CUSTOMER_A_EMAIL.toLowerCase() ===
      value.E2E_CUSTOMER_B_EMAIL.toLowerCase()
    ) {
      issue(
        context,
        "E2E_CUSTOMER_B_EMAIL",
        "must identify a different account from Customer A",
      );
    }
    if (
      value.E2E_CUSTOMER_A_LABEL.toLowerCase() ===
      value.E2E_CUSTOMER_B_LABEL.toLowerCase()
    ) {
      issue(
        context,
        "E2E_CUSTOMER_B_LABEL",
        "must differ from Customer A label",
      );
    }
    for (const [field, label] of [
      ["E2E_CUSTOMER_A_LABEL", value.E2E_CUSTOMER_A_LABEL],
      ["E2E_CUSTOMER_B_LABEL", value.E2E_CUSTOMER_B_LABEL],
    ] as const) {
      if (
        label
          .toLowerCase()
          .includes(value.E2E_CUSTOMER_A_EMAIL.toLowerCase()) ||
        label.toLowerCase().includes(value.E2E_CUSTOMER_B_EMAIL.toLowerCase())
      ) {
        issue(context, field, "must not contain a participant email");
      }
    }

    if (
      value.E2E_COMPLETION_MODE === "reservation-only" &&
      value.E2E_PAYMENT_METHOD
    ) {
      issue(
        context,
        "E2E_PAYMENT_METHOD",
        "must be empty for reservation-only completion",
      );
    }
    if (
      value.E2E_COMPLETION_MODE === "mock-payment-success" &&
      value.E2E_PAYMENT_METHOD !== "mock"
    ) {
      issue(
        context,
        "E2E_PAYMENT_METHOD",
        "must be mock for mock-payment-success",
      );
    }
    if (value.E2E_COMPLETION_MODE === "vnpay-sandbox-success") {
      if (value.E2E_PAYMENT_METHOD !== "vnpay") {
        issue(
          context,
          "E2E_PAYMENT_METHOD",
          "must be vnpay for VNPay sandbox completion",
        );
      }
      for (const [field, setting] of [
        ["E2E_VNPAY_SANDBOX_ORIGIN", value.E2E_VNPAY_SANDBOX_ORIGIN],
        ["E2E_VNPAY_BANK_CODE", value.E2E_VNPAY_BANK_CODE],
        ["E2E_VNPAY_CARD_NUMBER", value.E2E_VNPAY_CARD_NUMBER],
        ["E2E_VNPAY_CARDHOLDER_NAME", value.E2E_VNPAY_CARDHOLDER_NAME],
        ["E2E_VNPAY_CARD_ISSUE_DATE", value.E2E_VNPAY_CARD_ISSUE_DATE],
        ["E2E_VNPAY_OTP", value.E2E_VNPAY_OTP],
      ] as const) {
        if (!setting)
          issue(context, field, "is required for VNPay sandbox completion");
      }
      if (value.E2E_VNPAY_SANDBOX_ORIGIN) {
        const url = new URL(value.E2E_VNPAY_SANDBOX_ORIGIN);
        if (
          url.protocol !== "https:" ||
          url.hostname !== "sandbox.vnpayment.vn"
        ) {
          issue(
            context,
            "E2E_VNPAY_SANDBOX_ORIGIN",
            "must be the official https://sandbox.vnpayment.vn origin",
          );
        }
      }
      if (
        value.E2E_VNPAY_CARD_ISSUE_DATE &&
        !/^\d{2}\/\d{2}$/.test(value.E2E_VNPAY_CARD_ISSUE_DATE)
      ) {
        issue(context, "E2E_VNPAY_CARD_ISSUE_DATE", "must use MM/YY format");
      }
    }
  });

export type ParticipantId = "A" | "B";

export type ContentionParticipantProfile = {
  id: ParticipantId;
  label: string;
  email: string;
  password: string;
  recipientFullName: string;
  recipientEmail: string;
  recipientCountryCode: string;
  recipientPhone: string;
  recipientIdPassport?: string;
};

export type ContentionExecutionProfile = {
  profileName: string;
  runLabel: string;
  frontendUrl: string;
  apiUrl: string;
  apiReadyPath: string;
  eventSlug: string;
  eventTitle: string;
  inventoryMode: "seated" | "ga";
  seatLabel: string;
  ticketTypeName?: string;
  ticketTypeId?: string;
  ticketQuantity: number;
  participants: readonly [
    ContentionParticipantProfile,
    ContentionParticipantProfile,
  ];
  completionMode: CompletionMode;
  paymentMethod?: "mock" | "vnpay";
  vnpaySandbox?: VnpaySandboxProfile;
  navigationTimeoutMs: number;
  waitroomTimeoutMs: number;
  paymentTimeoutMs: number;
  gateTimeoutMs: number;
  resultTimeoutMs: number;
  maxReleaseSkewMs: number;
  reviewPauseMs: number;
  ticketDialogReviewMs: number;
  ticketReviewMs: number;
  headless: boolean;
  slowMoMs: number;
  tileWindows: boolean;
  windowWidth: number;
  windowHeight: number;
  diagnosticTrace: boolean;
};

export class ContentionProfileValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(
      `Invalid contention profile:\n${issues.map((item) => `- ${item}`).join("\n")}`,
    );
    this.name = "ContentionProfileValidationError";
    this.issues = issues;
  }
}

export async function loadContentionProfile(
  profileName: string,
  options: { profilesDirectory?: string; environment?: Environment } = {},
): Promise<ContentionExecutionProfile> {
  if (!PROFILE_NAME.test(profileName)) {
    throw new ContentionProfileValidationError([
      "profileName must contain only lowercase letters, digits, dash, or underscore",
    ]);
  }
  const profilesDirectory =
    options.profilesDirectory ?? resolve(process.cwd(), "e2e", "profiles");
  let fileValues: Record<string, string>;
  try {
    fileValues = parse(
      await readFile(resolve(profilesDirectory, `${profileName}.env`), "utf8"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ContentionProfileValidationError([
        `profile '${profileName}' was not found in e2e/profiles`,
      ]);
    }
    throw error;
  }
  const environment = options.environment ?? process.env;
  const overrides = Object.fromEntries(
    ENVIRONMENT_KEYS.flatMap((key) =>
      environment[key] === undefined ? [] : [[key, environment[key]]],
    ),
  );
  const parsed = rawSchema.safeParse({ ...fileValues, ...overrides });
  if (!parsed.success) {
    throw new ContentionProfileValidationError(
      parsed.error.issues.map(
        (item) => `${String(item.path[0] ?? "profile")}: ${item.message}`,
      ),
    );
  }
  const value = parsed.data;
  const participant = (id: ParticipantId): ContentionParticipantProfile => ({
    id,
    label: value[`E2E_CUSTOMER_${id}_LABEL`],
    email: value[`E2E_CUSTOMER_${id}_EMAIL`],
    password: value[`E2E_CUSTOMER_${id}_PASSWORD`],
    recipientFullName: value[`E2E_CUSTOMER_${id}_RECIPIENT_FULL_NAME`],
    recipientEmail: value[`E2E_CUSTOMER_${id}_RECIPIENT_EMAIL`],
    recipientCountryCode: value[`E2E_CUSTOMER_${id}_RECIPIENT_COUNTRY_CODE`],
    recipientPhone: value[`E2E_CUSTOMER_${id}_RECIPIENT_PHONE`],
    recipientIdPassport: value[`E2E_CUSTOMER_${id}_RECIPIENT_ID_PASSPORT`],
  });

  return {
    profileName,
    runLabel: value.E2E_RUN_LABEL,
    frontendUrl: normalizeUrl(value.E2E_FE_URL),
    apiUrl: normalizeUrl(value.E2E_API_URL),
    apiReadyPath: value.E2E_API_READY_PATH,
    eventSlug: value.E2E_EVENT_SLUG,
    eventTitle: value.E2E_EVENT_TITLE,
    inventoryMode: value.E2E_INVENTORY_MODE,
    seatLabel: value.E2E_SEAT_LABEL ?? "",
    ticketTypeName: value.E2E_TICKET_TYPE_NAME,
    ticketTypeId: value.E2E_TICKET_TYPE_ID,
    ticketQuantity: value.E2E_GA_QUANTITY,
    participants: [participant("A"), participant("B")],
    completionMode: value.E2E_COMPLETION_MODE,
    paymentMethod:
      value.E2E_PAYMENT_METHOD === "mock" ||
      value.E2E_PAYMENT_METHOD === "vnpay"
        ? value.E2E_PAYMENT_METHOD
        : undefined,
    vnpaySandbox:
      value.E2E_COMPLETION_MODE === "vnpay-sandbox-success"
        ? {
            origin: normalizeUrl(value.E2E_VNPAY_SANDBOX_ORIGIN!),
            bankCode: value.E2E_VNPAY_BANK_CODE!,
            cardNumber: value.E2E_VNPAY_CARD_NUMBER!,
            cardholderName: value.E2E_VNPAY_CARDHOLDER_NAME!,
            cardIssueDate: value.E2E_VNPAY_CARD_ISSUE_DATE!,
            otp: value.E2E_VNPAY_OTP!,
          }
        : undefined,
    navigationTimeoutMs: value.E2E_NAVIGATION_TIMEOUT_MS,
    waitroomTimeoutMs: value.E2E_WAITROOM_TIMEOUT_MS,
    paymentTimeoutMs: value.E2E_PAYMENT_TIMEOUT_MS,
    gateTimeoutMs: value.E2E_CONTENTION_GATE_TIMEOUT_MS,
    resultTimeoutMs: value.E2E_CONTENTION_RESULT_TIMEOUT_MS,
    maxReleaseSkewMs: value.E2E_CONTENTION_MAX_RELEASE_SKEW_MS,
    reviewPauseMs: value.E2E_CONTENTION_REVIEW_MS,
    ticketDialogReviewMs: value.E2E_TICKET_DIALOG_REVIEW_MS,
    ticketReviewMs: value.E2E_TICKET_REVIEW_MS,
    headless: value.E2E_HEADLESS,
    slowMoMs: value.E2E_SLOW_MO_MS,
    tileWindows: value.E2E_CONTENTION_TILE_WINDOWS,
    windowWidth: value.E2E_CONTENTION_WINDOW_WIDTH,
    windowHeight: value.E2E_CONTENTION_WINDOW_HEIGHT,
    diagnosticTrace: value.E2E_DIAGNOSTIC_TRACE,
  };
}

export function participantExecutionProfile(
  profile: ContentionExecutionProfile,
  participant: ContentionParticipantProfile,
): ExecutionProfile {
  return {
    profileName: `${profile.profileName}-${participant.id.toLowerCase()}`,
    runLabel: profile.runLabel,
    frontendUrl: profile.frontendUrl,
    apiUrl: profile.apiUrl,
    apiReadyPath: profile.apiReadyPath,
    email: participant.email,
    password: participant.password,
    eventSlug: profile.eventSlug,
    eventTitle: profile.eventTitle,
    inventoryMode: "seated",
    seatLabel: profile.seatLabel || profile.ticketTypeName || "GA",
    seatSelectionMode: "exact",
    recipientFullName: participant.recipientFullName,
    recipientEmail: participant.recipientEmail,
    recipientCountryCode: participant.recipientCountryCode,
    recipientPhone: participant.recipientPhone,
    recipientIdPassport: participant.recipientIdPassport,
    completionMode: profile.completionMode,
    paymentMethod: profile.paymentMethod,
    vnpaySandbox: profile.vnpaySandbox,
    navigationTimeoutMs: profile.navigationTimeoutMs,
    waitroomTimeoutMs: profile.waitroomTimeoutMs,
    paymentTimeoutMs: profile.paymentTimeoutMs,
    headless: profile.headless,
    slowMoMs: profile.slowMoMs,
    ticketDialogReviewMs: profile.ticketDialogReviewMs,
    ticketReviewMs: profile.ticketReviewMs,
    diagnosticTrace: profile.diagnosticTrace,
  };
}

export function contentionSensitiveValues(profile: ContentionExecutionProfile) {
  return [
    ...profile.participants.flatMap((item) => [
      item.email,
      item.password,
      item.recipientFullName,
      item.recipientEmail,
      item.recipientPhone,
      item.recipientIdPassport,
    ]),
    profile.vnpaySandbox?.cardNumber,
    profile.vnpaySandbox?.otp,
  ].filter((value): value is string => Boolean(value));
}

export function projectSafeContentionProfile(
  profile: ContentionExecutionProfile,
) {
  return {
    profileName: profile.profileName,
    runLabel: profile.runLabel,
    frontendUrl: profile.frontendUrl,
    apiUrl: profile.apiUrl,
    eventSlug: profile.eventSlug,
    eventTitle: profile.eventTitle,
    inventoryMode: profile.inventoryMode,
    seatLabel: profile.seatLabel,
    ticketTypeName: profile.ticketTypeName,
    ticketTypeId: profile.ticketTypeId,
    ticketQuantity: profile.ticketQuantity,
    participantLabels: profile.participants.map((item) => item.label),
    completionMode: profile.completionMode,
    gateTimeoutMs: profile.gateTimeoutMs,
    resultTimeoutMs: profile.resultTimeoutMs,
    maxReleaseSkewMs: profile.maxReleaseSkewMs,
    reviewPauseMs: profile.reviewPauseMs,
    headless: profile.headless,
    slowMoMs: profile.slowMoMs,
    tileWindows: profile.tileWindows,
    diagnosticTrace: profile.diagnosticTrace,
  };
}

export function applyContentionOverrides(
  profile: ContentionExecutionProfile,
  overrides: { headed?: boolean; trace?: boolean },
) {
  return {
    ...profile,
    headless: overrides.headed ? false : profile.headless,
    diagnosticTrace: overrides.trace ? true : profile.diagnosticTrace,
  };
}

function validateTargetUrl(
  value: string,
  field: string,
  context: z.RefinementCtx,
) {
  const url = new URL(value);
  if (url.protocol === "https:") return;
  if (url.protocol === "http:" && isLoopbackHost(url.hostname)) return;
  issue(
    context,
    field,
    "must use HTTPS unless the hostname is localhost or loopback",
  );
}

function issue(context: z.RefinementCtx, field: string, message: string) {
  context.addIssue({ code: "custom", path: [field], message });
}

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function isLoopbackHost(hostname: string) {
  return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
}
