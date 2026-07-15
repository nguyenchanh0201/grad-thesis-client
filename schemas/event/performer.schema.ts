import { z } from "zod";
import { BigIntIdSchema } from "../api";

export const PerformerSchema = z.object({
  id: BigIntIdSchema,
  name: z.string(),
  avatarUrl: z.string().url().nullish(),
  bio: z.string().nullish(),
  role: z.string(),
});

export type Performer = z.infer<typeof PerformerSchema>;
