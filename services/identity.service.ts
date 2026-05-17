import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import { IdentityMeResponse, IdentityMeResponseSchema } from "@/schemas/api";

export const getIdentityMe = async (): Promise<IdentityMeResponse> => {
  const response = await apiClient.get("/identity/me");
  return parseOrThrow(IdentityMeResponseSchema, response);
};

type UpdateIdentityMePayload = {
  fullName?: string | null;
  phone?: string | null;
};

export const updateIdentityMe = async (
  payload: UpdateIdentityMePayload,
): Promise<IdentityMeResponse> => {
  const response = await apiClient.patch("/identity/me", payload);
  return parseOrThrow(IdentityMeResponseSchema, response);
};
