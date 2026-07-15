export class AppError extends Error {
  public status: number;
  public code: string;
  public originalError?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    originalError?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    status: number,
    code: string,
    originalError?: unknown,
  ) {
    super(message, status, code, originalError);
  }
}

export class NetworkError extends AppError {
  constructor(message = "Network connection lost", originalError?: unknown) {
    super(message, 503, "NETWORK_ERROR", originalError);
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "Resource conflict",
    originalError?: unknown,
    code = "CONFLICT",
  ) {
    super(message, 409, code, originalError);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", originalError?: unknown) {
    super(message, 401, "UNAUTHORIZED", originalError);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 422, "SCHEMA_VALIDATION_ERROR", originalError);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isConflictError(error: unknown): boolean {
  return isAppError(error) && error.status === 409;
}

export function isAuthError(error: unknown): boolean {
  return isAppError(error) && (error.status === 401 || error.status === 403);
}

export function isRetryableError(error: unknown): boolean {
  return isAppError(error) && (error.status === 429 || error.status >= 500);
}
