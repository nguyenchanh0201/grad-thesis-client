import {
  ConflictError,
  ApiError,
  isAppError,
  NetworkError,
  UnauthorizedError,
} from "@/core/error";
import type { LoginInput, RegisterInput } from "@/schemas/auth";
import { AuthUser } from "@/schemas/user";
import { apiClient, refreshClient } from "@/lib/api/api-client";
import {
  appendGoogleOAuthState,
  consumeGoogleOAuthState,
  createGoogleOAuthState,
  getGoogleRedirectUri,
  getGoogleOAuthState,
  storeGoogleOAuthState,
  toRedirectQueryParams,
} from "@/lib/auth/google-oauth";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { getIdentityMe } from "@/services/identity.service";
import { isAxiosError } from "axios";

export type AuthResult = {
  user: AuthUser;
  accessToken: string | null;
};

type SuperTokensFormField = {
  id: "email" | "password";
  value: string;
};

type SuperTokensUser = {
  id: string;
  email?: string;
  emails?: string[];
  loginMethods?: Array<{ email?: string }>;
};

type SuperTokensAuthResponse =
  | {
      status: "OK";
      user: SuperTokensUser;
    }
  | { status: "WRONG_CREDENTIALS_ERROR" }
  | { status: "EMAIL_ALREADY_EXISTS_ERROR" }
  | { status: "FIELD_ERROR"; formFields?: Array<{ id: string; error: string }> }
  | { status: "SIGN_IN_NOT_ALLOWED"; reason?: string }
  | { status: "SIGN_UP_NOT_ALLOWED"; reason?: string }
  | { status: "GENERAL_ERROR"; message?: string };

type SuperTokensAuthorisationUrlResponse =
  | {
      status: "OK";
      urlWithQueryParams: string;
      pkceCodeVerifier?: string;
    }
  | { status: "GENERAL_ERROR"; message?: string };

type SuperTokensThirdPartyAuthResponse =
  | {
      status: "OK";
      createdNewRecipeUser?: boolean;
      user: SuperTokensUser;
    }
  | { status: "NO_EMAIL_GIVEN_BY_PROVIDER" }
  | { status: "SIGN_IN_UP_NOT_ALLOWED"; reason?: string }
  | { status: "GENERAL_ERROR"; message?: string };

function toFormFields(
  data: Pick<LoginInput, "email" | "password">,
): SuperTokensFormField[] {
  return [
    { id: "email", value: data.email },
    { id: "password", value: data.password },
  ];
}

function toAuthUser(user: SuperTokensUser): AuthUser {
  const email =
    user.email ??
    user.emails?.[0] ??
    user.loginMethods?.find((method) => method.email)?.email ??
    `${user.id}@supertokens.local`;

  return {
    id: user.id,
    email,
    role: "USER",
  };
}

async function getCurrentAuthUser(fallback: AuthUser): Promise<AuthUser> {
  try {
    const me = await getIdentityMe();
    return {
      id: me.data.user.id,
      email: me.data.user.email,
      role: me.data.user.role,
      name: me.data.user.fullName ?? fallback.name,
      phone: me.data.user.phone ?? fallback.phone,
    };
  } catch {
    throw new UnauthorizedError("Authentication failed. Please try again.");
  }
}

function normalizeAuthError(error: unknown): never {
  if (isAxiosError(error)) {
    if (!error.response) {
      throw new NetworkError(undefined, error);
    }

    const message =
      typeof error.response.data === "object" &&
      error.response.data !== null &&
      "message" in error.response.data
        ? String(error.response.data.message)
        : "Authentication request failed.";

    if (error.response.status === 401) {
      throw new UnauthorizedError(message, error);
    }

    if (error.response.status === 409) {
      throw new ConflictError(message, error);
    }

    throw new ApiError(message, error.response.status, "AUTH_ERROR", error);
  }

  throw error;
}

async function authenticate(
  path: "/auth/signin" | "/auth/signup",
  data: Pick<LoginInput, "email" | "password">,
): Promise<AuthResult> {
  try {
    const response = await refreshClient.post<SuperTokensAuthResponse>(
      path,
      { formFields: toFormFields(data) },
      { headers: { rid: "emailpassword", "st-auth-mode": "cookie" } },
    );
    const result = response.data;

    if (result.status === "OK") {
      const fallback = toAuthUser(result.user);
      return {
        user: await getCurrentAuthUser(fallback),
        accessToken: null,
      };
    }

    if (result.status === "WRONG_CREDENTIALS_ERROR") {
      throw new UnauthorizedError("Invalid credentials");
    }

    if (result.status === "EMAIL_ALREADY_EXISTS_ERROR") {
      throw new ConflictError(
        "An account with this email already exists.",
        undefined,
        "EMAIL_TAKEN",
      );
    }

    if (result.status === "FIELD_ERROR") {
      const message =
        result.formFields?.map((field) => field.error).join(" ") ??
        "Invalid authentication details.";
      throw new ConflictError(message, undefined, "AUTH_FIELD_ERROR");
    }

    if (result.status === "SIGN_IN_NOT_ALLOWED") {
      throw new UnauthorizedError(
        result.reason ?? "This account is not allowed to sign in.",
      );
    }

    if (result.status === "SIGN_UP_NOT_ALLOWED") {
      throw new ConflictError(
        result.reason ?? "Sign up is not allowed for this account.",
        undefined,
        "SIGN_UP_NOT_ALLOWED",
      );
    }

    throw new ApiError(
      result.message ?? "Authentication request failed.",
      400,
      "AUTH_ERROR",
    );
  } catch (error) {
    normalizeAuthError(error);
  }
}

