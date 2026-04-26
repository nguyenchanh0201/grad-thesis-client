import { API_CONFIG } from "@/core/constants";
import {
  ApiError,
  ConflictError,
  NetworkError,
  UnauthorizedError,
} from "@/core/error";
import { ApiErrorSchema } from "@/schemas/api";
import axios, { AxiosError, isAxiosError } from "axios";
import axiosRetry from "axios-retry";
import { v4 as uuidv4 } from "uuid";

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
  },
});

apiClient.interceptors.request.use((config) => {
  const correlationId = uuidv4();
  config.headers = config.headers ?? {};
  config.headers[API_CONFIG.HEADERS.CORRELATION_ID] = correlationId;
  config.headers[API_CONFIG.HEADERS.REQUEST_ID] = correlationId;
  return config;
});

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (!isAxiosError(error)) {
      return false;
    }

    const status = error.response?.status;

    if (!status) {
      return true;
    }

    return [429, 500, 502, 503, 504].includes(status);
  },
});

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
  (error: AxiosError<ApiError>) => {
    if (!error.response) {
      return Promise.reject(new NetworkError(undefined, error));
    }

    const status = error.response.status;
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
