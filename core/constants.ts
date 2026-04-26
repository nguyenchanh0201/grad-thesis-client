import { SUPPORTED_LANGUAGES } from "@/lib/lang";

/**
 * API & Network Constants
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
  TIMEOUT: 15000, // 15s
  HEADERS: {
    CORRELATION_ID: "X-Correlation-Id",
    REQUEST_ID: "X-Request-Id",
    CONTENT_TYPE: "application/json",
  },
} as const;

/**
 * Pagination Defaults
 * Matches your Backend logic
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_LIMIT: 1,
  LIMIT_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * Auth & Storage Keys
 * Using a prefix prevents collisions with other apps on localhost
 */
const STORAGE_PREFIX = "APP_NAME_V1_";
export const STORAGE_KEYS = {
  ACCESS_TOKEN: `${STORAGE_PREFIX}access_token`,
  REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,
  USER_SETTINGS: `${STORAGE_PREFIX}user_settings`,
  THEME: `${STORAGE_PREFIX}theme`,
} as const;

/**
 * HTTP Status Codes
 * Useful for logic in Axios Interceptors
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NETWORK_ERROR: 503,
} as const;

/**
 * UI & UX Constants
 */
export const UI_CONFIG = {
  TOAST_DURATION: 4000, // 4s
  DEBOUNCE_DELAY: 300, // ms for search inputs
  MODAL_TRANSITION: 200, // ms
} as const;

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  FULL: "MMMM dd, yyyy HH:mm",
  API: "yyyy-MM-dd", // ISO format often expected by BE
} as const;

/**
 * Regular Expressions
 */
export const REGEX = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PASSWORD_STRENGTH:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
} as const;

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];
export const LANGUAGE_COOKIE = "preferred-lang";
export const DEFAULT_CURRENCY = "VND";
