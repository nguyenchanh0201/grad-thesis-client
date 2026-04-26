import { ValidationError } from "@/core/error";
import { z } from "zod";

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(z.treeifyError(result.error));
    throw new ValidationError("Invalid data response", result.error);
  }

  return result.data;
}
