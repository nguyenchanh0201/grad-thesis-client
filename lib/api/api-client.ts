import { API_CONFIG } from "@/core/constants";
import {
  ApiError,
  ConflictError,
  NetworkError,
  UnauthorizedError,
} from "@/core/error";
import { useAuthStore } from "@/lib/store/auth.store";
import { ApiErrorSchema } from "@/schemas/api";
import axios, {
  type AxiosRequestConfig,
  AxiosError,
  isAxiosError,
} from "axios";
import axiosRetry from "axios-retry";
import { v4 as uuidv4 } from "uuid";

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true, // Required so the browser sends the httpOnly refresh token cookie
  headers: {
    "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
  },
});

// Separate Axios instance for the refresh call.
// No interceptors
export const refreshClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const correlationId = uuidv4();
  config.headers = config.headers ?? {};
  config.headers[API_CONFIG.HEADERS.CORRELATION_ID] = correlationId;
  config.headers[API_CONFIG.HEADERS.REQUEST_ID] = correlationId;
  const { accessToken, user } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  const userId = user?.id ?? process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "1";
  config.headers["x-mock-user-id"] = userId;
  return config;
});

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (!isAxiosError(error)) return false;
    const status = error.response?.status;
    if (!status) return true;
    return [429, 500, 502, 503, 504].includes(status);
  },
});

// Queue of requests waiting for the in-flight refresh to complete
let isRefreshing = false;
let waitingQueue: Array<{
  resolve: () => void;
  reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown) {
  waitingQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve()));
  waitingQueue = [];
}

// Endpoints that must not trigger a token refresh cycle on 401
const SKIP_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/signin",
  "/auth/signup",
  "/auth/session/refresh",
  "/auth/logout",
  "/auth/signout",
  "/auth/google",
  "/tickets/heartbeat",
];

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => {
    const resBody = response.data;
    if (resBody && resBody.success === false) {
      return Promise.reject({
        status: response.status,
        message: resBody.message || "There is something wrong",
        data: resBody.data,
      });
    }
    return resBody;
  },
  async (error: AxiosError<ApiError>) => {
    if (!error.response) {
      return Promise.reject(new NetworkError(undefined, error));
    }

    const status = error.response.status;
    const config = error.config as RetryableConfig | undefined;

    // Attempt silent token refresh on 401 for non-auth endpoints
    if (
      status === 401 &&
      config &&
      !config._retry &&
      !SKIP_REFRESH_PATHS.some((p) => config?.url?.includes(p))
    ) {
      config._retry = true;

      if (isRefreshing) {
        // Enqueue and wait for the ongoing refresh to finish
        return new Promise<void>((resolve, reject) => {
          waitingQueue.push({ resolve, reject });
        }).then(() => apiClient(config));
      }

      isRefreshing = true;

      return refreshClient
        .post("/auth/session/refresh", undefined, {
          headers: { rid: "session", "st-auth-mode": "cookie" },
        })
        .then(() => {
          flushQueue(null);
          return apiClient(config);
        })
        .catch((refreshError) => {
          flushQueue(refreshError);
          useAuthStore.getState().clearAuth();
          return Promise.reject(
            new UnauthorizedError(
              "Session expired. Please log in again.",
              refreshError,
            ),
          );
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    const responseData = error.response.data;
    let originalErrorMessage =
      "There is something wrong. Please try again later.";
    let errorCode = "INTERNAL_ERROR";

    const parsedError = ApiErrorSchema.safeParse(responseData);
    if (parsedError.success) {
      originalErrorMessage = parsedError.data.error.message;
      errorCode = parsedError.data.error.code;
    }

    if (status === 401) {
      return Promise.reject(new UnauthorizedError(originalErrorMessage, error));
    }

    if (status === 409) {
      return Promise.reject(
        new ConflictError(originalErrorMessage, error, errorCode),
      );
    }

    return Promise.reject(
      new ApiError(originalErrorMessage, status, errorCode, error),
    );
  },
);
