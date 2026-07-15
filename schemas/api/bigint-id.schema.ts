import { z } from "zod";

export const BigIntIdSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val));
