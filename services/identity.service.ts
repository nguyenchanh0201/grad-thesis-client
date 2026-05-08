import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import { IdentityMeResponse, IdentityMeResponseSchema } from "@/schemas/api";

export const getIdentityMe = async (): Promise<IdentityMeResponse> => {
  const response = await apiClient.get("/identity/me");
  return parseOrThrow(IdentityMeResponseSchema, response);
};