export async function login(
  data: Pick<LoginInput, "email" | "password">,
): Promise<AuthResult> {
  return authenticate("/auth/signin", data);
}

export async function register(
  data: Pick<RegisterInput, "email" | "password">,
): Promise<AuthResult> {
  return authenticate("/auth/signup", data);
}

export async function getGoogleAuthorisationUrl(
  redirect: string | null | undefined,
): Promise<string> {
  try {
    const redirectTo = resolvePostAuthRedirect(redirect);
    const redirectURIOnProviderDashboard = getGoogleRedirectUri();
    const response =
      await refreshClient.get<SuperTokensAuthorisationUrlResponse>(
        "/auth/authorisationurl",
        {
          params: {
            thirdPartyId: "google",
            redirectURIOnProviderDashboard,
          },
          headers: { rid: "thirdparty", "st-auth-mode": "cookie" },
        },
      );
    const result = response.data;

    if (result.status !== "OK") {
      throw new ApiError(
        result.message ?? "Google sign-in is not available.",
        400,
        "GOOGLE_AUTH_UNAVAILABLE",
      );
    }

    const state =
      getGoogleOAuthState(result.urlWithQueryParams) ??
      createGoogleOAuthState();

    storeGoogleOAuthState({
      state,
      redirectTo,
      pkceCodeVerifier: result.pkceCodeVerifier,
    });

    return appendGoogleOAuthState(result.urlWithQueryParams, state);
  } catch (error) {
    normalizeAuthError(error);
  }
}

export async function completeGoogleSignIn(
  searchParams: URLSearchParams,
): Promise<AuthResult & { redirectTo: string }> {
  const storedState = consumeGoogleOAuthState(searchParams.get("state"));
  if (!storedState) {
    throw new UnauthorizedError("Invalid Google sign-in state.");
  }

  try {
    const response =
      await refreshClient.post<SuperTokensThirdPartyAuthResponse>(
        "/auth/signinup",
        {
          thirdPartyId: "google",
          redirectURIInfo: {
            redirectURIOnProviderDashboard: getGoogleRedirectUri(),
            redirectURIQueryParams: toRedirectQueryParams(searchParams),
            pkceCodeVerifier: storedState.pkceCodeVerifier,
          },
        },
        { headers: { rid: "thirdparty", "st-auth-mode": "cookie" } },
      );
    const result = response.data;

    if (result.status === "OK") {
      const fallback = toAuthUser(result.user);
      return {
        user: await getCurrentAuthUser(fallback),
        accessToken: null,
        redirectTo: storedState.redirectTo,
      };
    }

    if (result.status === "NO_EMAIL_GIVEN_BY_PROVIDER") {
      throw new UnauthorizedError(
        "Google did not provide an email address for this account.",
      );
    }

    if (result.status === "SIGN_IN_UP_NOT_ALLOWED") {
      throw new UnauthorizedError(
        result.reason ?? "This Google account is not allowed to sign in.",
      );
    }

    throw new ApiError(
      result.message ?? "Google sign-in failed.",
      400,
      "GOOGLE_AUTH_FAILED",
    );
  } catch (error) {
    normalizeAuthError(error);
  }
}

export async function logout(): Promise<void> {
  await apiClient
    .post("/auth/signout", undefined, {
      headers: { rid: "session", "st-auth-mode": "cookie" },
    })
    .catch(() => {});
}

export type ProfileInput = {
  name: string;
  phone: string;
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof UnauthorizedError) {
    return error.message || "Authentication failed. Please try again.";
  }
  if (error instanceof ConflictError) {
    if (isAppError(error) && error.code === "EMAIL_TAKEN") {
      return "An account with this email already exists.";
    }
    if (
      isAppError(error) &&
      (error.code === "AUTH_FIELD_ERROR" ||
        error.code === "SIGN_UP_NOT_ALLOWED")
    ) {
      return error.message;
    }
    return "A conflict occurred. Please try again.";
  }
  if (error instanceof NetworkError) {
    return "Connection error. Please check your internet and try again.";
  }
  return "Something went wrong. Please try again.";
}
