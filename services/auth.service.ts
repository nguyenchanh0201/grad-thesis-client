import {
  ConflictError,
  isAppError,
  NetworkError,
  UnauthorizedError,
} from "@/core/error";
import type { LoginInput, RegisterInput } from "@/schemas/auth";
import { AuthUser } from "@/schemas/user";

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
};

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export async function login(
  data: Pick<LoginInput, "email" | "password">,
): Promise<AuthResult> {
  await delay(900);

  if (data.email === "fail@test.com") {
    throw new UnauthorizedError("Invalid credentials");
  }
  if (data.email === "network@test.com") {
    throw new NetworkError();
  }

  return {
    user: { id: "mock-user-1", email: data.email, role: "USER" },
    accessToken: "mock-access-token",
  };
}

export async function register(
  data: Pick<RegisterInput, "email" | "password">,
): Promise<AuthResult> {
  await delay(900);

  if (data.email === "exists@test.com") {
    throw new ConflictError(
      "Email already registered",
      undefined,
      "EMAIL_TAKEN",
    );
  }
  if (data.email === "network@test.com") {
    throw new NetworkError();
  }

  return {
    user: { id: "mock-user-2", email: data.email, role: "USER" },
    accessToken: "mock-access-token",
  };
}

export type ProfileInput = {
  name: string;
  phone: string;
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof UnauthorizedError) {
    return "Incorrect email or password. Please try again.";
  }
  if (error instanceof ConflictError) {
    if (isAppError(error) && error.code === "EMAIL_TAKEN") {
      return "An account with this email already exists.";
    }
    return "A conflict occurred. Please try again.";
  }
  if (error instanceof NetworkError) {
    return "Connection error. Please check your internet and try again.";
  }
  return "Something went wrong. Please try again.";
}
